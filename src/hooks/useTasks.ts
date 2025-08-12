import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskFormData, FilterType } from '@/types/task';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from './useProfile';

export function useTasks() {
  const { user } = useUser();
  const { profile } = useProfile();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Fetch tasks
  const fetchTasks = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks((data as any[])?.map(item => ({
        ...item,
        reminder_settings: item.reminder_settings || { type: null, enabled: false }
      })) || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch tasks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Create task
  const createTask = async (taskData: TaskFormData) => {
    if (!user) return;
    
    try {
      const taskWithUser = {
        ...taskData,
        user_id: user.id
      };
      
      const { data, error } = await supabase
        .from('tasks')
        .insert([taskWithUser])
        .select()
        .single();

      if (error) throw error;
      
      const taskWithDefaults = {
        ...data,
        reminder_settings: data.reminder_settings || { type: null, enabled: false }
      };
      setTasks(prev => [taskWithDefaults as Task, ...prev]);
      toast({
        title: 'Success',
        description: 'Task created successfully',
      });
      
      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Update task
  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      const updatedTask = {
        ...data,
        reminder_settings: data.reminder_settings || { type: null, enabled: false }
      };
      setTasks(prev => prev.map(task => task.id === id ? updatedTask as Task : task));
      return data;
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Delete task
  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTasks(prev => prev.filter(task => task.id !== id));
      toast({
        title: 'Success',
        description: 'Task deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Toggle task completion
  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    await updateTask(id, { completed: !task.completed });
  };

  // Toggle task flag
  const toggleFlag = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    await updateTask(id, { flagged: !task.flagged });
  };

  // Filter tasks
  const getFilteredTasks = (filter: FilterType, searchQuery = '') => {
    let filtered = tasks;

    // Apply filter
    switch (filter) {
      case 'very-important':
        filtered = tasks.filter(task => task.flagged && !task.completed);
        break;
      case 'scheduled':
        filtered = tasks.filter(task => task.due_date && !task.completed);
        break;
      case 'completed':
        filtered = tasks.filter(task => task.completed);
        break;
      case 'flagged':
        filtered = tasks.filter(task => task.flagged);
        break;
      case 'all':
      default:
        filtered = tasks.filter(task => !task.completed);
        break;
    }

    // Apply search
    if (searchQuery.trim()) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  // Bulk operations
  const toggleSelectedTasks = (taskId: string) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const selectAllTasks = (taskIds: string[]) => {
    setSelectedTasks(new Set(taskIds));
  };

  const clearSelection = () => {
    setSelectedTasks(new Set());
  };

  const bulkMarkComplete = async () => {
    const taskIds = Array.from(selectedTasks);
    if (taskIds.length === 0) return;

    try {
      const updates = taskIds.map(id => 
        supabase
          .from('tasks')
          .update({ completed: true })
          .eq('id', id)
          .eq('user_id', user?.id)
      );

      await Promise.all(updates);
      
      setTasks(prev => 
        prev.map(task => 
          selectedTasks.has(task.id) 
            ? { ...task, completed: true }
            : task
        )
      );
      
      setSelectedTasks(new Set());
      toast({
        title: 'Success',
        description: `Marked ${taskIds.length} tasks as complete`,
      });
    } catch (error) {
      console.error('Error bulk updating tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to update tasks',
        variant: 'destructive',
      });
    }
  };

  const bulkDelete = async () => {
    const taskIds = Array.from(selectedTasks);
    if (taskIds.length === 0) return;

    try {
      const deletes = taskIds.map(id => 
        supabase
          .from('tasks')
          .delete()
          .eq('id', id)
          .eq('user_id', user?.id)
      );

      await Promise.all(deletes);
      
      setTasks(prev => 
        prev.filter(task => !selectedTasks.has(task.id))
      );
      
      setSelectedTasks(new Set());
      toast({
        title: 'Success',
        description: `Deleted ${taskIds.length} tasks`,
      });
    } catch (error) {
      console.error('Error bulk deleting tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete tasks',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
    } else {
      setTasks([]);
      setLoading(false);
    }
  }, [user]);

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
    toggleFlag,
    getFilteredTasks,
    refreshTasks: fetchTasks,
    selectedTasks,
    toggleSelectedTasks,
    selectAllTasks,
    clearSelection,
    bulkMarkComplete,
    bulkDelete,
    isAdmin: profile?.role === 'admin'
  };
}
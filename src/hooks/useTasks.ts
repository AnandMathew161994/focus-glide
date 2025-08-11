import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskFormData, FilterType } from '@/types/task';
import { useToast } from '@/hooks/use-toast';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks((data as Task[]) || []);
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
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) throw error;
      
      setTasks(prev => [data as Task, ...prev]);
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
      
      setTasks(prev => prev.map(task => task.id === id ? data as Task : task));
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

  useEffect(() => {
    fetchTasks();
  }, []);

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
  };
}
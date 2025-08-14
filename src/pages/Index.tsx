import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Plus, Search, Settings } from 'lucide-react';
import { FilterType, Task } from '@/types/task';
import { useTasks } from '@/hooks/useTasks';
import { AppSidebar } from '@/components/AppSidebar';
import { TaskList } from '@/components/TaskList';
import { TaskForm } from '@/components/TaskForm';
import { ChatBot } from '@/components/ChatBot';
import { AuthLayout, UserProfileButton } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Index = () => {
  const { user } = useUser();
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const {
    loading,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
    toggleFlag,
    getFilteredTasks,
    selectedTasks,
    toggleSelectedTasks,
    selectAllTasks,
    clearSelection,
    bulkMarkComplete,
    bulkDelete,
    isAdmin,
    refreshTasks
  } = useTasks();

  const filteredTasks = getFilteredTasks(currentFilter, searchQuery);

  // Calculate task counts for sidebar
  const taskCounts: Record<FilterType, number> = {
    all: getFilteredTasks('all').length,
    'very-important': getFilteredTasks('very-important').length,
    scheduled: getFilteredTasks('scheduled').length,
    completed: getFilteredTasks('completed').length,
    flagged: getFilteredTasks('flagged').length,
  };

  const handleCreateTask = async (data: any) => {
    await createTask(data);
  };

  const handleEditTask = async (data: any) => {
    if (editingTask) {
      await updateTask(editingTask.id, data);
      setEditingTask(null);
    }
  };

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
  };

  const getCurrentFilterLabel = () => {
    const filterLabels = {
      all: 'All',
      'very-important': 'Very Important',
      scheduled: 'Scheduled',
      completed: 'Completed',
      flagged: 'Flagged',
    };
    return filterLabels[currentFilter];
  };

  return (
    <AuthLayout>
      <div className="h-screen flex bg-background">
        {/* Sidebar */}
        <AppSidebar
          currentFilter={currentFilter}
          onFilterChange={setCurrentFilter}
          taskCounts={taskCounts}
        />

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-between p-4">
              <h1 className="text-2xl font-bold text-foreground">
                {getCurrentFilterLabel()}
              </h1>
              
              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                
                {/* Admin Button */}
                {isAdmin && (
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/admin'}
                    className="flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Admin
                  </Button>
                )}
                
                {/* Add Task Button */}
                <Button
                  onClick={() => setIsFormOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </Button>
                
                {/* User Profile */}
                <UserProfileButton />
              </div>
            </div>
          </header>

          {/* Task List */}
          <main className="flex-1 overflow-auto">
            <div className="max-w-4xl mx-auto p-4">
              <TaskList
                tasks={filteredTasks}
                onToggle={toggleTask}
                onToggleFlag={toggleFlag}
                onDelete={deleteTask}
                onEdit={handleEditClick}
                loading={loading}
                selectedTasks={selectedTasks}
                onToggleSelected={toggleSelectedTasks}
                onSelectAll={selectAllTasks}
                onClearSelection={clearSelection}
                onBulkComplete={bulkMarkComplete}
                onBulkDelete={bulkDelete}
              />
            </div>
          </main>
        </div>

        {/* Task Form Modals */}
        <TaskForm
          open={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleCreateTask}
          title="Create New Task"
        />

        <TaskForm
          open={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSubmit={handleEditTask}
          initialData={editingTask || undefined}
          title="Edit Task"
        />

        <ChatBot onTaskCreated={refreshTasks} />
      </div>
    </AuthLayout>
  );
};

export default Index;

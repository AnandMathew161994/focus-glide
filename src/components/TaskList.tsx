import { Task } from '@/types/task';
import { TaskItem } from './TaskItem';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, CheckCircle } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onToggleFlag: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  loading?: boolean;
  selectedTasks?: Set<string>;
  onToggleSelected?: (id: string) => void;
  onSelectAll?: (taskIds: string[]) => void;
  onClearSelection?: () => void;
  onBulkComplete?: () => void;
  onBulkDelete?: () => void;
}

export function TaskList({ 
  tasks, 
  onToggle, 
  onToggleFlag, 
  onDelete, 
  onEdit, 
  loading,
  selectedTasks = new Set(),
  onToggleSelected,
  onSelectAll,
  onClearSelection,
  onBulkComplete,
  onBulkDelete
}: TaskListProps) {
  const hasSelection = selectedTasks.size > 0;
  const allSelected = tasks.length > 0 && tasks.every(task => selectedTasks.has(task.id));
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-lg font-medium text-foreground mb-2">No tasks found</h3>
        <p className="text-muted-foreground">
          Create your first task to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions Header */}
      {tasks.length > 0 && onToggleSelected && (
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked) => {
                if (checked) {
                  onSelectAll?.(tasks.map(task => task.id));
                } else {
                  onClearSelection?.();
                }
              }}
            />
            <span className="text-sm font-medium">
              {hasSelection ? `${selectedTasks.size} selected` : 'Select all'}
            </span>
          </div>
          
          {hasSelection && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkComplete}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Mark Complete
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkDelete}
                className="flex items-center gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Task List */}
      <div className="divide-y divide-border">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={onToggle}
            onToggleFlag={onToggleFlag}
            onDelete={onDelete}
            onEdit={onEdit}
            selected={selectedTasks.has(task.id)}
            onToggleSelected={onToggleSelected}
          />
        ))}
      </div>
    </div>
  );
}
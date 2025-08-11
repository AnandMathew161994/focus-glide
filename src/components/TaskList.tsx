import { Task } from '@/types/task';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onToggleFlag: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  loading?: boolean;
}

export function TaskList({ tasks, onToggle, onToggleFlag, onDelete, onEdit, loading }: TaskListProps) {
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
    <div className="divide-y divide-border">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onToggleFlag={onToggleFlag}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
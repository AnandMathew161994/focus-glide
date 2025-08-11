import { useState } from 'react';
import { Flag, Calendar, Trash2, Edit } from 'lucide-react';
import { Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onToggleFlag: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

export function TaskItem({ task, onToggle, onToggleFlag, onDelete, onEdit }: TaskItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const formatDueDate = (date: string) => {
    try {
      return format(new Date(date), 'MMM d, yyyy h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div
      className="task-item group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onToggle(task.id)}
        className="flex-shrink-0"
      />
      
      <div className="flex-1 min-w-0">
        <div
          className={`font-medium ${
            task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
          }`}
        >
          {task.title}
        </div>
        
        {task.due_date && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDueDate(task.due_date)}</span>
          </div>
        )}
        
        {task.reminder_settings.enabled && (
          <div className="text-xs text-apple-blue mt-1">
            {task.reminder_settings.type === 'email' ? '📧' : '🔔'} Reminder set
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleFlag(task.id)}
          className={`w-8 h-8 p-0 text-muted-foreground hover:text-apple-orange transition-colors ${
            task.flagged ? 'text-apple-orange' : ''
          }`}
        >
          <Flag className="w-4 h-4" fill={task.flagged ? 'currentColor' : 'none'} />
        </Button>
        
        {isHovered && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(task)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(task.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
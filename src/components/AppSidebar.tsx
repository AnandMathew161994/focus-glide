import { Calendar, Check, Flag, List, Star } from 'lucide-react';
import { FilterType, CATEGORIES } from '@/types/task';

interface AppSidebarProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  taskCounts: Record<FilterType, number>;
}

const filterIcons = {
  all: List,
  'very-important': Star,
  scheduled: Calendar,
  completed: Check,
  flagged: Flag,
};

export function AppSidebar({ currentFilter, onFilterChange, taskCounts }: AppSidebarProps) {
  return (
    <div className="w-64 h-full bg-sidebar border-r border-sidebar-border p-4">
      <div className="space-y-1">
        {CATEGORIES.map(({ id, label }) => {
          const Icon = filterIcons[id as FilterType];
          const isActive = currentFilter === id;
          const count = taskCounts[id as FilterType] || 0;
          
          return (
            <button
              key={id}
              onClick={() => onFilterChange(id as FilterType)}
              className={`sidebar-button ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-4 h-4 mr-3" />
              <span className="flex-1 text-left">{label}</span>
              {count > 0 && (
                <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
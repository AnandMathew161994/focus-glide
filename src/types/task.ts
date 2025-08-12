export interface Task {
  id: string;
  title: string;
  completed: boolean;
  due_date?: string;
  category: string;
  flagged: boolean;
  reminder_settings: {
    type: 'email' | 'alarm' | null;
    enabled: boolean;
    reminder_time?: string;
  };
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface TaskFormData {
  title: string;
  category: string;
  due_date?: string;
  flagged: boolean;
  reminder_settings: {
    type: 'email' | 'alarm' | null;
    enabled: boolean;
    reminder_time?: string;
  };
}

export type FilterType = 'all' | 'very-important' | 'scheduled' | 'completed' | 'flagged';

export const CATEGORIES = [
  { id: 'all', label: 'All', color: 'apple-blue' },
  { id: 'very-important', label: 'Very Important', color: 'apple-red' },
  { id: 'scheduled', label: 'Scheduled', color: 'apple-orange' },
  { id: 'completed', label: 'Completed', color: 'apple-green' },
  { id: 'flagged', label: 'Flagged', color: 'apple-yellow' },
] as const;
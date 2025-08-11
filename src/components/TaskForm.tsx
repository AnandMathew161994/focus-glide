import { useState } from 'react';
import { TaskFormData } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => void;
  initialData?: Partial<TaskFormData>;
  title: string;
}

export function TaskForm({ open, onClose, onSubmit, initialData, title }: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    category: 'all',
    flagged: false,
    reminder_settings: {
      type: null,
      enabled: false,
    },
    ...initialData,
  });

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialData?.due_date ? new Date(initialData.due_date) : undefined
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    initialData?.due_date ? format(new Date(initialData.due_date), 'HH:mm') : '09:00'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let due_date: string | undefined;
    if (selectedDate) {
      const [hours, minutes] = selectedTime.split(':');
      const dateTime = new Date(selectedDate);
      dateTime.setHours(parseInt(hours), parseInt(minutes));
      due_date = dateTime.toISOString();
    }

    onSubmit({
      ...formData,
      due_date,
    });
    
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      title: '',
      category: 'all',
      flagged: false,
      reminder_settings: {
        type: null,
        enabled: false,
      },
    });
    setSelectedDate(undefined);
    setSelectedTime('09:00');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              placeholder="Enter task title"
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="very-important">Very Important</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="work">Work</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {selectedDate && (
            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="flagged"
              checked={formData.flagged}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, flagged: checked }))}
            />
            <Label htmlFor="flagged">Flag as important</Label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="reminder"
                checked={formData.reminder_settings.enabled}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({
                    ...prev,
                    reminder_settings: {
                      ...prev.reminder_settings,
                      enabled: checked,
                      type: checked ? 'alarm' : null,
                    }
                  }))
                }
              />
              <Label htmlFor="reminder">Enable reminder</Label>
            </div>

            {formData.reminder_settings.enabled && (
              <Select
                value={formData.reminder_settings.type || 'alarm'}
                onValueChange={(value: 'email' | 'alarm') =>
                  setFormData(prev => ({
                    ...prev,
                    reminder_settings: {
                      ...prev.reminder_settings,
                      type: value,
                    }
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alarm">Browser notification</SelectItem>
                  <SelectItem value="email">Email notification</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.title.trim()}>
              {initialData ? 'Update Task' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
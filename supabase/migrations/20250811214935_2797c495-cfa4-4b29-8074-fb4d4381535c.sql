-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  due_date TIMESTAMP WITH TIME ZONE,
  category TEXT DEFAULT 'all',
  flagged BOOLEAN NOT NULL DEFAULT false,
  reminder_settings JSONB DEFAULT '{"type": null, "enabled": false}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for now)
CREATE POLICY "Tasks are viewable by everyone" 
ON public.tasks 
FOR SELECT 
USING (true);

CREATE POLICY "Tasks can be created by everyone" 
ON public.tasks 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Tasks can be updated by everyone" 
ON public.tasks 
FOR UPDATE 
USING (true);

CREATE POLICY "Tasks can be deleted by everyone" 
ON public.tasks 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_tasks_completed ON public.tasks(completed);
CREATE INDEX idx_tasks_flagged ON public.tasks(flagged);
CREATE INDEX idx_tasks_category ON public.tasks(category);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
-- Revert user_id columns back to TEXT since Clerk uses text-based user IDs

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can view all tasks" ON public.tasks;

-- Convert user_id columns back to TEXT
ALTER TABLE public.profiles ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.tasks ALTER COLUMN user_id TYPE TEXT;

-- Update the security definer function to work with TEXT user IDs
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE user_id = (auth.jwt() ->> 'sub');
$$;

-- Create new RLS policies for profiles table using TEXT comparison
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

-- Create admin policy for profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.get_current_user_role() = 'admin');

-- Create new RLS policies for tasks table using TEXT comparison
CREATE POLICY "Users can view their own tasks" 
ON public.tasks 
FOR SELECT 
USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can create their own tasks" 
ON public.tasks 
FOR INSERT 
WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can update their own tasks" 
ON public.tasks 
FOR UPDATE 
USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can delete their own tasks" 
ON public.tasks 
FOR DELETE 
USING ((auth.jwt() ->> 'sub') = user_id);

-- Create admin policy for tasks
CREATE POLICY "Admins can view all tasks" 
ON public.tasks 
FOR SELECT 
USING (public.get_current_user_role() = 'admin');
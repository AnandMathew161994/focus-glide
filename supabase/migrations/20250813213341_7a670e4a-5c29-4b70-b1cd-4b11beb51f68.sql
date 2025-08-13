
-- Set up Clerk authentication integration with Supabase
-- We need to handle Clerk JWTs properly and create profiles automatically

-- First, let's create a function to extract user ID from Clerk JWT
CREATE OR REPLACE FUNCTION public.get_clerk_user_id()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json ->> 'sub',
    (auth.jwt() ->> 'sub')
  );
$$;

-- Update the get_current_user_role function to work with Clerk
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE(role, 'user') 
  FROM public.profiles 
  WHERE user_id = public.get_clerk_user_id();
$$;

-- Drop and recreate all RLS policies to use the new function
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can view all tasks" ON public.tasks;

-- Create new RLS policies for profiles table using Clerk user ID function
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = public.get_clerk_user_id());

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = public.get_clerk_user_id());

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (user_id = public.get_clerk_user_id());

-- Create admin policy for profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.get_current_user_role() = 'admin');

-- Create new RLS policies for tasks table using Clerk user ID function
CREATE POLICY "Users can view their own tasks" 
ON public.tasks 
FOR SELECT 
USING (user_id = public.get_clerk_user_id());

CREATE POLICY "Users can create their own tasks" 
ON public.tasks 
FOR INSERT 
WITH CHECK (user_id = public.get_clerk_user_id());

CREATE POLICY "Users can update their own tasks" 
ON public.tasks 
FOR UPDATE 
USING (user_id = public.get_clerk_user_id());

CREATE POLICY "Users can delete their own tasks" 
ON public.tasks 
FOR DELETE 
USING (user_id = public.get_clerk_user_id());

-- Create admin policy for tasks
CREATE POLICY "Admins can view all tasks" 
ON public.tasks 
FOR SELECT 
USING (public.get_current_user_role() = 'admin');

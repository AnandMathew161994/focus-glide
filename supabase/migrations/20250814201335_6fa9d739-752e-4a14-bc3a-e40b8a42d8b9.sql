-- Fix RLS policies to work with Clerk authentication
-- First, update the get_clerk_user_id function to be more reliable
CREATE OR REPLACE FUNCTION public.get_clerk_user_id()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Try to get the user ID from the session variable first (set by set_claim)
  RETURN current_setting('app.current_user_id', true);
EXCEPTION
  WHEN others THEN
    -- Return null if no session variable is set
    RETURN NULL;
END;
$function$;

-- Update set_claim function to be more robust
CREATE OR REPLACE FUNCTION public.set_claim(claim text, value text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Store the user ID in a session variable that RLS can access
  PERFORM set_config('app.current_user_id', value, false);
  RETURN value;
END;
$function$;

-- Drop existing policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles; 
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create new policies that work with Clerk
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = get_clerk_user_id());

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (user_id = get_clerk_user_id());

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = get_clerk_user_id());

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (get_current_user_role() = 'admin');

-- Also fix tasks policies
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can view all tasks" ON public.tasks;

CREATE POLICY "Users can view their own tasks" 
ON public.tasks 
FOR SELECT 
USING (user_id = get_clerk_user_id());

CREATE POLICY "Users can create their own tasks" 
ON public.tasks 
FOR INSERT 
WITH CHECK (user_id = get_clerk_user_id());

CREATE POLICY "Users can update their own tasks" 
ON public.tasks 
FOR UPDATE 
USING (user_id = get_clerk_user_id());

CREATE POLICY "Users can delete their own tasks" 
ON public.tasks 
FOR DELETE 
USING (user_id = get_clerk_user_id());

CREATE POLICY "Admins can view all tasks" 
ON public.tasks 
FOR SELECT 
USING (get_current_user_role() = 'admin');
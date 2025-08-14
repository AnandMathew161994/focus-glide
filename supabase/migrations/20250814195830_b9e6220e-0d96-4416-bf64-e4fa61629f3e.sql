-- Create the set_claim function that's missing
CREATE OR REPLACE FUNCTION public.set_claim(claim text, value text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- This function sets a custom claim in the current session
  -- For Clerk integration, we'll store the user ID in a way that RLS can access
  PERFORM set_config('app.current_user_id', value, true);
  RETURN value;
END;
$$;

-- Update the get_clerk_user_id function to use the session variable
CREATE OR REPLACE FUNCTION public.get_clerk_user_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
BEGIN
  -- Try to get the user ID from the session variable first
  RETURN current_setting('app.current_user_id', true);
EXCEPTION
  WHEN others THEN
    -- Fallback to trying JWT claims if session variable not set
    RETURN COALESCE(
      current_setting('request.jwt.claims', true)::json ->> 'sub',
      (auth.jwt() ->> 'sub')
    );
END;
$$;
-- Fix email exposure security issue by dropping overly permissive policy
-- and creating a secure way to access public profile information

-- Drop the dangerous policy that allows unrestricted access
DROP POLICY IF EXISTS "allow_read_profiles" ON public.profiles;

-- Drop the overly broad policy that still exposes emails
DROP POLICY IF EXISTS "Users can view public profile info" ON public.profiles;

-- Create a new policy that allows users to see their own complete profile (including email)
CREATE POLICY "Users can view own complete profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create a security definer function to get public profile fields (without email)
CREATE OR REPLACE FUNCTION public.get_public_profiles()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  full_name text,
  avatar_url text,
  bio text,
  job_title text,
  industry text,
  career_level text,
  location text,
  skills text[],
  objectives text[],
  created_at timestamp with time zone,
  updated_at timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.job_title,
    p.industry,
    p.career_level,
    p.location,
    p.skills,
    p.objectives,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.user_id != auth.uid() OR auth.uid() IS NULL;
END;
$$;

-- Create a view for public profiles (excludes email)
CREATE OR REPLACE VIEW public.public_profiles_view AS
SELECT 
  id,
  user_id,
  full_name,
  avatar_url,
  bio,
  job_title,
  industry,
  career_level,
  location,
  skills,
  objectives,
  created_at,
  updated_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles_view TO authenticated;
GRANT SELECT ON public.public_profiles_view TO anon;
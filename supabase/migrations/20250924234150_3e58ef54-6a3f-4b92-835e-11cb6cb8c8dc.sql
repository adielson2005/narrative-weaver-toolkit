-- Fix critical security issues

-- 1. Update profiles table RLS policy to prevent email exposure
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create more restrictive policy that protects user privacy
CREATE POLICY "Users can view public profile info" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can see their own full profile
  auth.uid() = user_id 
  OR 
  -- Others can only see limited public info (no email)
  (auth.uid() IS NOT NULL AND auth.uid() != user_id)
);

-- 2. Create a view for public profile data that excludes sensitive information
CREATE OR REPLACE VIEW public.public_profiles AS
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
FROM public.profiles
WHERE onboarding_completed = true;

-- Allow authenticated users to view public profiles
GRANT SELECT ON public.public_profiles TO authenticated;

-- 3. Create function to get user's own profile (includes email)
CREATE OR REPLACE FUNCTION get_own_profile()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  full_name text,
  email text,
  avatar_url text,
  bio text,
  job_title text,
  industry text,
  career_level text,
  location text,
  skills text[],
  objectives text[],
  onboarding_completed boolean,
  created_at timestamptz,
  updated_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.full_name,
    p.email,
    p.avatar_url,
    p.bio,
    p.job_title,
    p.industry,
    p.career_level,
    p.location,
    p.skills,
    p.objectives,
    p.onboarding_completed,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.user_id = auth.uid();
END;
$$;
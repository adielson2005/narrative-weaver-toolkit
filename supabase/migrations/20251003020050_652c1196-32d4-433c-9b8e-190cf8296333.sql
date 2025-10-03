-- Drop existing triggers to recreate them properly
DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
DROP TRIGGER IF EXISTS update_connections_updated_at ON public.connections;
DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
DROP TRIGGER IF EXISTS update_job_positions_updated_at ON public.job_positions;
DROP TRIGGER IF EXISTS update_work_experiences_updated_at ON public.work_experiences;
DROP TRIGGER IF EXISTS update_education_updated_at ON public.education;

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_connections_updated_at
  BEFORE UPDATE ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_positions_updated_at
  BEFORE UPDATE ON public.job_positions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_work_experiences_updated_at
  BEFORE UPDATE ON public.work_experiences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_education_updated_at
  BEFORE UPDATE ON public.education
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_posts_author_created ON public.posts (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_visibility_created ON public.posts (visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_connections_status ON public.connections (status);
CREATE INDEX IF NOT EXISTS idx_job_positions_status_created ON public.job_positions (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON public.profiles (onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_industry ON public.profiles (industry);
CREATE INDEX IF NOT EXISTS idx_profiles_career_level ON public.profiles (career_level);

-- Add functions for better data handling
CREATE OR REPLACE FUNCTION public.get_user_stats(user_uuid uuid)
RETURNS TABLE(
  posts_count integer,
  connections_count integer,
  likes_received integer,
  profile_views integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::integer FROM public.posts WHERE author_id = user_uuid),
    (SELECT COUNT(*)::integer FROM public.connections 
     WHERE (requester_id = user_uuid OR receiver_id = user_uuid) 
     AND status = 'accepted'),
    (SELECT COUNT(*)::integer FROM public.post_likes pl 
     JOIN public.posts p ON pl.post_id = p.id 
     WHERE p.author_id = user_uuid),
    100::integer -- placeholder for profile views
  ;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add function to get feed posts
CREATE OR REPLACE FUNCTION public.get_feed_posts(user_uuid uuid, posts_limit integer DEFAULT 20, posts_offset integer DEFAULT 0)
RETURNS TABLE(
  id uuid,
  content text,
  author_id uuid,
  author_name text,
  author_avatar text,
  author_job_title text,
  post_type text,
  media_urls text[],
  likes_count integer,
  comments_count integer,
  shares_count integer,
  created_at timestamp with time zone,
  user_has_liked boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.content,
    p.author_id,
    pr.full_name as author_name,
    pr.avatar_url as author_avatar,
    pr.job_title as author_job_title,
    p.post_type,
    p.media_urls,
    p.likes_count,
    p.comments_count,
    p.shares_count,
    p.created_at,
    EXISTS(SELECT 1 FROM public.post_likes pl WHERE pl.post_id = p.id AND pl.user_id = user_uuid) as user_has_liked
  FROM public.posts p
  JOIN public.profiles pr ON p.author_id = pr.user_id
  WHERE p.visibility = 'public'
    OR p.author_id = user_uuid
    OR p.author_id IN (
      SELECT CASE 
        WHEN c.requester_id = user_uuid THEN c.receiver_id
        ELSE c.requester_id
      END
      FROM public.connections c
      WHERE (c.requester_id = user_uuid OR c.receiver_id = user_uuid)
        AND c.status = 'accepted'
    )
  ORDER BY p.created_at DESC
  LIMIT posts_limit OFFSET posts_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
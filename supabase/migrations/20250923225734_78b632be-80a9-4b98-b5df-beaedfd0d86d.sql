-- Create companies table for professional organizations
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  size_range TEXT CHECK (size_range IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),
  website TEXT,
  logo_url TEXT,
  location TEXT,
  founded_year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job_positions table for career information
CREATE TABLE public.job_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  department TEXT,
  level TEXT CHECK (level IN ('entry', 'junior', 'mid', 'senior', 'lead', 'manager', 'director', 'vp', 'c-level')),
  employment_type TEXT CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'internship', 'freelance')),
  location TEXT,
  is_remote BOOLEAN DEFAULT false,
  salary_min INTEGER,
  salary_max INTEGER,
  currency TEXT DEFAULT 'BRL',
  description TEXT,
  requirements TEXT[],
  benefits TEXT[],
  status TEXT CHECK (status IN ('active', 'closed', 'draft')) DEFAULT 'active',
  posted_by UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create connections table for professional networking
CREATE TABLE public.connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')) DEFAULT 'pending',
  message TEXT,
  connected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, receiver_id),
  CONSTRAINT no_self_connection CHECK (requester_id != receiver_id)
);

-- Create posts table for professional content sharing
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[],
  post_type TEXT CHECK (post_type IN ('text', 'article', 'image', 'video', 'poll', 'job_share')) DEFAULT 'text',
  visibility TEXT CHECK (visibility IN ('public', 'connections', 'private')) DEFAULT 'public',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post_likes table for tracking likes
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create post_comments table for discussions
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create work_experiences table for career history
CREATE TABLE public.work_experiences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  position_title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  achievements TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create education table for academic background
CREATE TABLE public.education (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  institution_name TEXT NOT NULL,
  degree_type TEXT CHECK (degree_type IN ('high_school', 'associate', 'bachelor', 'master', 'doctorate', 'certificate', 'bootcamp')),
  field_of_study TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  grade TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for companies (public read, authenticated create/update)
CREATE POLICY "Companies are viewable by everyone" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create companies" ON public.companies FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update companies" ON public.companies FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create RLS policies for job_positions
CREATE POLICY "Job positions are viewable by everyone" ON public.job_positions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create job positions" ON public.job_positions FOR INSERT WITH CHECK (auth.uid() = posted_by);
CREATE POLICY "Job posters can update their positions" ON public.job_positions FOR UPDATE USING (auth.uid() = posted_by);
CREATE POLICY "Job posters can delete their positions" ON public.job_positions FOR DELETE USING (auth.uid() = posted_by);

-- Create RLS policies for connections
CREATE POLICY "Users can view their own connections" ON public.connections 
FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can create connection requests" ON public.connections 
FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update connection requests they're involved in" ON public.connections 
FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- Create RLS policies for posts
CREATE POLICY "Public posts are viewable by everyone" ON public.posts 
FOR SELECT USING (visibility = 'public' OR auth.uid() = author_id);
CREATE POLICY "Users can create their own posts" ON public.posts 
FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own posts" ON public.posts 
FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own posts" ON public.posts 
FOR DELETE USING (auth.uid() = author_id);

-- Create RLS policies for post_likes
CREATE POLICY "Post likes are viewable by everyone" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like posts" ON public.post_likes 
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own likes" ON public.post_likes 
FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for post_comments
CREATE POLICY "Comments are viewable by everyone" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON public.post_comments 
FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own comments" ON public.post_comments 
FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own comments" ON public.post_comments 
FOR DELETE USING (auth.uid() = author_id);

-- Create RLS policies for work_experiences
CREATE POLICY "Users can view their own work experiences" ON public.work_experiences 
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own work experiences" ON public.work_experiences 
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own work experiences" ON public.work_experiences 
FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own work experiences" ON public.work_experiences 
FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for education
CREATE POLICY "Users can view their own education" ON public.education 
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own education" ON public.education 
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own education" ON public.education 
FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own education" ON public.education 
FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_job_positions_company_id ON public.job_positions(company_id);
CREATE INDEX idx_job_positions_posted_by ON public.job_positions(posted_by);
CREATE INDEX idx_job_positions_status ON public.job_positions(status);
CREATE INDEX idx_connections_requester_id ON public.connections(requester_id);
CREATE INDEX idx_connections_receiver_id ON public.connections(receiver_id);
CREATE INDEX idx_connections_status ON public.connections(status);
CREATE INDEX idx_posts_author_id ON public.posts(author_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_visibility ON public.posts(visibility);
CREATE INDEX idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON public.post_likes(user_id);
CREATE INDEX idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX idx_post_comments_author_id ON public.post_comments(author_id);
CREATE INDEX idx_work_experiences_user_id ON public.work_experiences(user_id);
CREATE INDEX idx_education_user_id ON public.education(user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_positions_updated_at
  BEFORE UPDATE ON public.job_positions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_connections_updated_at
  BEFORE UPDATE ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_work_experiences_updated_at
  BEFORE UPDATE ON public.work_experiences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_education_updated_at
  BEFORE UPDATE ON public.education
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
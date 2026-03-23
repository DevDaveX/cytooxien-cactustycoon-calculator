
-- Changelog type enum
CREATE TYPE public.changelog_type AS ENUM ('feature', 'change', 'bugfix', 'removal');

-- Changelog entries table
CREATE TABLE public.changelog_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type changelog_type NOT NULL DEFAULT 'change',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.changelog_entries ENABLE ROW LEVEL SECURITY;

-- Anyone can read changelog
CREATE POLICY "Anyone can view changelog" ON public.changelog_entries FOR SELECT USING (true);
-- Only admins can manage
CREATE POLICY "Admins can manage changelog" ON public.changelog_entries FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Feedback type and status enums
CREATE TYPE public.feedback_type AS ENUM ('bug', 'feature', 'feedback');
CREATE TYPE public.feedback_status AS ENUM ('open', 'in_progress', 'done', 'rejected');

-- Feedback entries table
CREATE TABLE public.feedback_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type feedback_type NOT NULL DEFAULT 'feedback',
  status feedback_status NOT NULL DEFAULT 'open',
  admin_notes TEXT DEFAULT '',
  author_name TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback_entries ENABLE ROW LEVEL SECURITY;

-- Anyone can view feedback (for tracking by ID)
CREATE POLICY "Anyone can view feedback" ON public.feedback_entries FOR SELECT USING (true);
-- Anyone can submit feedback
CREATE POLICY "Anyone can submit feedback" ON public.feedback_entries FOR INSERT WITH CHECK (true);
-- Only admins can update/delete
CREATE POLICY "Admins can update feedback" ON public.feedback_entries FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete feedback" ON public.feedback_entries FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

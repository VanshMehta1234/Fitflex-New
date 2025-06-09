-- Create feedback_forms table
CREATE TABLE IF NOT EXISTS public.feedback_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  form_type TEXT NOT NULL CHECK (form_type IN ('weekly', 'class', 'general')),
  category TEXT NOT NULL,
  ratings JSONB NOT NULL,
  comments TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  week_number INTEGER,
  year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_forms_user_id ON public.feedback_forms(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_forms_form_type ON public.feedback_forms(form_type);
CREATE INDEX IF NOT EXISTS idx_feedback_forms_week_number ON public.feedback_forms(week_number) WHERE week_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_feedback_forms_year ON public.feedback_forms(year) WHERE year IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_feedback_forms_submitted_at ON public.feedback_forms(submitted_at);

-- Enable RLS
ALTER TABLE public.feedback_forms ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can insert their own feedback
CREATE POLICY "Users can insert their own feedback"
  ON public.feedback_forms
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
  ON public.feedback_forms
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
  ON public.feedback_forms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Add view for feedback analysis (aggregated feedback with user info)
CREATE OR REPLACE VIEW public.feedback_analysis AS
SELECT 
  f.id,
  f.form_type,
  f.category,
  f.ratings,
  f.comments,
  f.is_anonymous,
  f.submitted_at,
  f.week_number,
  f.year,
  CASE 
    WHEN f.is_anonymous THEN 'Anonymous User'
    ELSE p.name
  END as user_name,
  CASE 
    WHEN f.is_anonymous THEN NULL
    ELSE p.email
  END as user_email,
  CASE 
    WHEN f.is_anonymous THEN NULL
    ELSE p.profile_image
  END as user_profile_image
FROM 
  public.feedback_forms f
LEFT JOIN 
  public.profiles p ON f.user_id = p.id;

-- Grant access to the view
GRANT SELECT ON public.feedback_analysis TO service_role;

-- Allow view to be accessed via RLS
ALTER VIEW public.feedback_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policy for view
CREATE POLICY "Admins can view all feedback analysis"
  ON public.feedback_analysis
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  ); 
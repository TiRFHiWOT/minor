-- Create table to track URL migration fix patterns for continuous improvement
CREATE TABLE public.url_migration_fix_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_type TEXT NOT NULL, -- 'year_mismatch', 'undefined_url', 'level_mismatch', etc.
  old_url TEXT NOT NULL,
  original_new_url TEXT NOT NULL,
  corrected_new_url TEXT NOT NULL,
  fix_reason TEXT NOT NULL,
  confidence_improvement NUMERIC(3,2), -- How much confidence improved after fix
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.url_migration_fix_patterns ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage fix patterns" 
ON public.url_migration_fix_patterns 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role));

-- Create index for pattern analysis
CREATE INDEX idx_fix_patterns_type ON public.url_migration_fix_patterns(pattern_type);
CREATE INDEX idx_fix_patterns_created_at ON public.url_migration_fix_patterns(created_at);
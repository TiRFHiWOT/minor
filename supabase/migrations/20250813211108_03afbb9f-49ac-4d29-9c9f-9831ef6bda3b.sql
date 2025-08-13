-- Create url_migrations table for old URL redirects
CREATE TABLE public.url_migrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  old_url TEXT NOT NULL UNIQUE,
  new_url TEXT NOT NULL,
  url_type TEXT NOT NULL DEFAULT 'topic', -- 'topic', 'post', 'category', 'other'
  old_topic_id INTEGER,
  old_post_id INTEGER, 
  old_category_id INTEGER,
  new_topic_id UUID,
  new_post_id UUID,
  new_category_id UUID,
  priority INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'disabled'
  last_modified_date TIMESTAMP WITH TIME ZONE,
  redirect_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  notes TEXT
);

-- Create indexes for fast lookups
CREATE INDEX idx_url_migrations_old_url ON public.url_migrations(old_url);
CREATE INDEX idx_url_migrations_status ON public.url_migrations(status);
CREATE INDEX idx_url_migrations_url_type ON public.url_migrations(url_type);
CREATE INDEX idx_url_migrations_old_topic_id ON public.url_migrations(old_topic_id) WHERE old_topic_id IS NOT NULL;

-- Add legacy_topic_id to topics table for direct lookups
ALTER TABLE public.topics ADD COLUMN legacy_topic_id INTEGER;
CREATE INDEX idx_topics_legacy_id ON public.topics(legacy_topic_id) WHERE legacy_topic_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.url_migrations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage URL migrations" 
ON public.url_migrations 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "System can read active URL migrations" 
ON public.url_migrations 
FOR SELECT 
USING (status = 'active');

-- Create function to update redirect count
CREATE OR REPLACE FUNCTION public.increment_redirect_count(migration_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.url_migrations 
  SET redirect_count = redirect_count + 1,
      updated_at = now()
  WHERE id = migration_id;
END;
$$;

-- Create trigger to update updated_at
CREATE TRIGGER update_url_migrations_updated_at
BEFORE UPDATE ON public.url_migrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
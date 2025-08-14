-- Add new columns for enhanced URL migration tracking
ALTER TABLE public.url_migrations 
ADD COLUMN match_confidence NUMERIC(3,2) DEFAULT NULL,
ADD COLUMN match_type TEXT DEFAULT NULL;

-- Add constraint to ensure match_confidence is between 0 and 1
ALTER TABLE public.url_migrations 
ADD CONSTRAINT check_match_confidence_range 
CHECK (match_confidence IS NULL OR (match_confidence >= 0 AND match_confidence <= 1));

-- Add constraint for valid match_type values
ALTER TABLE public.url_migrations 
ADD CONSTRAINT check_match_type_values 
CHECK (match_type IS NULL OR match_type IN ('exact', 'title_similarity', 'legacy_id', 'generated'));

-- Add index for better query performance on match confidence
CREATE INDEX idx_url_migrations_match_confidence ON public.url_migrations(match_confidence);

-- Add index for match type
CREATE INDEX idx_url_migrations_match_type ON public.url_migrations(match_type);
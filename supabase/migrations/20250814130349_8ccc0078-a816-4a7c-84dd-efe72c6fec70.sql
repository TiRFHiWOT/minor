-- Clear existing legacy URL migrations to regenerate with proper SEO format
DELETE FROM public.url_migrations WHERE new_url LIKE '/topic/legacy-%' OR new_url LIKE '%/legacy-%';
-- Clean up existing URL migrations with /undefined/ in the new_url
UPDATE url_migrations 
SET new_url = REPLACE(new_url, '/undefined/', '/general-youth-hockey-discussion/'),
    notes = COALESCE(notes, '') || ' [Fixed: replaced /undefined/ with fallback category]',
    updated_at = now()
WHERE new_url LIKE '%/undefined/%' AND status = 'pending';
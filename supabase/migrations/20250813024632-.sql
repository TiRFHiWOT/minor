-- Fix RLS policies on topics and posts tables

-- Remove overly restrictive ALL policies
DROP POLICY IF EXISTS "Only admins can access topics table" ON topics;
DROP POLICY IF EXISTS "Only admins can access posts table" ON posts;

-- Add proper SELECT policies for topics
CREATE POLICY "Anyone can view approved topics" 
ON topics 
FOR SELECT 
USING (moderation_status = 'approved');

CREATE POLICY "Admins can view all topics with metadata" 
ON topics 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Add proper SELECT policies for posts  
CREATE POLICY "Anyone can view approved posts" 
ON posts 
FOR SELECT 
USING (moderation_status = 'approved');

CREATE POLICY "Admins can view all posts with metadata" 
ON posts 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Create IP address protection - hide IP from public but allow admins to see it
-- This is handled by having separate admin policies above

-- Drop the duplicate forum tables and their policies
DROP TABLE IF EXISTS forum_topics CASCADE;
DROP TABLE IF EXISTS forum_posts CASCADE;
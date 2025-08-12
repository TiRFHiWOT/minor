-- COMPREHENSIVE SECURITY FIXES - Phase 1
-- Fix remaining RLS policies and user privacy protection

-- 1. Fix topic_bookmarks table - ensure proper access control
-- Drop existing policy if it exists and create secure replacement
DROP POLICY IF EXISTS "Users can manage their own bookmarks" ON public.topic_bookmarks;

CREATE POLICY "Users can manage their own bookmarks" 
ON public.topic_bookmarks 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Further lock down temporary_users table to prevent session tracking
DROP POLICY IF EXISTS "Authenticated users can view expired temporary users" ON public.temporary_users;

-- Only allow admins to view temporary user data 
CREATE POLICY "Admins can view all temporary users" 
ON public.temporary_users 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role));

-- 3. Add RLS policies for tables that have RLS enabled but no policies
-- Check if content_analysis has RLS enabled, if not enable it
DO $$
BEGIN
    -- Enable RLS if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'content_analysis' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE public.content_analysis ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Add policies for content_analysis if they don't exist
DROP POLICY IF EXISTS "System can insert content analysis" ON public.content_analysis;
DROP POLICY IF EXISTS "Admins can view content analysis" ON public.content_analysis;

CREATE POLICY "System can insert content analysis" 
ON public.content_analysis 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view content analysis" 
ON public.content_analysis 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role));

-- Check if user_behavior_patterns has RLS enabled, if not enable it  
DO $$
BEGIN
    -- Enable RLS if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'user_behavior_patterns' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE public.user_behavior_patterns ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Add policies for user_behavior_patterns if they don't exist
DROP POLICY IF EXISTS "System can manage behavior patterns" ON public.user_behavior_patterns;
DROP POLICY IF EXISTS "Admins can view behavior patterns" ON public.user_behavior_patterns;

CREATE POLICY "System can manage behavior patterns" 
ON public.user_behavior_patterns 
FOR ALL 
WITH CHECK (true);

CREATE POLICY "Admins can view behavior patterns" 
ON public.user_behavior_patterns 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role));
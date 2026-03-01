-- Add visibility and published_at columns to projects table
-- Run this in your Supabase SQL Editor

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'visibility') THEN
        ALTER TABLE public.projects ADD COLUMN visibility text DEFAULT 'private' CHECK (visibility IN ('private', 'public'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'published_at') THEN
        ALTER TABLE public.projects ADD COLUMN published_at timestamptz;
    END IF;
END $$;

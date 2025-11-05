-- Migration: Add UPDATE policy for verses table to allow context updates
-- This allows authenticated users to update context fields on verses

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Authenticated users can update verse context" ON public.verses;

-- Create UPDATE policy for authenticated users to update context fields
-- This is needed for AI-generated context feature
CREATE POLICY "Authenticated users can update verse context"
    ON public.verses FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Note: This policy allows all authenticated users to update verses
-- In production, you may want to restrict this to specific roles or use
-- a more granular policy that only allows updating specific columns

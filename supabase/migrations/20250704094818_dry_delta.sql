/*
  # Fix RLS SELECT policies for games table

  1. Security Updates
    - Drop conflicting SELECT policies
    - Create proper SELECT policy for authenticated users to see all games
    - Ensure anonymous users can see approved games
    - Allow proper access for approval functionality

  2. Changes
    - Remove restrictive SELECT policies
    - Add comprehensive SELECT policies for both user types
    - Ensure approval page can access unapproved games
*/

-- Drop existing SELECT policies that might be too restrictive
DROP POLICY IF EXISTS "Public read access for approved games" ON games;
DROP POLICY IF EXISTS "Authenticated users can read all games" ON games;

-- Create a comprehensive SELECT policy for authenticated users (approvers)
CREATE POLICY "Authenticated users can read all games"
  ON games
  FOR SELECT
  TO authenticated
  USING (true);

-- Create a SELECT policy for anonymous users (public access to approved games only)
CREATE POLICY "Anonymous users can read approved games"
  ON games
  FOR SELECT
  TO anon
  USING (is_approved = true);

-- Ensure the service role can access everything (for admin operations)
CREATE POLICY "Service role full access"
  ON games
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
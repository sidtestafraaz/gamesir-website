/*
  # Fix RLS policies for games table INSERT operations

  1. Policy Updates
    - Update the anonymous INSERT policy to be more permissive
    - Ensure the policy allows inserting games with is_approved = false
    - Fix any conflicts between existing policies

  2. Security
    - Maintain security by only allowing unapproved games to be inserted by anonymous users
    - Keep existing SELECT policies intact
*/

-- Drop the existing INSERT policy for anonymous users that might be causing conflicts
DROP POLICY IF EXISTS "Anonymous users can submit games for approval" ON games;

-- Create a new, more permissive INSERT policy for anonymous users
CREATE POLICY "Allow anonymous game submissions"
  ON games
  FOR INSERT
  TO anon
  WITH CHECK (
    is_approved = false AND
    approved_by IS NULL AND
    approved_at IS NULL
  );

-- Ensure the authenticated users INSERT policy is also correct
DROP POLICY IF EXISTS "Authenticated users can insert games" ON games;

CREATE POLICY "Allow authenticated game submissions"
  ON games
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
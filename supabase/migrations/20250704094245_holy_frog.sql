/*
  # Fix RLS policies for games table

  1. Security Updates
    - Drop existing conflicting INSERT policies
    - Create a single, clear INSERT policy for anonymous users
    - Ensure anonymous users can insert games with is_approved = false
    - Keep existing SELECT and UPDATE policies intact

  2. Changes Made
    - Remove duplicate and conflicting INSERT policies
    - Add a single INSERT policy that allows anonymous users to submit games for approval
    - Maintain security by ensuring only unapproved games can be inserted by anonymous users
*/

-- Drop existing INSERT policies that might be conflicting
DROP POLICY IF EXISTS "Public Insert" ON games;
DROP POLICY IF EXISTS "Public can insert games for approval" ON games;

-- Create a single, clear INSERT policy for anonymous users
CREATE POLICY "Anonymous users can submit games for approval"
  ON games
  FOR INSERT
  TO anon
  WITH CHECK (is_approved = false);

-- Ensure the policy also works for authenticated users (for testing)
CREATE POLICY "Authenticated users can insert games"
  ON games
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
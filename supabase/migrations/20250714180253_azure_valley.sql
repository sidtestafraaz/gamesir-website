/*
  # Fix Authentication Policies

  1. Database Changes
    - Update RLS policies for proper authentication flow
    - Allow anonymous users to insert unapproved games/updates only
    - Require authentication for updates and controller operations
    
  2. Authentication Flow
    - Use existing approver tokens for Supabase authentication
    - Maintain current UI without changes
*/

-- First, let's update the games table policies
DROP POLICY IF EXISTS "Allow anonymous game submissions" ON games;
DROP POLICY IF EXISTS "Allow approval updates" ON games;
DROP POLICY IF EXISTS "Allow reading all games for approval" ON games;
DROP POLICY IF EXISTS "Anonymous users can read approved games" ON games;
DROP POLICY IF EXISTS "Service role full access" ON games;

-- New games table policies
CREATE POLICY "Anonymous can insert unapproved games"
  ON games
  FOR INSERT
  TO anon
  WITH CHECK (is_approved = false AND approved_by IS NULL AND approved_at IS NULL);

CREATE POLICY "Anonymous can read all games"
  ON games
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated can update games"
  ON games
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on games"
  ON games
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update game_updates table policies
DROP POLICY IF EXISTS "Allow anonymous game update submissions" ON game_updates;
DROP POLICY IF EXISTS "Allow approval updates on game updates" ON game_updates;
DROP POLICY IF EXISTS "Allow reading all game updates for approval" ON game_updates;
DROP POLICY IF EXISTS "Service role full access on game updates" ON game_updates;

-- New game_updates table policies
CREATE POLICY "Anonymous can insert unapproved game updates"
  ON game_updates
  FOR INSERT
  TO anon
  WITH CHECK (is_approved = false AND approved_by IS NULL AND approved_at IS NULL);

CREATE POLICY "Anonymous can read all game updates"
  ON game_updates
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated can update game updates"
  ON game_updates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on game updates"
  ON game_updates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update controllers table policies
DROP POLICY IF EXISTS "Allow Update for Authenticated" ON controllers;
DROP POLICY IF EXISTS "Insert access for Authenticated" ON controllers;
DROP POLICY IF EXISTS "Public read access for controllers" ON controllers;

-- New controllers table policies
CREATE POLICY "Anonymous can read controllers"
  ON controllers
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated can insert controllers"
  ON controllers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update controllers"
  ON controllers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete controllers"
  ON controllers
  FOR DELETE
  TO authenticated
  USING (true);

-- Junction table policies remain the same but ensure they work with new auth
DROP POLICY IF EXISTS "Delete access for games testing controllers" ON games_testing_controllers;
DROP POLICY IF EXISTS "Insert access for games testing controllers" ON games_testing_controllers;
DROP POLICY IF EXISTS "Public read access for games testing controllers" ON games_testing_controllers;
DROP POLICY IF EXISTS "Update access for games testing controllers" ON games_testing_controllers;

CREATE POLICY "Anonymous can read games testing controllers"
  ON games_testing_controllers
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous can insert games testing controllers"
  ON games_testing_controllers
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated can update games testing controllers"
  ON games_testing_controllers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete games testing controllers"
  ON games_testing_controllers
  FOR DELETE
  TO authenticated
  USING (true);

-- Same for game updates testing controllers
DROP POLICY IF EXISTS "Delete access for game updates testing controllers" ON game_updates_testing_controllers;
DROP POLICY IF EXISTS "Insert access for game updates testing controllers" ON game_updates_testing_controllers;
DROP POLICY IF EXISTS "Public read access for game updates testing controllers" ON game_updates_testing_controllers;
DROP POLICY IF EXISTS "Update access for game updates testing controllers" ON game_updates_testing_controllers;

CREATE POLICY "Anonymous can read game updates testing controllers"
  ON game_updates_testing_controllers
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous can insert game updates testing controllers"
  ON game_updates_testing_controllers
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated can update game updates testing controllers"
  ON game_updates_testing_controllers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete game updates testing controllers"
  ON game_updates_testing_controllers
  FOR DELETE
  TO authenticated
  USING (true);

-- Approvers table remains public read for token validation
CREATE POLICY "Public read access for approvers" ON approvers FOR SELECT TO anon USING (true);
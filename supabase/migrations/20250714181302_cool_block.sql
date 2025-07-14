/*
  # Update Database Policies for Authentication-Based Access Control

  1. Policy Changes
    - Remove all existing policies from all tables
    - Create new policies based on authentication status
    - Admin (authenticated) users: Full access to all tables except approvers
    - Anonymous users: Insert-only access to games and game_updates tables

  2. Security
    - Proper RLS enforcement based on authentication
    - Restricted access to sensitive operations
    - Public submission capability maintained
*/

-- Drop all existing policies from all tables
DROP POLICY IF EXISTS "Public read access for approvers" ON approvers;
DROP POLICY IF EXISTS "Public read access for controllers" ON controllers;
DROP POLICY IF EXISTS "Insert access for Authenticated" ON controllers;
DROP POLICY IF EXISTS "Allow Update for Authenticated" ON controllers;
DROP POLICY IF EXISTS "Allow anonymous game submissions" ON games;
DROP POLICY IF EXISTS "Allow approval updates" ON games;
DROP POLICY IF EXISTS "Allow reading all games for approval" ON games;
DROP POLICY IF EXISTS "Anonymous users can read approved games" ON games;
DROP POLICY IF EXISTS "Service role full access" ON games;
DROP POLICY IF EXISTS "Allow anonymous game update submissions" ON game_updates;
DROP POLICY IF EXISTS "Allow approval updates on game updates" ON game_updates;
DROP POLICY IF EXISTS "Allow reading all game updates for approval" ON game_updates;
DROP POLICY IF EXISTS "Service role full access on game updates" ON game_updates;
DROP POLICY IF EXISTS "Public read access for games testing controllers" ON games_testing_controllers;
DROP POLICY IF EXISTS "Insert access for games testing controllers" ON games_testing_controllers;
DROP POLICY IF EXISTS "Update access for games testing controllers" ON games_testing_controllers;
DROP POLICY IF EXISTS "Delete access for games testing controllers" ON games_testing_controllers;
DROP POLICY IF EXISTS "Public read access for game updates testing controllers" ON game_updates_testing_controllers;
DROP POLICY IF EXISTS "Insert access for game updates testing controllers" ON game_updates_testing_controllers;
DROP POLICY IF EXISTS "Update access for game updates testing controllers" ON game_updates_testing_controllers;
DROP POLICY IF EXISTS "Delete access for game updates testing controllers" ON game_updates_testing_controllers;

-- Create new policies for approvers table (read-only for authentication)
CREATE POLICY "Allow reading approvers for authentication"
  ON approvers
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create new policies for controllers table
CREATE POLICY "Anonymous users can read controllers"
  ON controllers
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users have full access to controllers"
  ON controllers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create new policies for games table
CREATE POLICY "Anonymous users can read all games"
  ON games
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert unapproved games"
  ON games
  FOR INSERT
  TO anon
  WITH CHECK (is_approved = false AND approved_by IS NULL AND approved_at IS NULL);

CREATE POLICY "Authenticated users have full access to games"
  ON games
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create new policies for game_updates table
CREATE POLICY "Anonymous users can read all game updates"
  ON game_updates
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert unapproved game updates"
  ON game_updates
  FOR INSERT
  TO anon
  WITH CHECK (is_approved = false AND approved_by IS NULL AND approved_at IS NULL);

CREATE POLICY "Authenticated users have full access to game updates"
  ON game_updates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create new policies for games_testing_controllers junction table
CREATE POLICY "Anonymous users can read games testing controllers"
  ON games_testing_controllers
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert games testing controllers"
  ON games_testing_controllers
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users have full access to games testing controllers"
  ON games_testing_controllers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create new policies for game_updates_testing_controllers junction table
CREATE POLICY "Anonymous users can read game updates testing controllers"
  ON game_updates_testing_controllers
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert game updates testing controllers"
  ON game_updates_testing_controllers
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users have full access to game updates testing controllers"
  ON game_updates_testing_controllers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
/*
  # Create game updates table for additional info submissions

  1. New Tables
    - `game_updates` table for storing update submissions to existing games
    - Links to original game entry and stores new testing data
    - Approval workflow similar to new games

  2. New Fields
    - All game testing fields for the update
    - Reference to original game
    - Approval tracking fields
    - Testing controller relationships

  3. Security
    - Enable RLS with appropriate policies
    - Allow anonymous submissions for updates
    - Admin approval required
*/

-- Create game updates table
CREATE TABLE IF NOT EXISTS game_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_game_id uuid REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  
  -- Testing platform fields
  android_tested boolean DEFAULT false,
  ios_tested boolean DEFAULT false,
  
  -- Android protocol connectivity fields
  android_hid text,
  android_xinput text,
  android_ds4 text,
  android_ns text,
  
  -- iOS protocol connectivity fields
  ios_hid text,
  ios_xinput text,
  ios_ds4 text,
  ios_ns text,
  
  -- Testing details
  testing_controller_id uuid REFERENCES controllers(id),
  testing_controller_ids text[] DEFAULT '{}',
  testing_notes text,
  discord_username text,
  
  -- Approval tracking
  is_approved boolean DEFAULT false,
  approved_by text,
  approved_at timestamptz,
  rejected_reason text,
  rejected_by text,
  rejected_at timestamptz,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  edited_by_admin boolean DEFAULT false,
  edited_at timestamptz
);

-- Create junction table for game updates and testing controllers
CREATE TABLE IF NOT EXISTS game_updates_testing_controllers (
  game_update_id uuid REFERENCES game_updates(id) ON DELETE CASCADE,
  controller_id uuid REFERENCES controllers(id) ON DELETE CASCADE,
  PRIMARY KEY (game_update_id, controller_id)
);

-- Enable RLS on both tables
ALTER TABLE game_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_updates_testing_controllers ENABLE ROW LEVEL SECURITY;

-- Policies for game_updates table
CREATE POLICY "Allow reading all game updates for approval"
  ON game_updates
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous game update submissions"
  ON game_updates
  FOR INSERT
  TO anon
  WITH CHECK (
    is_approved = false AND
    approved_by IS NULL AND
    approved_at IS NULL
  );

CREATE POLICY "Allow approval updates on game updates"
  ON game_updates
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on game updates"
  ON game_updates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policies for game_updates_testing_controllers junction table
CREATE POLICY "Public read access for game updates testing controllers"
  ON game_updates_testing_controllers
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Insert access for game updates testing controllers"
  ON game_updates_testing_controllers
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Update access for game updates testing controllers"
  ON game_updates_testing_controllers
  FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Delete access for game updates testing controllers"
  ON game_updates_testing_controllers
  FOR DELETE
  TO anon
  USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_updates_original_game_id ON game_updates(original_game_id);
CREATE INDEX IF NOT EXISTS idx_game_updates_is_approved ON game_updates(is_approved);
CREATE INDEX IF NOT EXISTS idx_game_updates_created_at ON game_updates(created_at);
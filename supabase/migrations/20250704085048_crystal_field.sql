/*
  # Add approval system and enhanced controller protocols

  1. New Tables
    - `approvers` table for token-based authentication
    - Enhanced `games` table with approval system and additional fields
    - Enhanced `controllers` table with wired/wireless protocol support

  2. Changes
    - Add approval fields to games table
    - Add protocol connectivity modes to controllers
    - Add testing details to games table

  3. Security
    - Enable RLS on all tables
    - Add policies for approvers and public access
*/

-- Create approvers table for token-based authentication
CREATE TABLE IF NOT EXISTS approvers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  token text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE approvers ENABLE ROW LEVEL SECURITY;

-- Add approval and testing fields to games table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'is_approved'
  ) THEN
    ALTER TABLE games ADD COLUMN is_approved boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE games ADD COLUMN approved_by text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE games ADD COLUMN approved_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'testing_controller_id'
  ) THEN
    ALTER TABLE games ADD COLUMN testing_controller_id uuid REFERENCES controllers(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'testing_notes'
  ) THEN
    ALTER TABLE games ADD COLUMN testing_notes text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'discord_username'
  ) THEN
    ALTER TABLE games ADD COLUMN discord_username text;
  END IF;
END $$;

-- Add connectivity modes to controllers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'controllers' AND column_name = 'wired_protocols'
  ) THEN
    ALTER TABLE controllers ADD COLUMN wired_protocols text[] DEFAULT '{}';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'controllers' AND column_name = 'wireless_protocols'
  ) THEN
    ALTER TABLE controllers ADD COLUMN wireless_protocols text[] DEFAULT '{}';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'controllers' AND column_name = 'bluetooth_protocols'
  ) THEN
    ALTER TABLE controllers ADD COLUMN bluetooth_protocols text[] DEFAULT '{}';
  END IF;
END $$;

-- Update existing controllers with proper protocol distribution
UPDATE controllers SET 
  wired_protocols = CASE 
    WHEN name LIKE '%USB-C%' OR name LIKE '%Lightning%' THEN supported_protocols
    ELSE ARRAY['XINPUT', 'HID']
  END,
  wireless_protocols = CASE 
    WHEN name LIKE '%2.4%' OR name NOT LIKE '%USB-C%' AND name NOT LIKE '%Lightning%' THEN supported_protocols
    ELSE ARRAY['HID']
  END,
  bluetooth_protocols = CASE 
    WHEN name LIKE '%Bluetooth%' OR name NOT LIKE '%USB-C%' AND name NOT LIKE '%Lightning%' THEN supported_protocols
    ELSE ARRAY['HID']
  END;

-- Insert sample approvers
INSERT INTO approvers (name, token) VALUES
  ('Admin User', 'admin-token-2024'),
  ('GameSir Team', 'gamesir-approval-key'),
  ('Community Manager', 'community-mod-token')
ON CONFLICT (token) DO NOTHING;

-- Update RLS policies for games (only show approved games to public)
DROP POLICY IF EXISTS "Public read access for games" ON games;
CREATE POLICY "Public read access for approved games"
  ON games
  FOR SELECT
  TO anon
  USING (is_approved = true);

-- Allow authenticated users to read all games (for approval page)
CREATE POLICY "Authenticated users can read all games"
  ON games
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow public insert for new game submissions
CREATE POLICY "Public can insert games for approval"
  ON games
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow updates only for approval process
CREATE POLICY "Allow approval updates"
  ON games
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Approvers table policies
CREATE POLICY "Public read access for approvers"
  ON approvers
  FOR SELECT
  TO anon
  USING (true);
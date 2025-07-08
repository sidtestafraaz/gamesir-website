/*
  # Add rejection and edit tracking fields

  1. New Fields
    - `rejected_reason` - Text field to store rejection reason
    - `rejected_by` - Text field to store who rejected the game
    - `rejected_at` - Timestamp for when the game was rejected
    - `edited_by_admin` - Boolean to track if admin edited the entry
    - `edited_at` - Timestamp for when the game was last edited by admin

  2. Security
    - No changes to RLS policies
    - Maintains existing table structure
*/

-- Add rejection tracking fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'rejected_reason'
  ) THEN
    ALTER TABLE games ADD COLUMN rejected_reason text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'rejected_by'
  ) THEN
    ALTER TABLE games ADD COLUMN rejected_by text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'rejected_at'
  ) THEN
    ALTER TABLE games ADD COLUMN rejected_at timestamptz;
  END IF;
END $$;

-- Add admin edit tracking fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'edited_by_admin'
  ) THEN
    ALTER TABLE games ADD COLUMN edited_by_admin boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'edited_at'
  ) THEN
    ALTER TABLE games ADD COLUMN edited_at timestamptz;
  END IF;
END $$;
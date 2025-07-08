/*
  # Update games table for IGDB integration

  1. Changes
    - Add `image_url` column for game cover images from IGDB
    - Add `igdb_id` column to store IGDB game ID for reference
    - Remove unused columns that don't match current schema
    - Update existing data structure

  2. Security
    - Maintain existing RLS policies
    - Keep public read access for games
*/

-- Add new columns for IGDB integration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE games ADD COLUMN image_url text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'igdb_id'
  ) THEN
    ALTER TABLE games ADD COLUMN igdb_id integer;
  END IF;
END $$;

-- Remove columns that don't exist in current schema if they were added previously
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'genre'
  ) THEN
    ALTER TABLE games DROP COLUMN genre;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'release_year'
  ) THEN
    ALTER TABLE games DROP COLUMN release_year;
  END IF;
END $$;

-- Add index on igdb_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_games_igdb_id ON games(igdb_id);
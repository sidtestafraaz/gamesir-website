/*
  # Add testing controllers array field

  1. New Fields
    - `testing_controller_ids` (text array) - stores multiple controller IDs
  
  2. Migration
    - Add new array field for multiple controllers
    - Migrate existing single controller data to array format
    - Keep backward compatibility with existing single controller field
*/

-- Add new array field for multiple testing controllers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'testing_controller_ids'
  ) THEN
    ALTER TABLE games ADD COLUMN testing_controller_ids text[] DEFAULT '{}';
  END IF;
END $$;

-- Migrate existing single controller data to array format
UPDATE games 
SET testing_controller_ids = ARRAY[testing_controller_id::text]
WHERE testing_controller_id IS NOT NULL 
  AND (testing_controller_ids IS NULL OR testing_controller_ids = '{}');
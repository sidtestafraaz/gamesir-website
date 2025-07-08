/*
  # Fix testing controllers relation

  1. Create proper junction table for many-to-many relationship
  2. Migrate existing data from testing_controller_ids array
  3. Set up proper foreign key constraints
*/

-- Create junction table for games and testing controllers
CREATE TABLE IF NOT EXISTS games_testing_controllers (
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  controller_id uuid REFERENCES controllers(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, controller_id)
);

-- Migrate data from testing_controller_ids array to junction table
INSERT INTO games_testing_controllers (game_id, controller_id)
SELECT 
  g.id as game_id,
  unnest(g.testing_controller_ids)::uuid as controller_id
FROM games g
WHERE g.testing_controller_ids IS NOT NULL 
  AND array_length(g.testing_controller_ids, 1) > 0
ON CONFLICT (game_id, controller_id) DO NOTHING;

-- Also migrate single testing_controller_id if not already in array
INSERT INTO games_testing_controllers (game_id, controller_id)
SELECT 
  g.id as game_id,
  g.testing_controller_id as controller_id
FROM games g
WHERE g.testing_controller_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM games_testing_controllers gtc 
    WHERE gtc.game_id = g.id AND gtc.controller_id = g.testing_controller_id
  )
ON CONFLICT (game_id, controller_id) DO NOTHING;

-- Enable RLS on junction table
ALTER TABLE games_testing_controllers ENABLE ROW LEVEL SECURITY;

-- Create policy for reading testing controllers
CREATE POLICY "Public read access for games testing controllers"
  ON games_testing_controllers
  FOR SELECT
  TO anon
  USING (true);

-- Create policy for inserting testing controllers
CREATE POLICY "Insert access for games testing controllers"
  ON games_testing_controllers
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy for updating testing controllers
CREATE POLICY "Update access for games testing controllers"
  ON games_testing_controllers
  FOR UPDATE
  TO anon
  USING (true);

-- Create policy for deleting testing controllers
CREATE POLICY "Delete access for games testing controllers"
  ON games_testing_controllers
  FOR DELETE
  TO anon
  USING (true);
/*
  # Clear games table

  1. Changes
    - Remove all existing games from the games table
    - This will allow fresh testing of the approval workflow
  
  2. Security
    - No changes to RLS policies
    - Maintains existing table structure
*/

-- Clear all games from the table
DELETE FROM games;
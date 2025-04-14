/*
  # Add nutrition columns to recipes table

  1. Changes
    - Add total_calories (real)
    - Add total_protein (real)
    - Add total_carbs (real)
    - Add total_fat (real)
    All columns default to 0 to prevent null values and ensure data consistency

  2. Notes
    - Using DO block to safely add columns if they don't exist
    - All columns default to 0 to maintain data integrity
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recipes' AND column_name = 'total_calories'
  ) THEN
    ALTER TABLE recipes ADD COLUMN total_calories real DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recipes' AND column_name = 'total_protein'
  ) THEN
    ALTER TABLE recipes ADD COLUMN total_protein real DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recipes' AND column_name = 'total_carbs'
  ) THEN
    ALTER TABLE recipes ADD COLUMN total_carbs real DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recipes' AND column_name = 'total_fat'
  ) THEN
    ALTER TABLE recipes ADD COLUMN total_fat real DEFAULT 0;
  END IF;
END $$;
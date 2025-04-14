/*
  # Remove duplicate Aguacate entries

  1. Changes
    - Remove any existing 'Aguacate' entries to prevent duplicates
    - Add a check to prevent duplicate ingredient names (case-insensitive)

  2. Security
    - No changes to security policies
*/

-- Remove any existing 'Aguacate' entries
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM ingredients 
    WHERE LOWER(name) = LOWER('Aguacate')
  ) THEN
    DELETE FROM ingredients 
    WHERE LOWER(name) = LOWER('Aguacate');
  END IF;
END $$;
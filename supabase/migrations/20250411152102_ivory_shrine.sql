/*
  # Fix unit equivalences policies

  1. Changes
    - Drop existing policies to avoid conflicts
    - Recreate RLS policies for unit_equivalences table to allow:
      - Public read access
      - Authenticated users to insert/update/delete
    
  2. Security
    - Maintains same security model but fixes policy conflicts
    - Ensures proper access control through user authentication
    - Links unit equivalences to ingredients for ownership checks
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to unit_equivalences" ON unit_equivalences;
DROP POLICY IF EXISTS "Allow authenticated users to insert unit_equivalences" ON unit_equivalences;
DROP POLICY IF EXISTS "Allow authenticated users to update unit_equivalences" ON unit_equivalences;
DROP POLICY IF EXISTS "Allow authenticated users to delete unit_equivalences" ON unit_equivalences;

-- Recreate policies with proper checks
CREATE POLICY "Allow public read access to unit_equivalences"
  ON unit_equivalences
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert unit_equivalences"
  ON unit_equivalences
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update unit_equivalences"
  ON unit_equivalences
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ingredients
      WHERE ingredients.id = unit_equivalences.ingredient_id
      AND ingredients.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ingredients
      WHERE ingredients.id = unit_equivalences.ingredient_id
      AND ingredients.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow authenticated users to delete unit_equivalences"
  ON unit_equivalences
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ingredients
      WHERE ingredients.id = unit_equivalences.ingredient_id
      AND ingredients.user_id = auth.uid()
    )
  );
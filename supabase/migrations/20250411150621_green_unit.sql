/*
  # Update security policies to allow public access

  1. Changes
    - Make user_id nullable in ingredients and recipes tables
    - Update RLS policies to allow public access for all operations
    - Remove user_id checks from policies

  Note: This is a temporary change for development purposes only.
  In production, proper authentication should be enforced.
*/

-- Make user_id nullable
ALTER TABLE ingredients ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE recipes ALTER COLUMN user_id DROP NOT NULL;

-- Update ingredients policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON ingredients;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON ingredients;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON ingredients;

CREATE POLICY "Enable public insert" ON ingredients
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Enable public update" ON ingredients
  FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable public delete" ON ingredients
  FOR DELETE TO public
  USING (true);

-- Update recipes policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON recipes;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON recipes;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON recipes;

CREATE POLICY "Enable public insert" ON recipes
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Enable public update" ON recipes
  FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable public delete" ON recipes
  FOR DELETE TO public
  USING (true);

-- Update recipe_ingredients policies
DROP POLICY IF EXISTS "Enable insert for recipe owners" ON recipe_ingredients;
DROP POLICY IF EXISTS "Enable update for recipe owners" ON recipe_ingredients;
DROP POLICY IF EXISTS "Enable delete for recipe owners" ON recipe_ingredients;

CREATE POLICY "Enable public insert" ON recipe_ingredients
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Enable public update" ON recipe_ingredients
  FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable public delete" ON recipe_ingredients
  FOR DELETE TO public
  USING (true);
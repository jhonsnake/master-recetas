/*
  # Update shopping lists RLS policies

  1. Changes
    - Drop existing RLS policies that require authentication
    - Create new policies that allow public access
    - Make user_id nullable
    
  2. Security
    - Allow public access to all operations (development only)
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own shopping lists" ON shopping_lists;
DROP POLICY IF EXISTS "Users can insert own shopping lists" ON shopping_lists;
DROP POLICY IF EXISTS "Users can update own shopping lists" ON shopping_lists;
DROP POLICY IF EXISTS "Users can delete own shopping lists" ON shopping_lists;

DROP POLICY IF EXISTS "Users can read own shopping list items" ON shopping_list_items;
DROP POLICY IF EXISTS "Users can insert own shopping list items" ON shopping_list_items;
DROP POLICY IF EXISTS "Users can update own shopping list items" ON shopping_list_items;
DROP POLICY IF EXISTS "Users can delete own shopping list items" ON shopping_list_items;

-- Make user_id nullable
ALTER TABLE shopping_lists
ALTER COLUMN user_id DROP NOT NULL;

-- Create new public access policies for shopping_lists
CREATE POLICY "Enable public read access for all users"
  ON shopping_lists FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable public insert for all users"
  ON shopping_lists FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable public update for all users"
  ON shopping_lists FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable public delete for all users"
  ON shopping_lists FOR DELETE
  TO public
  USING (true);

-- Create new public access policies for shopping_list_items
CREATE POLICY "Enable public read access for all users"
  ON shopping_list_items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable public insert for all users"
  ON shopping_list_items FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable public update for all users"
  ON shopping_list_items FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable public delete for all users"
  ON shopping_list_items FOR DELETE
  TO public
  USING (true);
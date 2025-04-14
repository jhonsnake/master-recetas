/*
  # Add shopping lists functionality

  1. New Tables
    - `shopping_lists`
      - `id` (uuid, primary key)
      - `name` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key)
    
    - `shopping_list_items`
      - `id` (uuid, primary key)
      - `shopping_list_id` (uuid, foreign key)
      - `ingredient_id` (uuid, foreign key)
      - `quantity` (real)
      - `purchased` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create shopping_lists table
CREATE TABLE IF NOT EXISTS shopping_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

-- Create shopping_list_items table
CREATE TABLE IF NOT EXISTS shopping_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id uuid REFERENCES shopping_lists(id) ON DELETE CASCADE,
  ingredient_id uuid REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity real NOT NULL,
  purchased boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own shopping lists"
  ON shopping_lists
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shopping lists"
  ON shopping_lists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shopping lists"
  ON shopping_lists
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shopping lists"
  ON shopping_lists
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for shopping list items
CREATE POLICY "Users can read own shopping list items"
  ON shopping_list_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE id = shopping_list_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own shopping list items"
  ON shopping_list_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE id = shopping_list_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own shopping list items"
  ON shopping_list_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE id = shopping_list_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own shopping list items"
  ON shopping_list_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE id = shopping_list_id
      AND user_id = auth.uid()
    )
  );
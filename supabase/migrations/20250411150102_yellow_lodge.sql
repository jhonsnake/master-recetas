/*
  # Create recipes schema

  1. New Tables
    - `recipes`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text, max 200 chars)
      - `image_url` (text)
      - `instructions` (text[], for step by step)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp with timezone)

    - `recipe_ingredients`
      - `id` (uuid, primary key)
      - `recipe_id` (uuid, references recipes)
      - `ingredient_id` (uuid, references ingredients)
      - `quantity` (real)
      - `unit_name` (text)
      - `created_at` (timestamp with timezone)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own recipes
    - Allow public read access to recipes
*/

-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text CHECK (char_length(description) <= 200),
  image_url text,
  instructions text[] NOT NULL DEFAULT '{}',
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create recipe_ingredients table
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES ingredients(id),
  quantity real NOT NULL CHECK (quantity > 0),
  unit_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(recipe_id, ingredient_id)
);

-- Enable RLS
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- Recipes policies
CREATE POLICY "Enable read access for all users"
  ON recipes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert for authenticated users only"
  ON recipes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id"
  ON recipes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id"
  ON recipes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Recipe ingredients policies
CREATE POLICY "Enable read access for all users"
  ON recipe_ingredients FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert for recipe owners"
  ON recipe_ingredients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE id = recipe_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Enable update for recipe owners"
  ON recipe_ingredients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE id = recipe_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE id = recipe_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Enable delete for recipe owners"
  ON recipe_ingredients FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE id = recipe_id
      AND user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);
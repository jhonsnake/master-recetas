/*
  # Initial Schema Setup
    - user_id field in all tables to allow filtering by user.
    - Added table for persons, meals and recipes.
    - Persons have name and email
    - Meals have description and date
  1. New Tables
    - `ingredients`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text)
      - `image_url` (text)
      - `calories` (real)
      - `carbs` (real)
      - `fiber` (real)
      - `sugar` (real)
      - `fat` (real)
      - `protein` (real)
      - `base_unit` (text, required)
      - `user_id` (uuid, required)
      - `created_at` (timestamp with timezone)

    - `unit_equivalences`
      - `id` (uuid, primary key)
      - `ingredient_id` (uuid, foreign key)
      - `unit_name` (text, required)
      - `conversion_factor` (real, required)
      - `user_id` (uuid, required)
      - `created_at` (timestamp with timezone)
    - `persons`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `email` (text)
      - `user_id` (uuid, required)
      - `created_at` (timestamp with timezone)
    - `meals`
      - `id` (uuid, primary key)
      - `description` (text, required)
      - `date` (date, required)
      - `user_id` (uuid, required)
      - `created_at` (timestamp with timezone)
    - `recipes`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `created_at` (timestamp with timezone)
      - `created_at` (timestamp with timezone)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  calories real,
  carbs real,
  fiber real,
  sugar real,
  fat real,
  protein real,
  base_unit text NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create unit_equivalences table
CREATE TABLE IF NOT EXISTS unit_equivalences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ingredient_id uuid REFERENCES ingredients(id) ON DELETE CASCADE,
  unit_name text NOT NULL,
  conversion_factor real NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create persons table
CREATE TABLE IF NOT EXISTS persons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text,
  created_at timestamptz DEFAULT now()
);

-- Create meals table
CREATE TABLE IF NOT EXISTS meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  description text NOT NULL,
  date DATE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_equivalences ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Ingredients policies
CREATE POLICY "Allow authenticated users to select ingredients"
  ON public.ingredients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert on ingredients"
  ON public.ingredients
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to update ingredients"
  ON public.ingredients
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to delete ingredients"
  ON public.ingredients
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Unit equivalences policies
CREATE POLICY "Allow authenticated users to select unit_equivalences"
  ON public.unit_equivalences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert on unit_equivalences"
  ON public.unit_equivalences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to update unit_equivalences"
  ON public.unit_equivalences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to delete unit_equivalences"
  ON public.unit_equivalences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Persons policies
CREATE POLICY "Allow authenticated users to select persons"
  ON public.persons
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert on persons"
  ON public.persons
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to update persons"
  ON public.persons
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to delete persons"
  ON public.persons
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Meals policies
CREATE POLICY "Allow authenticated users to select meals"
  ON public.meals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert on meals"
  ON public.meals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to update meals"
  ON public.meals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to delete meals"
  ON public.meals
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Recipes policies
CREATE POLICY "Allow authenticated users to select recipes"
  ON public.recipes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert on recipes"
  ON public.recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to update recipes"
  ON public.recipes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to delete recipes"
  ON public.recipes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
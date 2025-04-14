/*
  # Initial Schema Setup

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
      - `created_at` (timestamp with timezone)

    - `unit_equivalences`
      - `id` (uuid, primary key)
      - `ingredient_id` (uuid, foreign key)
      - `unit_name` (text, required)
      - `conversion_factor` (real, required)
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
  created_at timestamptz DEFAULT now()
);

-- Create unit_equivalences table
CREATE TABLE IF NOT EXISTS unit_equivalences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id uuid REFERENCES ingredients(id) ON DELETE CASCADE,
  unit_name text NOT NULL,
  conversion_factor real NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_equivalences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to ingredients"
  ON ingredients
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert ingredients"
  ON ingredients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update ingredients"
  ON ingredients
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete ingredients"
  ON ingredients
  FOR DELETE
  TO authenticated
  USING (true);

-- Unit equivalences policies
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
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete unit_equivalences"
  ON unit_equivalences
  FOR DELETE
  TO authenticated
  USING (true);
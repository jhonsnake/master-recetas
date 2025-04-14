/*
  # Create persons table and schema

  1. New Tables
    - `persons`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `calories` (real)
      - `carbs` (real)
      - `fiber` (real)
      - `sugar` (real)
      - `fat` (real)
      - `protein` (real)
      - `created_at` (timestamp with timezone)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS
    - Add policies for public access (temporary for development)
*/

CREATE TABLE IF NOT EXISTS persons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  calories real NOT NULL DEFAULT 0,
  carbs real NOT NULL DEFAULT 0,
  fiber real NOT NULL DEFAULT 0,
  sugar real NOT NULL DEFAULT 0,
  fat real NOT NULL DEFAULT 0,
  protein real NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (development only)
CREATE POLICY "Enable read access for all users"
  ON persons FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert for all users"
  ON persons FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable update for all users"
  ON persons FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for all users"
  ON persons FOR DELETE
  TO public
  USING (true);
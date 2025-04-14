/*
  # Create meal planner schema

  1. Changes
    - Drop existing view and policies
    - Create meal types and meal plans tables
    - Add RLS policies
    - Insert default meal types
    - Create meal plan details view
*/

-- Drop existing view if it exists
DROP VIEW IF EXISTS meal_plan_details;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON meal_types;
DROP POLICY IF EXISTS "Enable insert for all users" ON meal_types;
DROP POLICY IF EXISTS "Enable update for all users" ON meal_types;
DROP POLICY IF EXISTS "Enable delete for all users" ON meal_types;
DROP POLICY IF EXISTS "Enable read access for all users" ON meal_plans;
DROP POLICY IF EXISTS "Enable insert for all users" ON meal_plans;
DROP POLICY IF EXISTS "Enable update for all users" ON meal_plans;
DROP POLICY IF EXISTS "Enable delete for all users" ON meal_plans;

-- Create meal_types table
CREATE TABLE IF NOT EXISTS meal_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create meal_plans table
CREATE TABLE IF NOT EXISTS meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  meal_type_id uuid REFERENCES meal_types(id),
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(date, meal_type_id)
);

-- Enable RLS
ALTER TABLE meal_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (development only)
CREATE POLICY "Enable read access for all users"
  ON meal_types FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert for all users"
  ON meal_types FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable update for all users"
  ON meal_types FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for all users"
  ON meal_types FOR DELETE
  TO public
  USING (true);

-- Meal plans policies
CREATE POLICY "Enable read access for all users"
  ON meal_plans FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert for all users"
  ON meal_plans FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable update for all users"
  ON meal_plans FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for all users"
  ON meal_plans FOR DELETE
  TO public
  USING (true);

-- Insert default meal types if they don't exist
INSERT INTO meal_types (name, "order")
SELECT name, "order"
FROM (VALUES
  ('Desayuno', 1),
  ('Almuerzo', 2),
  ('Merienda', 3),
  ('Cena', 4),
  ('Snack', 5)
) AS new_types(name, "order")
WHERE NOT EXISTS (
  SELECT 1 FROM meal_types WHERE name = new_types.name
);

-- Create view for meal plan details
CREATE OR REPLACE VIEW meal_plan_details AS
WITH daily_totals AS (
  SELECT 
    mp.date,
    SUM(r.total_calories) as total_calories,
    SUM(r.total_protein) as total_protein,
    SUM(r.total_carbs) as total_carbs,
    SUM(r.total_fat) as total_fat,
    json_agg(
      json_build_object(
        'meal_type', mt.name,
        'meal_type_order', mt."order",
        'recipe', json_build_object(
          'id', r.id,
          'name', r.name,
          'calories', r.total_calories,
          'protein', r.total_protein,
          'carbs', r.total_carbs,
          'fat', r.total_fat
        )
      ) ORDER BY mt."order"
    ) as meals
  FROM meal_plans mp
  JOIN meal_types mt ON mt.id = mp.meal_type_id
  JOIN recipe_with_ingredients r ON r.id = mp.recipe_id
  GROUP BY mp.date
)
SELECT 
  dt.*,
  ROUND((dt.total_calories / 2000 * 100)::numeric, 1) as calories_percentage,
  ROUND((dt.total_protein / 50 * 100)::numeric, 1) as protein_percentage,
  ROUND((dt.total_carbs / 275 * 100)::numeric, 1) as carbs_percentage,
  ROUND((dt.total_fat / 55 * 100)::numeric, 1) as fat_percentage
FROM daily_totals dt;
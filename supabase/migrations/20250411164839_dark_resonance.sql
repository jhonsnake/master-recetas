/*
  # Create meal planning schema

  1. New Tables
    - `meal_types`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `order` (integer, for sorting)

    - `meal_plans`
      - `id` (uuid, primary key)
      - `person_id` (uuid, references persons)
      - `date` (date, required)
      - `meal_type_id` (uuid, references meal_types)
      - `recipe_id` (uuid, references recipes)
      - `created_at` (timestamp with timezone)

  2. Security
    - Enable RLS
    - Add policies for public access (development only)
*/

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
  person_id uuid REFERENCES persons(id) ON DELETE CASCADE,
  date date NOT NULL,
  meal_type_id uuid REFERENCES meal_types(id),
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(person_id, date, meal_type_id)
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

-- Insert default meal types
INSERT INTO meal_types (name, "order") VALUES
  ('Desayuno', 1),
  ('Almuerzo', 2),
  ('Merienda', 3),
  ('Cena', 4),
  ('Snack', 5);

-- Create view for meal plan details
CREATE OR REPLACE VIEW meal_plan_details AS
WITH daily_totals AS (
  SELECT 
    mp.person_id,
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
  GROUP BY mp.person_id, mp.date
)
SELECT 
  dt.*,
  p.name as person_name,
  p.calories as daily_calorie_goal,
  p.protein as daily_protein_goal,
  p.carbs as daily_carbs_goal,
  p.fat as daily_fat_goal,
  ROUND((dt.total_calories / p.calories * 100)::numeric, 1) as calories_percentage,
  ROUND((dt.total_protein / p.protein * 100)::numeric, 1) as protein_percentage,
  ROUND((dt.total_carbs / p.carbs * 100)::numeric, 1) as carbs_percentage,
  ROUND((dt.total_fat / p.fat * 100)::numeric, 1) as fat_percentage
FROM daily_totals dt
JOIN persons p ON p.id = dt.person_id;
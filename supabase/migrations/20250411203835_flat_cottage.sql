/*
  # Fix meal planner nutritional calculations

  1. Changes
    - Update meal_plan_details view to correctly calculate nutritional totals
    - Fix percentage calculations
    - Ensure proper aggregation of recipe nutritional values
    
  2. View Structure
    - All fields from meal_plans table
    - Correctly calculated nutritional totals
    - Proper percentage calculations
*/

-- Drop existing view
DROP VIEW IF EXISTS meal_plan_details;

-- Recreate view with fixed calculations
CREATE OR REPLACE VIEW meal_plan_details AS
WITH meal_details AS (
  SELECT
    mp.date,
    json_agg(
      json_build_object(
        'meal_type', mt.name,
        'meal_type_order', mt.order,
        'recipe', json_build_object(
          'id', r.id,
          'name', r.name,
          'image_url', r.image_url,
          'calories', r.total_calories,
          'protein', r.total_protein,
          'carbs', r.total_carbs,
          'fat', r.total_fat
        )
      ) ORDER BY mt.order
    ) as meals,
    COALESCE(SUM(r.total_calories), 0) as total_calories,
    COALESCE(SUM(r.total_protein), 0) as total_protein,
    COALESCE(SUM(r.total_carbs), 0) as total_carbs,
    COALESCE(SUM(r.total_fat), 0) as total_fat
  FROM meal_plans mp
  JOIN meal_types mt ON mp.meal_type_id = mt.id
  JOIN recipe_with_ingredients r ON mp.recipe_id = r.id
  GROUP BY mp.date
)
SELECT
  date,
  meals,
  total_calories,
  total_protein,
  total_carbs,
  total_fat,
  ROUND((total_calories / NULLIF(2000, 0) * 100)::numeric, 1) as calories_percentage,
  ROUND((total_protein / NULLIF(50, 0) * 100)::numeric, 1) as protein_percentage,
  ROUND((total_carbs / NULLIF(275, 0) * 100)::numeric, 1) as carbs_percentage,
  ROUND((total_fat / NULLIF(55, 0) * 100)::numeric, 1) as fat_percentage
FROM meal_details;
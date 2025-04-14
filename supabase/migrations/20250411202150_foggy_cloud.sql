/*
  # Create meal plan details view

  1. New View
    - `meal_plan_details`
      - Combines data from meal_plans, recipes, and meal_types
      - Calculates daily nutritional totals
      - Aggregates meals for each day with their details

  2. View Structure
    - Date and meal information
    - Nutritional calculations
    - Aggregated meal details as JSON
*/

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
          'total_calories', r.total_calories,
          'total_protein', r.total_protein,
          'total_carbs', r.total_carbs,
          'total_fat', r.total_fat
        )
      ) ORDER BY mt.order
    ) as meals,
    SUM(r.total_calories) as total_calories,
    SUM(r.total_protein) as total_protein,
    SUM(r.total_carbs) as total_carbs,
    SUM(r.total_fat) as total_fat
  FROM meal_plans mp
  JOIN meal_types mt ON mp.meal_type_id = mt.id
  JOIN recipes r ON mp.recipe_id = r.id
  GROUP BY mp.date
)
SELECT
  date,
  meals,
  total_calories,
  total_protein,
  total_carbs,
  total_fat,
  CASE 
    WHEN total_calories > 0 THEN total_calories
    ELSE 0
  END as calories_percentage,
  CASE 
    WHEN total_protein > 0 THEN total_protein
    ELSE 0
  END as protein_percentage,
  CASE 
    WHEN total_carbs > 0 THEN total_carbs
    ELSE 0
  END as carbs_percentage,
  CASE 
    WHEN total_fat > 0 THEN total_fat
    ELSE 0
  END as fat_percentage
FROM meal_details;
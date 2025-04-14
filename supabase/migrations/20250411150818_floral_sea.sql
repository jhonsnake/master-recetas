/*
  # Create recipe_with_ingredients view

  1. New View
    - `recipe_with_ingredients`
      - Combines recipe data with ingredient information
      - Calculates total nutritional values
      - Includes ingredient details as a JSON array
  
  2. View Structure
    - All fields from recipes table
    - Aggregated nutritional values
    - JSON array of ingredients with quantities and units
*/

CREATE OR REPLACE VIEW recipe_with_ingredients AS
WITH recipe_nutrition AS (
  SELECT 
    ri.recipe_id,
    SUM(
      CASE 
        WHEN ue.conversion_factor IS NOT NULL THEN
          (i.calories * ri.quantity * ue.conversion_factor) / i.base_quantity
        ELSE
          (i.calories * ri.quantity) / i.base_quantity
      END
    ) as calories,
    SUM(
      CASE 
        WHEN ue.conversion_factor IS NOT NULL THEN
          (i.protein * ri.quantity * ue.conversion_factor) / i.base_quantity
        ELSE
          (i.protein * ri.quantity) / i.base_quantity
      END
    ) as protein,
    SUM(
      CASE 
        WHEN ue.conversion_factor IS NOT NULL THEN
          (i.carbs * ri.quantity * ue.conversion_factor) / i.base_quantity
        ELSE
          (i.carbs * ri.quantity) / i.base_quantity
      END
    ) as carbs,
    SUM(
      CASE 
        WHEN ue.conversion_factor IS NOT NULL THEN
          (i.fat * ri.quantity * ue.conversion_factor) / i.base_quantity
        ELSE
          (i.fat * ri.quantity) / i.base_quantity
      END
    ) as fat,
    json_agg(
      json_build_object(
        'id', i.id,
        'name', i.name,
        'quantity', ri.quantity,
        'unit', ri.unit_name,
        'base_unit', i.base_unit
      )
    ) as ingredients
  FROM recipe_ingredients ri
  JOIN ingredients i ON i.id = ri.ingredient_id
  LEFT JOIN unit_equivalences ue ON 
    ue.ingredient_id = i.id AND 
    ue.unit_name = ri.unit_name
  GROUP BY ri.recipe_id
)
SELECT 
  r.*,
  COALESCE(rn.calories, 0) as total_calories,
  COALESCE(rn.protein, 0) as total_protein,
  COALESCE(rn.carbs, 0) as total_carbs,
  COALESCE(rn.fat, 0) as total_fat,
  json_build_object(
    'calories', COALESCE(rn.calories, 0),
    'protein', COALESCE(rn.protein, 0),
    'carbs', COALESCE(rn.carbs, 0),
    'fat', COALESCE(rn.fat, 0)
  ) as total_nutrition,
  COALESCE(rn.ingredients, '[]'::json) as ingredients
FROM recipes r
LEFT JOIN recipe_nutrition rn ON r.id = rn.recipe_id;
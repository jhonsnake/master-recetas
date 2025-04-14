/*
  # Fix unit conversion display

  1. Changes
    - Update recipe_with_ingredients view to include proper unit conversion display
    - Add base quantity information to ingredient details
    - Format conversion text for better readability
*/

CREATE OR REPLACE VIEW recipe_with_ingredients AS
WITH recipe_nutrition AS (
  SELECT 
    ri.recipe_id,
    SUM(
      CASE 
        WHEN ue.conversion_factor IS NOT NULL THEN
          (i.calories * ri.quantity * i.base_quantity * ue.conversion_factor) / i.base_quantity
        ELSE
          (i.calories * ri.quantity)
      END
    ) as calories,
    SUM(
      CASE 
        WHEN ue.conversion_factor IS NOT NULL THEN
          (i.protein * ri.quantity * i.base_quantity * ue.conversion_factor) / i.base_quantity
        ELSE
          (i.protein * ri.quantity)
      END
    ) as protein,
    SUM(
      CASE 
        WHEN ue.conversion_factor IS NOT NULL THEN
          (i.carbs * ri.quantity * i.base_quantity * ue.conversion_factor) / i.base_quantity
        ELSE
          (i.carbs * ri.quantity)
      END
    ) as carbs,
    SUM(
      CASE 
        WHEN ue.conversion_factor IS NOT NULL THEN
          (i.fat * ri.quantity * i.base_quantity * ue.conversion_factor) / i.base_quantity
        ELSE
          (i.fat * ri.quantity)
      END
    ) as fat,
    json_agg(
      json_build_object(
        'id', i.id,
        'name', i.name,
        'quantity', ri.quantity,
        'unit_name', ri.unit_name,
        'base_unit', i.base_unit,
        'base_quantity', i.base_quantity,
        'conversion_factor', COALESCE(ue.conversion_factor, 1),
        'conversion_text', 
          CASE 
            WHEN ue.conversion_factor IS NOT NULL THEN
              CONCAT(
                ri.unit_name, ' ', ri.quantity::text,
                ' ~ ',
                (ri.quantity * i.base_quantity * ue.conversion_factor)::text,
                ' ', i.base_unit
              )
            ELSE
              CONCAT(ri.unit_name, ' ', ri.quantity::text)
          END,
        'nutritional_values', json_build_object(
          'calories', i.calories,
          'carbs', i.carbs,
          'fiber', i.fiber,
          'sugar', i.sugar,
          'fat', i.fat,
          'protein', i.protein
        )
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
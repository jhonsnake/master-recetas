-- Actualiza la view para incluir el campo porciones
DROP VIEW IF EXISTS recipe_with_live_nutrition CASCADE;

CREATE VIEW recipe_with_live_nutrition AS
SELECT
  r.id,
  r.name,
  r.description,
  r.image_url,
  r.instructions,
  r.user_id,
  r.created_at,
  r.porciones,
  r.total_nutrition,
  ARRAY(
    SELECT jsonb_build_object(
      'id', ri.ingredient_id,
      'name', i.name,
      'quantity', ri.quantity,
      'unit_name', ri.unit_name,
      'base_unit', i.base_unit,
      'conversion_factor', 1,
      'conversion_text', '',
      'nutritional_values', jsonb_build_object(
        'calories', i.calories,
        'carbs', i.carbs,
        'fiber', i.fiber,
        'sugar', i.sugar,
        'fat', i.fat,
        'protein', i.protein
      )
    )
    FROM recipe_ingredients ri
    JOIN ingredients i ON ri.ingredient_id = i.id
    WHERE ri.recipe_id = r.id
  ) AS ingredients
FROM recipes r;

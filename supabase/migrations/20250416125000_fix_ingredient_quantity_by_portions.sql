-- Migration: Ajusta la cantidad de ingredientes según el número de porciones agendadas en el meal plan
DROP VIEW IF EXISTS meal_plan_details CASCADE;

CREATE VIEW meal_plan_details AS
SELECT
  mp.id AS meal_plan_id,
  mp.date,
  mp.meal_type_id,
  mt.name AS meal_type,
  mp.recipe_id,
  mp.porciones,
  r.name AS recipe_name,
  r.image_url,
  r.instructions,
  r.porciones AS receta_porciones,
  r.total_nutrition,
  r.live_total_nutrition,
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', i.id,
        'name', i.name,
        'base_unit', i.base_unit,
        'base_quantity', i.base_quantity,
        'image_url', i.image_url,
        'tags', i.tags,
        'unit_equivalences', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'unit_name', ue.unit_name,
              'conversion_factor', ue.conversion_factor
            )
          )
          FROM unit_equivalences ue
          WHERE ue.ingredient_id = i.id
        ),
        -- Ajuste de cantidad por porciones agendadas
        'quantity', (ri.quantity * mp.porciones / NULLIF(r.porciones, 0)),
        'unit_name', ri.unit_name,
        'conversion_text', ri.conversion_text
      )
    )
    FROM recipe_ingredients ri
    JOIN ingredients i ON i.id = ri.ingredient_id
    WHERE ri.recipe_id = r.id
  ) AS ingredients
FROM meal_plans mp
JOIN recipe_with_live_nutrition r ON r.id = mp.recipe_id
LEFT JOIN meal_types mt ON mt.id = mp.meal_type_id;

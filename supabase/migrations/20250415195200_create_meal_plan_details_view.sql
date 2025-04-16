-- Crea la view meal_plan_details para el meal planner
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
  r.ingredients
FROM meal_plans mp
JOIN recipe_with_live_nutrition r ON r.id = mp.recipe_id
LEFT JOIN meal_types mt ON mt.id = mp.meal_type_id;

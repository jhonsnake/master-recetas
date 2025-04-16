-- VIEW: meal_plan_details
-- Calcula los totales nutricionales diarios en vivo usando la VIEW recipe_with_live_nutrition

DROP VIEW IF EXISTS meal_plan_details;

CREATE OR REPLACE VIEW meal_plan_details AS
SELECT
  mp.date,
  COALESCE(SUM(NULLIF((r.live_total_nutrition->>'calories'), '')::numeric), 0) AS total_calories,
  COALESCE(SUM(NULLIF((r.live_total_nutrition->>'protein'), '')::numeric), 0) AS total_protein,
  COALESCE(SUM(NULLIF((r.live_total_nutrition->>'carbs'), '')::numeric), 0) AS total_carbs,
  COALESCE(SUM(NULLIF((r.live_total_nutrition->>'fat'), '')::numeric), 0) AS total_fat,
  jsonb_agg(
    jsonb_build_object(
      'meal_type', mt.name,
      'recipe', r
    )
  ) AS meals
FROM meal_plans mp
JOIN recipe_with_live_nutrition r ON r.id = mp.recipe_id
JOIN meal_types mt ON mt.id = mp.meal_type_id
GROUP BY mp.date;

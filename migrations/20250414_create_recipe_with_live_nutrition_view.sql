-- VIEW que calcula el total_nutrition "en vivo" para cada receta
CREATE OR REPLACE VIEW recipe_with_live_nutrition AS
SELECT
  r.*,
  jsonb_build_object(
    'calories', COALESCE(SUM(i.calories * (ri.quantity * COALESCE(ue.conversion_factor, 1) / i.base_quantity)), 0),
    'protein', COALESCE(SUM(i.protein * (ri.quantity * COALESCE(ue.conversion_factor, 1) / i.base_quantity)), 0),
    'carbs',   COALESCE(SUM(i.carbs   * (ri.quantity * COALESCE(ue.conversion_factor, 1) / i.base_quantity)), 0),
    'fat',     COALESCE(SUM(i.fat     * (ri.quantity * COALESCE(ue.conversion_factor, 1) / i.base_quantity)), 0),
    'fiber',   COALESCE(SUM(i.fiber   * (ri.quantity * COALESCE(ue.conversion_factor, 1) / i.base_quantity)), 0),
    'sugar',   COALESCE(SUM(i.sugar   * (ri.quantity * COALESCE(ue.conversion_factor, 1) / i.base_quantity)), 0)
  ) AS live_total_nutrition
FROM recipes r
JOIN recipe_ingredients ri ON ri.recipe_id = r.id
JOIN ingredients i ON i.id = ri.ingredient_id
LEFT JOIN LATERAL (
  SELECT conversion_factor
  FROM unit_equivalences
  WHERE unit_name = ri.unit_name AND ingredient_id = i.id
  LIMIT 1
) ue ON TRUE
GROUP BY r.id;

-- Migration: Trigger y función para recalcular automáticamente total_nutrition al editar un ingrediente
-- Ejecuta este archivo en el SQL Editor de Supabase

-- 1. Crear función para recalcular total_nutrition en recetas que usan el ingrediente actualizado
CREATE OR REPLACE FUNCTION recalculate_total_nutrition_for_ingredient()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE recipes
  SET total_nutrition = subquery.new_total
  FROM (
    SELECT
      r.id AS recipe_id,
      jsonb_build_object(
        'calories', SUM(i.calories * (ri.quantity * COALESCE(ue.conversion_factor, 1) / i.base_quantity)),
        'protein', SUM(i.protein * (ri.quantity * COALESCE(ue.conversion_factor, 1) / i.base_quantity)),
        'carbs',   SUM(i.carbs   * (ri.quantity * COALESCE(ue.conversion_factor, 1) / i.base_quantity)),
        'fat',     SUM(i.fat     * (ri.quantity * COALESCE(ue.conversion_factor, 1) / i.base_quantity)),
        'fiber',   SUM(i.fiber   * (ri.quantity * COALESCE(ue.conversion_factor, 1) / i.base_quantity)),
        'sugar',   SUM(i.sugar   * (ri.quantity * COALESCE(ue.conversion_factor, 1) / i.base_quantity))
      ) AS new_total
    FROM recipes r
    JOIN recipe_ingredients ri ON ri.recipe_id = r.id
    JOIN ingredients i ON i.id = ri.ingredient_id
    LEFT JOIN LATERAL (
      SELECT conversion_factor
      FROM unit_equivalences
      WHERE unit_name = ri.unit_name AND ingredient_id = i.id
      LIMIT 1
    ) ue ON TRUE
    WHERE i.id = NEW.id
    GROUP BY r.id
  ) AS subquery
  WHERE recipes.id = subquery.recipe_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Crear trigger para ejecutar la función después de UPDATE en ingredients
DROP TRIGGER IF EXISTS trigger_recalculate_total_nutrition ON ingredients;

CREATE TRIGGER trigger_recalculate_total_nutrition
AFTER UPDATE ON ingredients
FOR EACH ROW
EXECUTE FUNCTION recalculate_total_nutrition_for_ingredient();

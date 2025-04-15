// Script para recalcular y corregir el campo total_nutrition de todas las recetas en Supabase
// USO: node scripts/fix_total_nutrition.js
// Requiere: SUPABASE_SERVICE_KEY y SUPABASE_URL en variables de entorno

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY en el entorno.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  // 1. Obtener todas las recetas
  const { data: recipes, error: recipesError } = await supabase
    .from('recipes')
    .select('id');

  if (recipesError) throw recipesError;

  for (const recipe of recipes) {
    // 2. Obtener ingredientes de la receta con sus datos y equivalencias
    const { data: ingredients, error: ingError } = await supabase
      .from('recipe_ingredients')
      .select(`quantity, unit_name, ingredients:ingredient_id (*, unit_equivalences (*))`)
      .eq('recipe_id', recipe.id);
    if (ingError) {
      console.error('Error al obtener ingredientes de receta', recipe.id, ingError);
      continue;
    }

    // 3. Calcular total_nutrition
    const total_nutrition = ingredients.reduce((totals, ing) => {
      const ingredient = ing.ingredients;
      const availableUnits = [
        { name: ingredient.base_unit, conversion_factor: 1 },
        ...(ingredient.unit_equivalences || []).map(ue => ({
          name: ue.unit_name,
          conversion_factor: ue.conversion_factor
        }))
      ];
      const unit = availableUnits.find(u => u.name === ing.unit_name) || { conversion_factor: 1 };
      const factor = unit.conversion_factor;
      const cantidadEnBase = ing.quantity * factor;
      const proporcion = cantidadEnBase / ingredient.base_quantity;
      return {
        calories: totals.calories + (ingredient.calories || 0) * proporcion,
        protein: totals.protein + (ingredient.protein || 0) * proporcion,
        carbs: totals.carbs + (ingredient.carbs || 0) * proporcion,
        fat: totals.fat + (ingredient.fat || 0) * proporcion,
        fiber: totals.fiber + (ingredient.fiber || 0) * proporcion,
        sugar: totals.sugar + (ingredient.sugar || 0) * proporcion,
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 });

    // 4. Actualizar la receta
    const { error: updateError } = await supabase
      .from('recipes')
      .update({ total_nutrition })
      .eq('id', recipe.id);
    if (updateError) {
      console.error('Error actualizando receta', recipe.id, updateError);
    } else {
      console.log('Receta actualizada:', recipe.id, total_nutrition);
    }
  }
  console.log('¡Migración completada!');
}

main().catch(err => {
  console.error('Error general:', err);
  process.exit(1);
});

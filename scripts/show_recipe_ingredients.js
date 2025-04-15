// Script para mostrar los ingredientes, cantidades y total_nutrition de una receta específica
// USO: node scripts/show_recipe_ingredients.js <recipe_id>
// Requiere: SUPABASE_URL y SUPABASE_SERVICE_KEY en .env

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

const recipeId = process.argv[2];
if (!recipeId) {
  console.error('Debes pasar el recipe_id como argumento. Ejemplo: node scripts/show_recipe_ingredients.js <recipe_id>');
  process.exit(1);
}

async function main() {
  // 1. Obtener la receta con total_nutrition
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select('id, name, total_nutrition')
    .eq('id', recipeId)
    .single();
  if (recipeError) throw recipeError;
  console.log('Receta:', recipe.name, '\nID:', recipe.id);
  console.log('total_nutrition:', recipe.total_nutrition);

  // 2. Obtener ingredientes de la receta
  const { data: ingredients, error: ingError } = await supabase
    .from('recipe_ingredients')
    .select('quantity, unit_name, ingredients:ingredient_id (id, name, base_quantity, base_unit, calories, fat, protein, carbs, fiber, sugar)')
    .eq('recipe_id', recipeId);
  if (ingError) throw ingError;
  for (const ing of ingredients) {
    const i = ing.ingredients;
    console.log(`- ${i.name}: ${ing.quantity} ${ing.unit_name} (base_quantity: ${i.base_quantity} ${i.base_unit}, calories: ${i.calories})`);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

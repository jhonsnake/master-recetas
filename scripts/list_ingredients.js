// Script para listar todos los ingredientes y revisar base_quantity, base_unit y calories
// USO: node scripts/list_ingredients.js
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

async function main() {
  const { data: ingredients, error } = await supabase
    .from('ingredients')
    .select('id, name, base_quantity, base_unit, calories, fat, protein, carbs, fiber, sugar');
  if (error) throw error;
  for (const ing of ingredients) {
    console.log(`ID: ${ing.id}\nNombre: ${ing.name}\n  base_quantity: ${ing.base_quantity} ${ing.base_unit}\n  calories: ${ing.calories}\n  fat: ${ing.fat}\n  protein: ${ing.protein}\n  carbs: ${ing.carbs}\n  fiber: ${ing.fiber}\n  sugar: ${ing.sugar}\n`);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

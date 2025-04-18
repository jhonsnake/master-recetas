import type { Database } from './types/supabase';

export type Ingredient = Database['public']['Tables']['ingredients']['Row'];
export type UnitEquivalence = Database['public']['Tables']['unit_equivalences']['Row'];
export type Recipe = Database['public']['Tables']['recipes']['Row'];
export type RecipeIngredient = Database['public']['Tables']['recipe_ingredients']['Row'];
export type RecipeWithIngredients = Database['public']['Views']['recipe_with_ingredients']['Row'];

export interface Person {
  id: number;
  name: string;
  calorie_goal: number;
  carbs_goal: number;
  fat_goal: number;
  protein_goal: number;
}

export interface MealPlan {
  id: number;
  person_id: number;
  recipe_id: number;
  date: string;
  meal_type: string;
}

export interface StandardUnit {
  name: string;
  abbreviation: string;
  type: 'weight' | 'volume' | 'unit';
  system: 'metric' | 'imperial' | 'culinary';
  grams?: number;
  ml?: number;
}

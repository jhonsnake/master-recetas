import type { Database } from './supabase';

export type Ingredient = Database['public']['Tables']['ingredients']['Row'];
export type UnitEquivalence = Database['public']['Tables']['unit_equivalences']['Row'];
export type Recipe = Database['public']['Tables']['recipes']['Row'];
export type RecipeIngredient = Database['public']['Tables']['recipe_ingredients']['Row'];
export type RecipeWithIngredients = Database['public']['Views']['recipe_with_ingredients']['Row'];
export type Person = Database['public']['Tables']['persons']['Row'];

export interface StandardUnit {
  name: string;
  abbreviation: string;
  type: 'weight' | 'volume' | 'unit';
  system: 'metric' | 'imperial' | 'culinary';
  grams?: number;
  ml?: number;
}
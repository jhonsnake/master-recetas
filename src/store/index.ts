import { create } from 'zustand';
import { Ingredient, Recipe, Person, MealPlan, User } from '../types';
interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
}

interface AppState {
  ingredients: Ingredient[];
  recipes: Recipe[];
  persons: Person[];
  mealPlans: MealPlan[];
  setIngredients: (ingredients: Ingredient[]) => void;
  setRecipes: (recipes: Recipe[]) => void;
  setPersons: (persons: Person[]) => void;
  setMealPlans: (mealPlans: MealPlan[]) => void;
  addIngredient: (ingredient: Ingredient) => void;
  addRecipe: (recipe: Recipe) => void;
  addPerson: (person: Person) => void;
  addMealPlan: (mealPlan: MealPlan) => void;
}

export const useUserStore = create<UserState>((set) => ({ user: null, loading: false, error: null, setUser: (user) => set({ user }) }));

export const useStore = create<AppState>((set) => ({
  ingredients: [],
  recipes: [],
  persons: [],
  mealPlans: [],
  setIngredients: (ingredients) => set({ ingredients }),
  setRecipes: (recipes) => set({ recipes }),
  setPersons: (persons) => set({ persons }),
  setMealPlans: (mealPlans) => set({ mealPlans }),

  addIngredient: (ingredient) =>
    set((state) => ({ ingredients: [...state.ingredients, ingredient] })),

  addRecipe: (recipe) =>
    set((state) => ({ recipes: [...state.recipes, recipe] })),

  addPerson: (person) =>
    set((state) => ({ persons: [...state.persons, person] })),

  addMealPlan: (mealPlan) =>
    set((state) => ({ mealPlans: [...state.mealPlans, mealPlan] })),
}));

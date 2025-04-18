import React from 'react';
import { Search } from 'lucide-react';

// Updated Recipe type to match data fetched in DayModal
interface Recipe {
  id: string;
  name: string;
  image_url: string | null; // Allow null for image_url
  live_total_nutrition?: { // Nutrition data comes from the view
    calories?: number | null;
    protein?: number | null;
    carbs?: number | null;
    fat?: number | null;
    porciones?: number | null; // Porciones from the view
  };
  porciones?: number | null; // Base porciones from the recipe table itself
}

interface RecipeSelectorProps {
  filteredRecipes: Recipe[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  selectedMealType: string; // ID of the meal type being added to
  handleAddMeal: (recipe: Recipe, mealTypeId: string) => void; // Function to add the selected recipe
  mealTypeName?: string; // Optional name of the meal type for display
}

const RecipeSelector: React.FC<RecipeSelectorProps> = ({
  filteredRecipes,
  searchTerm,
  setSearchTerm,
  selectedMealType,
  handleAddMeal,
  mealTypeName,
}) => {
  return (
    <>
      <h3 className="text-lg font-semibold mb-4">Seleccionar receta{mealTypeName ? ` para: ${mealTypeName}` : ''}</h3>
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar recetas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md"
          autoFocus // Focus search input when selector opens
        />
      </div>
      <div className="space-y-3 max-h-[calc(90vh-200px)] overflow-y-auto"> {/* Adjust max height */}
        {filteredRecipes.length === 0 && searchTerm && (
          <p className="text-gray-500 text-center py-4">No se encontraron recetas que coincidan.</p>
        )}
        {filteredRecipes.length === 0 && !searchTerm && (
           <p className="text-gray-500 text-center py-4">Empieza a escribir para buscar recetas.</p>
        )}
        {filteredRecipes.map((recipe) => {
          // Determine base portions: use live_total_nutrition.porciones if available, else recipe.porciones, else 1
          const basePortions = recipe.live_total_nutrition?.porciones ?? recipe.porciones ?? 1;
          // Calculate nutrition per single base portion
          const nutritionPerBasePortion = {
            calories: Math.round((recipe.live_total_nutrition?.calories ?? 0) / basePortions),
            protein: Math.round((recipe.live_total_nutrition?.protein ?? 0) / basePortions),
            carbs: Math.round((recipe.live_total_nutrition?.carbs ?? 0) / basePortions),
            fat: Math.round((recipe.live_total_nutrition?.fat ?? 0) / basePortions),
          };

          return (
            <button
              key={recipe.id}
              onClick={() => handleAddMeal(recipe, selectedMealType)}
              className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex gap-4 items-center">
                <div className="w-20 h-20 flex-shrink-0"> {/* Slightly smaller image */}
                  <img
                    // Provide a default placeholder image URL
                    src={recipe.image_url || 'https://placehold.co/400x400/png?text=Receta'}
                    alt={recipe.name}
                    className="w-full h-full object-cover rounded-md bg-gray-100" // Added bg color for loading/missing images
                  />
                </div>
                <div className="flex-grow">
                  <h4 className="font-medium mb-1">{recipe.name}</h4>
                  <div className="text-sm text-gray-600 grid grid-cols-2 gap-x-4 gap-y-1">
                    {/* Display nutrition per single base portion */}
                    <div>Calorías: {nutritionPerBasePortion.calories} / porción</div>
                    <div>Proteínas: {nutritionPerBasePortion.protein}g</div>
                    <div>Carbs: {nutritionPerBasePortion.carbs}g</div>
                    <div>Grasas: {nutritionPerBasePortion.fat}g</div>
                  </div>
                   <p className="text-xs text-gray-500 mt-1">Receta base: {basePortions} porción(es)</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
};

export default RecipeSelector; // Ensure default export is used

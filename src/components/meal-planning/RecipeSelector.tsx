import React from 'react';
import { Search } from 'lucide-react';

interface Recipe {
  id: string;
  name: string;
  image_url: string;
  live_total_nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    porciones?: number;
  };
  porciones?: number;
}

interface RecipeSelectorProps {
  filteredRecipes: Recipe[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  selectedMealType: string;
  handleAddMeal: (recipe: Recipe, mealTypeId: string) => void;
  mealTypeName?: string;
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
        />
      </div>
      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
        {filteredRecipes.map((recipe) => {
          const porciones = recipe.live_total_nutrition?.porciones || recipe.porciones || 1;
          return (
            <button
              key={recipe.id}
              onClick={() => handleAddMeal(recipe, selectedMealType)}
              className="w-full p-3 text-left border rounded-lg hover:bg-gray-50"
            >
              <div className="flex gap-4">
                <div className="w-24 h-24 flex-shrink-0">
                  <img
                    src={recipe.image_url || 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?w=800'}
                    alt={recipe.name}
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
                <div className="flex-grow">
                  <h4 className="font-medium mb-2">{recipe.name}</h4>
                  <div className="text-sm text-gray-600 grid grid-cols-2 gap-2">
                    <div>Calorías: {Math.round((recipe.live_total_nutrition?.calories ?? 0) / porciones)} por porción</div>
                    <div>Proteínas: {Math.round((recipe.live_total_nutrition?.protein ?? 0) / porciones)}g</div>
                    <div>Carbohidratos: {Math.round((recipe.live_total_nutrition?.carbs ?? 0) / porciones)}g</div>
                    <div>Grasas: {Math.round((recipe.live_total_nutrition?.fat ?? 0) / porciones)}g</div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
};

export default RecipeSelector;

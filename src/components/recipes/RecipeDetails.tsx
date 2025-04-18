import React from 'react';
import { X, Tag } from 'lucide-react';
import type { RecipeWithIngredients } from '../../types';

interface RecipeDetailsProps {
  recipe: RecipeWithIngredients;
  onClose: () => void;
}

export function RecipeDetails({ recipe, onClose }: RecipeDetailsProps) {
  // TEMP: Depuración solo cuando cambia la receta
  React.useEffect(() => {

  }, [recipe]);

  // DEBUG: Ver el objeto recipe recibido
  console.log('DEBUG recipe en detalles:', recipe);
  // Porciones: preferir recipe.porciones, luego recipe.servings, si no existe ninguno mostrar 1
  const servings = recipe.porciones ?? recipe.servings ?? 1;

  // Cálculo de valores por porción
  const nutrition = recipe.total_nutrition || {};
  const nutritionPerServing = {
    calories: nutrition.calories ? nutrition.calories / servings : 0,
    protein: nutrition.protein ? nutrition.protein / servings : 0,
    carbs: nutrition.carbs ? nutrition.carbs / servings : 0,
    fat: nutrition.fat ? nutrition.fat / servings : 0,
    fiber: nutrition.fiber ? nutrition.fiber / servings : 0,
    sugar: nutrition.sugar ? nutrition.sugar / servings : 0,
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="relative">
          <img
            src={recipe.image_url || 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?w=800'}
            alt={recipe.name}
            className="w-full h-64 object-cover rounded-t-lg"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{recipe.name}</h1>
          
          {recipe.description && (
            <p className="text-gray-600 mb-4">{recipe.description}</p>
          )}

          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {recipe.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Información Nutricional</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-blue-700">Calorías</span>
                  <span className="font-medium">{Math.round(nutrition.calories || 0)} kcal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Proteínas</span>
                  <span className="font-medium">{Math.round(nutrition.protein || 0)}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Carbohidratos</span>
                  <span className="font-medium">{Math.round(nutrition.carbs || 0)}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Grasas</span>
                  <span className="font-medium">{Math.round(nutrition.fat || 0)}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Fibra</span>
                  <span className="font-medium">{Math.round(nutrition.fiber || 0)}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Azúcares</span>
                  <span className="font-medium">{Math.round(nutrition.sugar || 0)}g</span>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Valores por porción</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-green-700">Calorías</span>
                  <span className="font-medium">{Math.round(nutritionPerServing.calories)} kcal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Proteínas</span>
                  <span className="font-medium">{Math.round(nutritionPerServing.protein)}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Carbohidratos</span>
                  <span className="font-medium">{Math.round(nutritionPerServing.carbs)}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Grasas</span>
                  <span className="font-medium">{Math.round(nutritionPerServing.fat)}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Fibra</span>
                  <span className="font-medium">{Math.round(nutritionPerServing.fiber)}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Azúcares</span>
                  <span className="font-medium">{Math.round(nutritionPerServing.sugar)}g</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">* Calculado para {servings} porciones</div>
            </div>
          </div>

          <div className="mb-2">
            <div className="text-md text-gray-700 mb-2 font-medium">Rinde: {servings} porciones</div>
          </div>
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Ingredientes</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    <span>
                      {ingredient.name ? `${ingredient.quantity} ${ingredient.unit_name} ${ingredient.name}` : ''}
{ingredient.conversion_text && ingredient.conversion_text !== `${ingredient.quantity} ${ingredient.unit_name}` ? ` (${ingredient.conversion_text})` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Instrucciones</h3>
            <div className="space-y-4">
              {recipe.instructions.map((instruction, index) => (
                <div key={index} className="flex">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium mr-4">
                    {index + 1}
                  </div>
                  <p className="text-gray-700">{instruction}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-center mb-4">
          <button
            className="mt-6 mb-2 w-full max-w-xs py-2 px-4 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

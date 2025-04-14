import React from 'react';
import { ArrowLeft, Tag } from 'lucide-react';
import type { RecipeWithIngredients } from '../../types';

interface RecipeDetailsProps {
  recipe: RecipeWithIngredients;
  onClose: () => void;
}

export function RecipeDetails({ recipe, onClose }: RecipeDetailsProps) {
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
            className="absolute top-4 left-4 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
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
                  <span className="font-medium">{Math.round(recipe.total_nutrition.calories)} kcal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Proteínas</span>
                  <span className="font-medium">{Math.round(recipe.total_nutrition.protein)}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Carbohidratos</span>
                  <span className="font-medium">{Math.round(recipe.total_nutrition.carbs)}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Grasas</span>
                  <span className="font-medium">{Math.round(recipe.total_nutrition.fat)}g</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Ingredientes</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    <span>
                      {ingredient.conversion_text}
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
      </div>
    </div>
  );
}
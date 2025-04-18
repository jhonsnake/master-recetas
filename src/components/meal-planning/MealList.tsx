import React from 'react';
import { Info, Trash2 } from 'lucide-react';

interface Meal {
  id: string;
  recipe: any;
  porciones?: number;
  meal_type_id: string;
}

interface MealListProps {
  meals: Meal[];
  showIngredients: string | null;
  setShowIngredients: (id: string | null) => void;
  handleRemoveMeal: (mealTypeId: string, recipeId: string) => void;
}

const MealList: React.FC<MealListProps> = ({
  meals,
  showIngredients,
  setShowIngredients,
  handleRemoveMeal,
}) => {
  return (
    <>
      {meals.map((meal) => (
        <div key={meal.id + '-' + meal.recipe.id} className="mb-4 border rounded-lg p-4 bg-white shadow">
          <div className="flex items-center justify-between">
            <span className="ml-2 px-2 py-0.5 bg-blue-200 text-blue-900 rounded text-xs whitespace-nowrap">{meal.porciones === 1 || meal.porciones === undefined ? '1 porción' : `${meal.porciones} porciones`}</span>
            <button
              onClick={() => setShowIngredients(showIngredients === meal.recipe.id ? null : meal.recipe.id)}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Ver ingredientes"
            >
              <Info className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleRemoveMeal(meal.meal_type_id, meal.recipe.id)}
              className="p-1 text-red-400 hover:text-red-600"
              title="Eliminar comida"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-gray-500 grid grid-cols-2 gap-1 mt-1">
            <div>Calorías: {(() => {
              const total = meal.recipe.live_total_nutrition?.calories ?? 0;
              const porciones = meal.recipe.live_total_nutrition?.porciones || meal.recipe.porciones || 1;
              const selected = meal.porciones || 1;
              console.log('[MealList] Calorías calculation:', {
                mealName: meal.recipe.name,
                total,
                porciones,
                selected
              });
              const result = total === null || total === undefined ? 'Desconocido' : Math.round((total / porciones) * selected);
              console.log('[MealList] Calorías result:', result);
              return result;
            })()}</div>
            <div>Proteínas: {(() => {
              const total = meal.recipe.live_total_nutrition?.protein ?? 0;
              const porciones = meal.recipe.live_total_nutrition?.porciones || meal.recipe.porciones || 1;
              const selected = meal.porciones || 1;
              console.log('[MealList] Proteínas calculation:', {
                mealName: meal.recipe.name,
                total,
                porciones,
                selected
              });
              if (total === null || total === undefined) return 'Desconocido';
              return Math.round((total / porciones) * selected);
            })()}g</div>
            <div>Carbohidratos: {(() => {
              const total = meal.recipe.live_total_nutrition?.carbs ?? 0;
              const porciones = meal.recipe.live_total_nutrition?.porciones || meal.recipe.porciones || 1;
              const selected = meal.porciones || 1;
              console.log('[MealList] Carbs calculation:', {
                mealName: meal.recipe.name,
                total,
                porciones,
                selected
              });
              if (total === null || total === undefined) return 'Desconocido';
              return Math.round((total / porciones) * selected);
            })()}g</div>
            <div>Grasas: {(() => {
              const total = meal.recipe.live_total_nutrition?.fat ?? 0;
              const porciones = meal.recipe.live_total_nutrition?.porciones || meal.recipe.porciones || 1;
              const selected = meal.porciones || 1;
              console.log('[MealList] Grasas calculation:', {
                mealName: meal.recipe.name,
                total,
                porciones,
                selected
              });
              if (total === null || total === undefined) return 'Desconocido';
              return Math.round((total / porciones) * selected);
            })()}g</div>
          </div>
          {/* Aquí puedes renderizar los ingredientes si showIngredients === meal.recipe.id */}
          {showIngredients === meal.recipe.id && (
            <div className="mt-2 bg-gray-50 rounded p-2 text-sm">
              {/* Renderiza los ingredientes aquí */}
              {meal.recipe.ingredients?.map((ing: any) => (
                <div key={ing.id}>{ing.name} - {ing.quantity} {ing.unit_name}</div>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );
};

export default MealList;

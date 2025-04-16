// 💡 Solo cópialo y pégalo, está corregido y completo
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import RecipeSelector from './RecipeSelector';
import PortionModal from './PortionModal';
import MealList from './MealList';
import { X, Plus, Info, Trash2 } from 'lucide-react';

interface Recipe {
  id: string;
  name: string;
  image_url: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  porciones?: number;
  ingredients?: {
    id: string;
    name: string;
    quantity: number;
    unit_name: string;
    base_unit: string;
    conversion_factor: number;
    conversion_text: string;
  }[];
  live_total_nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    porciones?: number;
  };
}

interface MealType {
  id: string;
  name: string;
  order: number;
}

interface DayModalProps {
  date: Date;
  mealTypes: MealType[];
  dailyPlan?: any;
  onClose: () => void;
  onDataChanged?: () => void;
}

export function DayModal({ date, mealTypes, dailyPlan, onClose, onDataChanged }: DayModalProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);
  const [showIngredients, setShowIngredients] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [portionRecipe, setPortionRecipe] = useState<Recipe | null>(null);
  const [portionMealType, setPortionMealType] = useState<string | null>(null);
  const [portionCount, setPortionCount] = useState<number>(1);
  const [showPortionModal, setShowPortionModal] = useState<boolean>(false);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('recipe_with_live_nutrition')
        .select('*');
      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast.error('Error al cargar las recetas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMeal = (recipe: Recipe, mealTypeId: string) => {
    setPortionRecipe(recipe);
    setPortionMealType(mealTypeId);
    setPortionCount(recipe.live_total_nutrition?.porciones || recipe.porciones || 1);
    setShowPortionModal(true);
  };

  const confirmAddMeal = async () => {
    if (!portionRecipe || !portionMealType) return;
    try {
      const { error } = await supabase
        .from('meal_plans')
        .insert({
          date: format(date, 'yyyy-MM-dd'),
          meal_type_id: portionMealType,
          recipe_id: portionRecipe.id,
          porciones: portionCount
        });
      if (error) throw error;
      toast.success('Comida agregada al plan');
      setShowPortionModal(false);
      setPortionRecipe(null);
      setPortionMealType(null);
      setPortionCount(1);
      if (onDataChanged) onDataChanged();
    } catch (error) {
      console.error('Error adding meal:', error);
      toast.error('Error al agregar la comida');
    }
  };

  const handleRemoveMeal = async (mealTypeId: string, recipeId: string) => {
    try {
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('date', format(date, 'yyyy-MM-dd'))
        .eq('meal_type_id', mealTypeId)
        .eq('recipe_id', recipeId);
      if (error) throw error;
      toast.success('Comida eliminada del plan');
      if (onDataChanged) onDataChanged();
    } catch (error) {
      console.error('Error removing meal:', error);
      toast.error('Error al eliminar la comida');
    }
  };

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMealsByType = (mealType: MealType) => {
    return dailyPlan?.meals.filter((m: any) => m.meal_type === mealType.name) || [];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {format(date, "EEEE d 'de' MMMM", { locale: es })}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Grid para categorías y selector uno al lado del otro */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Bloque de categorías */}
          <div className="space-y-8">
            {mealTypes.map((mealType) => {
              const meals = getMealsByType(mealType);
              return (
                <div key={mealType.id} className="bg-gray-50 rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-lg text-gray-800">{mealType.name}</h4>
                    <button
                      onClick={() => setSelectedMealType(mealType.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium transition"
                    >
                      <Plus className="w-4 h-4" /> Agregar
                    </button>
                  </div>
                  {meals.length === 0 && (
                    <div className="text-gray-400 text-sm italic">Sin comidas agendadas</div>
                  )}
                  <div className="flex flex-col gap-4 mt-2">
                    {meals.map((meal: any) => (
                      <div key={meal.id + '-' + meal.recipe.id} className="bg-white rounded-lg shadow p-4 flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={meal.recipe.image_url || 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?w=800'}
                            alt={meal.recipe.name}
                            className="w-20 h-20 object-cover rounded-md border"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800">{meal.recipe.name}</span>
                              <span className="ml-2 px-2 py-0.5 bg-blue-200 text-blue-900 rounded text-xs whitespace-nowrap">{meal.porciones === 1 || meal.porciones === undefined ? '1 porción' : `${meal.porciones} porciones`}</span>
                            </div>
                            <div className="text-xs text-gray-500 grid grid-cols-2 gap-1 mt-1">
                              <div>Calorías: {(() => {
                                const total = meal.recipe.live_total_nutrition?.calories ?? 0;
                                const porciones = meal.recipe.live_total_nutrition?.porciones || meal.recipe.porciones || 1;
                                const selected = meal.porciones || 1;
                                return Math.round((total / porciones) * selected);
                              })()}</div>
                              <div>Proteínas: {(() => {
                                const total = meal.recipe.live_total_nutrition?.protein ?? 0;
                                const porciones = meal.recipe.live_total_nutrition?.porciones || meal.recipe.porciones || 1;
                                const selected = meal.porciones || 1;
                                return Math.round((total / porciones) * selected);
                              })()}g</div>
                              <div>Carbohidratos: {(() => {
                                const total = meal.recipe.live_total_nutrition?.carbs ?? 0;
                                const porciones = meal.recipe.live_total_nutrition?.porciones || meal.recipe.porciones || 1;
                                const selected = meal.porciones || 1;
                                return Math.round((total / porciones) * selected);
                              })()}g</div>
                              <div>Grasas: {(() => {
                                const total = meal.recipe.live_total_nutrition?.fat ?? 0;
                                const porciones = meal.recipe.live_total_nutrition?.porciones || meal.recipe.porciones || 1;
                                const selected = meal.porciones || 1;
                                return Math.round((total / porciones) * selected);
                              })()}g</div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-2">
                            <button
                              onClick={() => setShowIngredients(showIngredients === meal.recipe.id ? null : meal.recipe.id)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Ver ingredientes"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveMeal(mealType.id, meal.recipe.id)}
                              className="p-1 text-red-600 hover:text-red-700"
                              title="Eliminar comida"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {showIngredients === meal.recipe.id && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Ingredientes:</h5>
                            <ul className="space-y-1">
                              {recipes.find(r => r.id === meal.recipe.id)?.ingredients?.map((ingredient, idx) => (
                                <li key={idx} className="text-sm text-gray-600">
                                  • {ingredient.name}: {ingredient.conversion_text}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bloque de selección de recetas */}
          <div>
            {selectedMealType && (
              <RecipeSelector
                filteredRecipes={filteredRecipes}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedMealType={selectedMealType}
                handleAddMeal={handleAddMeal}
                mealTypeName={mealTypes.find(mt => mt.id === selectedMealType)?.name || ''}
              />
            )}
          </div>
        </div>


        {showPortionModal && portionRecipe && (
          <PortionModal
            portionRecipe={portionRecipe}
            portionCount={portionCount}
            setPortionCount={setPortionCount}
            onCancel={() => setShowPortionModal(false)}
            onConfirm={confirmAddMeal}
          />
        )}


        <div className="flex justify-end mt-8">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded bg-blue-600 text-white font-semibold text-lg shadow hover:bg-blue-700 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

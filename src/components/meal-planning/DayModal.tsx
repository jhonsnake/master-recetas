import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { X, Plus, Search, Trash2, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface Recipe {
  id: string;
  name: string;
  image_url: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
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
    setPortionCount(recipe.live_total_nutrition?.porciones || 1);
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
      // No cerrar el modal principal automáticamente, solo el de porciones.
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
      onClose();
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

        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Comidas del día</h3>
            </div>

            <div className="space-y-4">
              {mealTypes.map((mealType) => {
                const meals = getMealsByType(mealType);
                return (
                  <div key={mealType.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{mealType.name}</h4>
                      <button
                        onClick={() => setSelectedMealType(mealType.id)}
                        className="text-blue-600 hover:text-blue-700 flex items-center text-sm"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Agregar
                      </button>
                    </div>

                    {meals.length > 0 && (
                      <div className="space-y-3">
                        {meals.map((meal: any, idx: number) => (
                          <div key={idx} className="bg-gray-100 rounded-lg p-3 flex items-center gap-3">
                            <div className="flex-1">
                              <div className="font-medium text-gray-800 flex items-center gap-2">
                                {meal.recipe.name}
                                <span className="ml-2 px-2 py-0.5 bg-blue-200 text-blue-900 rounded text-xs">
                                  {meal.porciones || 1} porciones
                                </span>
                                <button
                                  className="ml-2 text-gray-400 hover:text-blue-600"
                                  title="Ver ingredientes"
                                  onClick={() => setShowIngredients(meal.recipe.id)}
                                >
                                  <Info className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="flex gap-3 mt-2">
                                <div className="w-20 h-20 flex-shrink-0">
                                  <img
                                    src={meal.recipe.image_url || 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?w=800'}
                                    alt={meal.recipe.name}
                                    className="w-full h-full object-cover rounded-md"
                                  />
                                </div>
                                <div className="flex-grow">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="font-medium">{meal.recipe.name}</div>
                                      <div className="text-sm text-gray-600 grid grid-cols-2 gap-1 mt-1">
                                        <div>Calorías: {Math.round(meal.recipe.live_total_nutrition?.calories ?? 0)}</div>
                                        <div>Proteínas: {Math.round(meal.recipe.live_total_nutrition?.protein ?? 0)}g</div>
                                        <div>Carbohidratos: {Math.round(meal.recipe.live_total_nutrition?.carbs ?? 0)}g</div>
                                        <div>Grasas: {Math.round(meal.recipe.live_total_nutrition?.fat ?? 0)}g</div>
                                      </div>
                                    </div>
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => setShowIngredients(showIngredients === meal.recipe.id ? null : meal.recipe.id)}
                                        className="p-1 text-gray-400 hover:text-gray-600"
                                      >
                                        <Info className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleRemoveMeal(mealType.id, meal.recipe.id)}
                                        className="p-1 text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                  {showIngredients === meal.recipe.id && (
                                    <div className="mt-3 pt-3 border-t border-gray-100">
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
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {selectedMealType && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Seleccionar Receta</h3>
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

            <>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {filteredRecipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => handleAddMeal(recipe, selectedMealType)}
                    className="w-full p-3 text-left border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex gap-4">
                      <div className="w-24 h-24 flex-shrink-0">
                        <div className="w-24 h-24 flex-shrink-0">
                          <img
                            src={recipe.image_url || 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?w=800'}
                            alt={recipe.name}
                            className="w-full h-full object-cover rounded-md"
                          />
                        </div>
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-medium mb-2">{recipe.name}</h4>
                        <div className="text-sm text-gray-600 grid grid-cols-2 gap-2">
                          <div>Calorías: {(() => {
                            const cal = recipe.live_total_nutrition?.calories ?? 0;
                            const porciones = recipe.live_total_nutrition?.porciones || recipe.porciones || 1;
                            return Math.round(cal / porciones);
                          })()} <span className="text-xs text-gray-500">por porción</span></div>
                          <div>Proteínas: {(() => {
                            const prot = recipe.live_total_nutrition?.protein ?? 0;
                            const porciones = recipe.live_total_nutrition?.porciones || recipe.porciones || 1;
                            return Math.round(prot / porciones);
                          })()}g <span className="text-xs text-gray-500">por porción</span></div>
                          <div>Carbohidratos: {(() => {
                            const carbs = recipe.live_total_nutrition?.carbs ?? 0;
                            const porciones = recipe.live_total_nutrition?.porciones || recipe.porciones || 1;
                            return Math.round(carbs / porciones);
                          })()}g <span className="text-xs text-gray-500">por porción</span></div>
                          <div>Grasas: {(() => {
                            const fat = recipe.live_total_nutrition?.fat ?? 0;
                            const porciones = recipe.live_total_nutrition?.porciones || recipe.porciones || 1;
                            return Math.round(fat / porciones);
                          })()}g <span className="text-xs text-gray-500">por porción</span></div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {showPortionModal && portionRecipe && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm">
              <h3 className="text-lg font-semibold mb-4">¿Cuántas porciones quieres agendar?</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Porciones</label>
                <input
                  type="number"
                  min={1}
                  value={portionCount}
                  onChange={e => setPortionCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                  onClick={() => setShowPortionModal(false)}
                >Cancelar</button>
                <button
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  onClick={confirmAddMeal}
                >Agregar</button>
              </div>
            </div>
            <input
              type="text"
              placeholder="Buscar recetas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md"
            />
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {filteredRecipes.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => handleAddMeal(recipe, selectedMealType)}
                className="w-full p-3 text-left border rounded-lg hover:bg-gray-50"
              >
                <div className="flex gap-4">
                  <div className="w-24 h-24 flex-shrink-0">
                    <div className="w-24 h-24 flex-shrink-0">
                      <img
                        src={recipe.image_url || 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?w=800'}
                        alt={recipe.name}
                        className="w-full h-full object-cover rounded-md"
                      />
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-medium mb-2">{recipe.name}</h4>
                    <div className="text-sm text-gray-600 grid grid-cols-2 gap-2">
                      <div>Calorías: {(() => {
                        const cal = recipe.live_total_nutrition?.calories ?? 0;
                        const porciones = recipe.live_total_nutrition?.porciones || recipe.porciones || 1;
                        return Math.round(cal / porciones);
                      })()} <span className="text-xs text-gray-500">por porción</span></div>
                      <div>Proteínas: {(() => {
                        const prot = recipe.live_total_nutrition?.protein ?? 0;
                        const porciones = recipe.live_total_nutrition?.porciones || recipe.porciones || 1;
                        return Math.round(prot / porciones);
                      })()}g <span className="text-xs text-gray-500">por porción</span></div>
                      <div>Carbohidratos: {(() => {
                        const carbs = recipe.live_total_nutrition?.carbs ?? 0;
                        const porciones = recipe.live_total_nutrition?.porciones || recipe.porciones || 1;
                        return Math.round(carbs / porciones);
                      })()}g <span className="text-xs text-gray-500">por porción</span></div>
                      <div>Grasas: {(() => {
                        const fat = recipe.live_total_nutrition?.fat ?? 0;
                        const porciones = recipe.live_total_nutrition?.porciones || recipe.porciones || 1;
                        return Math.round(fat / porciones);
                      })()}g <span className="text-xs text-gray-500">por porción</span></div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>

    {showPortionModal && portionRecipe && (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-sm">
          <h3 className="text-lg font-semibold mb-4">¿Cuántas porciones quieres agendar?</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Porciones</label>
            <input
              type="number"
              min={1}
              value={portionCount}
              onChange={e => setPortionCount(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              onClick={() => setShowPortionModal(false)}
            >Cancelar</button>
            <button
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              onClick={confirmAddMeal}
            >Agregar</button>
          </div>
        </div>
      </div>
    )}
    {/* Botón de cierre destacado */}
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

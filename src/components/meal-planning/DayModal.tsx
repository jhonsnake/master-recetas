import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, Info, Save, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import RecipeSelector from './RecipeSelector'; // Corrected: Use default import
import PortionModal from './PortionModal';
import { RecipeDetails } from '../recipes/RecipeDetails';
import type { RecipeWithIngredients } from '../../types';
import type { MealType, Recipe, DailyPlan, Meal } from '../../types';

interface DayModalProps {
  date: Date;
  mealTypes: MealType[];
  dailyPlan: DailyPlan | undefined; // Can be undefined if no plan exists yet
  onClose: () => void;
  onDataChanged: () => void; // Callback to notify parent about changes
}

// Define a type for the meal being edited for portions
interface MealBeingEdited {
  mealTypeId: string;
  recipeId: string;
  currentPortions: number;
  recipeName: string;
  recipeBasePortions: number;
}


export function DayModal({ date, mealTypes, dailyPlan, onClose, onDataChanged }: DayModalProps) {
  const [mealsByTypeId, setMealsByTypeId] = useState<Record<string, Meal[]>>({});
  const [showRecipeSelector, setShowRecipeSelector] = useState<string | null>(null); // meal_type_id
  const [showIngredients, setShowIngredients] = useState<string | null>(null); // recipe.id
const [selectedRecipeDetails, setSelectedRecipeDetails] = useState<RecipeWithIngredients | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPortionModal, setShowPortionModal] = useState(false);
  const [mealToEditPortions, setMealToEditPortions] = useState<MealBeingEdited | null>(null);
  const [currentPortionCount, setCurrentPortionCount] = useState(1); // State for PortionModal input
  const [searchTerm, setSearchTerm] = useState(''); // State for RecipeSelector search
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]); // State to hold all fetched recipes


  const formattedDate = format(date, 'yyyy-MM-dd');
  const displayDate = format(date, 'EEEE, d \'de\' MMMM', { locale: es });

  // Fetch all recipes once when the modal mounts
  useEffect(() => {
    const fetchRecipes = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('recipe_with_ingredients') // Usa la vista
        .select('id, name, description, image_url, instructions, user_id, created_at, ingredients, total_nutrition')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching recipes:', error);
        toast.error('Error al cargar recetas.');
      } else {
        // Map data to Recipe type, ensuring live_total_nutrition is included
        const recipesData = data as RecipeWithIngredients[];
        setAllRecipes(recipesData);

        // Debug: Print nutrition for each recipe

        recipesData.forEach(r => {

        });
      }
      setIsLoading(false);
    };
    fetchRecipes();
  }, []); // Empty dependency array ensures this runs only once


  // Initialize state from dailyPlan prop
  useEffect(() => {
    const initialMeals: Record<string, Meal[]> = {};
    mealTypes.forEach(mt => initialMeals[mt.id] = []);

    if (dailyPlan?.meals) {
      console.log('DEBUG dailyPlan.meals:', dailyPlan.meals);
      dailyPlan.meals.forEach(meal => {
        // Asignar meal_type_id usando meal_type_name si no existe
        let mealTypeId = meal.meal_type_id;
        if (!mealTypeId && meal.meal_type_name) {
          const foundType = mealTypes.find(mt => mt.name === meal.meal_type_name);
          mealTypeId = foundType ? foundType.id : undefined;
        }
        if (!mealTypeId) return; // Si no hay id válido, no pushear
        if (!initialMeals[mealTypeId]) {
          initialMeals[mealTypeId] = [];
        }
        if (meal.recipe) {
          initialMeals[mealTypeId].push({ ...meal, meal_type_id: mealTypeId });
        } else {
          initialMeals[mealTypeId].push({
            ...meal,
            meal_type_id: mealTypeId,
            porciones: meal.porciones ?? 1,
            recipe: {
              id: meal.recipe_id,
              name: meal.recipe_name,
              image_url: meal.image_url ?? null,
              porciones: meal.porciones ?? 1,
              total_nutrition: meal.live_total_nutrition ?? meal.total_nutrition ?? undefined,
            }
          });
        }
      });
    }
    setMealsByTypeId(initialMeals);
    // DEBUG: mostrar el contenido de mealsByTypeId después de inicializarlo
    setTimeout(() => {
      // @ts-ignore
      window._debugMealsByTypeId = initialMeals;
      console.log('DEBUG mealsByTypeId:', initialMeals);
    }, 100);

  }, [dailyPlan, mealTypes]); // Rerun if dailyPlan or mealTypes change


  const handleAddRecipe = (recipe: Recipe, mealTypeId: string) => {

    setMealsByTypeId(prev => {
      const currentMeals = prev[mealTypeId] || [];
      // Check if recipe already exists for this meal type
      if (currentMeals.some(m => m.recipe.id === recipe.id)) {
        toast.error(`${recipe.name} ya está añadido a este tipo de comida.`);
        return prev;
      }
      const newMeal: Meal = {
        meal_type_id: mealTypeId,
        porciones: 1, // Default to 1 portion when adding
        recipe: recipe,
      };
      return {
        ...prev,
        [mealTypeId]: [...currentMeals, newMeal]
      };
    });
    setShowRecipeSelector(null); // Close selector
    setSearchTerm(''); // Reset search term
  };

  const handleRemoveMeal = (mealTypeId: string, recipeId: string) => {

    setMealsByTypeId(prev => ({
      ...prev,
      [mealTypeId]: (prev[mealTypeId] || []).filter(meal => meal.recipe.id !== recipeId)
    }));
  };

  const openPortionEditor = (mealTypeId: string, recipeId: string) => {
    const meal = mealsByTypeId[mealTypeId]?.find(m => m.recipe.id === recipeId);
    if (meal && meal.recipe) { // Ensure meal and meal.recipe exist

      const currentPortions = meal.porciones ?? 1;
      // Use live_total_nutrition.porciones if available, otherwise recipe.porciones, default to 1
      const basePortions = meal.recipe.live_total_nutrition?.porciones ?? meal.recipe.porciones ?? 1;
      setMealToEditPortions({
        mealTypeId: mealTypeId,
        recipeId: recipeId,
        currentPortions: currentPortions,
        recipeName: meal.recipe.name,
        recipeBasePortions: basePortions // Pass correct base portions
      });
      setCurrentPortionCount(currentPortions); // Initialize modal input value
      setShowPortionModal(true);
    } else {
       console.error(`Could not find meal or meal recipe with recipeId ${recipeId} in mealTypeId ${mealTypeId} to edit portions.`);
    }
  };


 const handleConfirmSavePortions = () => {
    if (!mealToEditPortions) return;

    setMealsByTypeId(prev => {
      const updatedMeals = (prev[mealToEditPortions.mealTypeId] || []).map(meal =>
        meal.recipe.id === mealToEditPortions.recipeId ? { ...meal, porciones: currentPortionCount } : meal
      );
      return { ...prev, [mealToEditPortions.mealTypeId]: updatedMeals };
    });
    setShowPortionModal(false); // Close modal after saving
    setMealToEditPortions(null);
  };

  const handleCancelPortionEdit = () => {
    setShowPortionModal(false);
    setMealToEditPortions(null);
  }


  const handleSaveChanges = async () => {
    setIsSaving(true);



    // Flatten the meals from the state
    const mealsToSave: { meal_type_id: string; recipe_id: string; porciones: number }[] = [];
    Object.entries(mealsByTypeId).forEach(([mealTypeId, meals]) => {
      meals.forEach(meal => {
        // Ensure meal.recipe exists before trying to access its id
        if (meal.recipe) {
          mealsToSave.push({
            meal_type_id: mealTypeId,
            recipe_id: meal.recipe.id,
            porciones: meal.porciones ?? 1 // Ensure porciones is always a number
          });
        } else {
          console.warn(`Skipping meal in type ${mealTypeId} because recipe data is missing.`);
        }
      });
    });




    try {
      // 1. Delete existing meal plan entries for this date

      const { error: deleteError } = await supabase
        .from('meal_plans')
        .delete()
        .eq('date', formattedDate);

      if (deleteError) {
        console.error("Error deleting existing meal plans:", deleteError);
        throw new Error(`Error deleting existing plans: ${deleteError.message}`);
      }



      // 2. Insert new meal plan entries if there are any
      if (mealsToSave.length > 0) {

        const recordsToInsert = mealsToSave.map(meal => ({
          date: formattedDate,
          meal_type_id: meal.meal_type_id,
          recipe_id: meal.recipe_id,
          porciones: meal.porciones
        }));




        const { error: insertError } = await supabase
          .from('meal_plans')
          .insert(recordsToInsert);

        if (insertError) {
          console.error("Error inserting new meal plans:", insertError);
          // Attempt to rollback or notify user? For now, just throw.
          throw new Error(`Error inserting new plans: ${insertError.message}`);
        }

      } else {

      }


      toast.success('Plan del día guardado con éxito!');
      onDataChanged(); // Notify parent that data has changed
      onClose(); // Close modal on success
    } catch (error: any) {
      console.error('Error saving meal plan:', error);
      toast.error(`Error al guardar: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsSaving(false);
    }
  };


  // Helper to calculate nutrition per portion based on LIVE or fallback nutrition data
  const calculateLiveNutritionPerPortion = (recipe: Recipe | undefined, plannedPortions: number) => {
    // Accept either live_total_nutrition or total_nutrition
    const nutrition = recipe?.live_total_nutrition || recipe?.total_nutrition;
    if (!nutrition) return { calories: 0, protein: 0, carbs: 0, fat: 0 };

    // Use the porciones from the nutrition object if available, otherwise default to 1
    const basePortions = nutrition.porciones ?? 1;
    const factor = basePortions > 0 ? (plannedPortions / basePortions) : 0;

    return {
      calories: Math.round((Number(nutrition.calories) || 0) * factor),
      protein: Math.round((Number(nutrition.protein) || 0) * factor),
      carbs: Math.round((Number(nutrition.carbs) || 0) * factor),
      fat: Math.round((Number(nutrition.fat) || 0) * factor),
    };
  };

  // Filter recipes based on search term and exclude already added ones for the selected meal type
  const getFilteredRecipes = (mealTypeId: string | null) => {
    if (!mealTypeId) return [];
    const existingRecipeIds = mealsByTypeId[mealTypeId]?.map(m => m.recipe.id) || [];
    return allRecipes.filter(recipe =>
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !existingRecipeIds.includes(recipe.id)
    );
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">{displayDate}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 flex-grow overflow-y-auto">
          {isLoading && !showRecipeSelector ? ( // Show loading only if not showing recipe selector
            <p>Cargando...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mealTypes.map(mealType => (
                <div key={mealType.id} className="bg-gray-50 rounded-lg p-4 border">
                  <h3 className="font-semibold text-gray-700 mb-3">{mealType.name}</h3>
                  <div className="space-y-3 mb-3 min-h-[60px]">
                    {(mealsByTypeId[mealType.id] || []).map((meal) => {
                       if (!meal.recipe) return null; // Skip rendering if recipe data is missing

                       // Debug: log the meal.recipe object before calculating nutrition

                       // Calculate nutrition for the planned portions using live data
                       const portionNutrition = calculateLiveNutritionPerPortion(meal.recipe, meal.porciones ?? 1);
                       // Determine base portions for display (live preferred, fallback to recipe, then 1)
                       const displayBasePortions = meal.recipe.live_total_nutrition?.porciones ?? meal.recipe.porciones ?? 1;

                       // Debug logs for nutrition calculation
                       return (
                        <div key={meal.recipe.id} className="bg-white border rounded-md p-3 shadow-sm">
                          <div className="flex justify-between items-start">
                            <span className="font-medium text-sm text-gray-900 flex-1 mr-2">{meal.recipe.name}</span>
                            <div className="flex items-center space-x-1 flex-shrink-0">
                               <button
                                onClick={() => openPortionEditor(mealType.id, meal.recipe.id)}
                                className="p-1 text-blue-500 hover:text-blue-700"
                                title={`Editar porciones (${meal.porciones ?? 1})`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
    // Buscar el objeto completo en allRecipes si existe
    const found = allRecipes.find(r => r.id === meal.recipe.id);
    setSelectedRecipeDetails(found || meal.recipe);
  }}
                                className="p-1 text-gray-400 hover:text-gray-600"
                                title="Ver detalles de la receta"
                              >
                                <Info className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRemoveMeal(mealType.id, meal.recipe.id)}
                                className="p-1 text-red-400 hover:text-red-600"
                                title="Eliminar comida"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                           {/* Display calculated nutrition per portion */}
                           <div className="text-xs text-gray-500 mt-1">
                             {meal.porciones ?? 1} porción(es): {portionNutrition.calories}kcal, {portionNutrition.protein}g P, {portionNutrition.carbs}g C, {portionNutrition.fat}g F
                           </div>

                          {showIngredients === meal.recipe.id && (
                            <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-gray-700 border border-blue-100">
                              <p className="font-medium mb-1">Ingredientes ({meal.porciones ?? 1} porción/es):</p>
                              {meal.recipe.ingredients && meal.recipe.ingredients.length > 0 ? (
                                <ul className="list-disc list-inside space-y-0.5">
                                  {(meal.recipe.ingredients as any[]).map((ing: any, index: number) => {
                                     // Adjust quantity based on planned portions vs recipe base portions
                                     const baseRecipePortions = displayBasePortions; // Use the determined base portions
                                     const plannedPortions = meal.porciones ?? 1;
                                     const quantityFactor = baseRecipePortions > 0 ? plannedPortions / baseRecipePortions : 0;
                                     const adjustedQuantity = (ing.quantity || 0) * quantityFactor;
                                     // Simple rounding for display
                                     const displayQuantity = adjustedQuantity % 1 === 0 ? adjustedQuantity : adjustedQuantity.toFixed(1);

                                     return (
                                        <li key={`${ing.id}-${index}`}>
                                          {ing.name}: {displayQuantity} {ing.unit_name} {ing.conversion_text ? `(${ing.conversion_text})` : ''}
                                        </li>
                                     );
                                  })}
                                </ul>
                              ) : (
                                <p>No hay ingredientes detallados.</p>
                              )}
                               <p className="font-medium mt-2 mb-1">Nutrición Total (Receta Base: {displayBasePortions} porción/es):</p>
                               <p>Cal: {meal.recipe.live_total_nutrition?.calories ?? 0}, Prot: {meal.recipe.live_total_nutrition?.protein ?? 0}g, Carb: {meal.recipe.live_total_nutrition?.carbs ?? 0}g, Grasa: {meal.recipe.live_total_nutrition?.fat ?? 0}g</p>
                            </div>
                          )}
                        </div>
                       );
                    })}
                  </div>
                  <button
                    onClick={() => { setSearchTerm(''); setShowRecipeSelector(mealType.id); }} // Reset search on open
                    className="w-full flex items-center justify-center px-3 py-1.5 border border-dashed border-gray-400 text-gray-600 rounded-md hover:bg-gray-100 hover:border-gray-500 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Añadir Receta
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center p-4 border-t space-x-3">
           {/* Conditionally render Cancel or Close based on whether RecipeSelector is open */}
           {showRecipeSelector ? (
             <button
               onClick={() => { setShowRecipeSelector(null); setSearchTerm(''); }} // Close selector and reset search
               className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
             >
               Cerrar Selección
             </button>
           ) : (
             <button
               onClick={onClose}
               className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
               disabled={isSaving}
             >
               Cancelar
             </button>
           )}
          {/* Hide Save Changes button when RecipeSelector is open */}
          {!showRecipeSelector && (
            <button
              onClick={handleSaveChanges}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center text-sm disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Recipe Selector Overlay/Modal */}
      {showRecipeSelector && (
         <div className="absolute inset-0 bg-white z-60 flex flex-col"> {/* Use absolute positioning within the modal */}
           <div className="p-4 sm:p-6 flex-grow overflow-y-auto">
             <RecipeSelector
               filteredRecipes={getFilteredRecipes(showRecipeSelector)}
               searchTerm={searchTerm}
               setSearchTerm={setSearchTerm}
               selectedMealType={showRecipeSelector}
               handleAddMeal={handleAddRecipe}
               mealTypeName={mealTypes.find(mt => mt.id === showRecipeSelector)?.name}
             />
           </div>
           <div className="flex justify-end p-4 border-t">
              <button
                onClick={() => { setShowRecipeSelector(null); setSearchTerm(''); }} // Close selector and reset search
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
              >
                Cerrar Selección
              </button>
           </div>
         </div>
      )}


       {/* Portion Editor Modal */}
      {showPortionModal && mealToEditPortions && (
        <PortionModal
          portionRecipe={mealToEditPortions} // Pass the whole object or specific props as needed
          portionCount={currentPortionCount}
          setPortionCount={setCurrentPortionCount}
          onCancel={handleCancelPortionEdit}
          onConfirm={handleConfirmSavePortions}
        />
      )}
    {/* Modal de detalles de receta */}
    {selectedRecipeDetails && (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-lg relative">
          <button
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            onClick={() => setSelectedRecipeDetails(null)}
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
          <RecipeDetails recipe={selectedRecipeDetails} onClose={() => setSelectedRecipeDetails(null)} />
        </div>
      </div>
    )}
  </div>
  );
}

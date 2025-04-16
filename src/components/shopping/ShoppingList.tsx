import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Info, Save, Check, Calendar, Plus, Trash2, Edit2, Copy, Tag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface Ingredient {
  id: string;
  name: string;
  base_unit: string;
  base_quantity: number;
  image_url: string | null;
  tags: string[];
  unit_equivalences?: {
    unit_name: string;
    conversion_factor: number;
  }[];
}

interface Recipe {
  id: string;
  name: string;
  date: string;
  meal_type: string;
}

interface IngredientSummary {
  ingredient: Ingredient;
  totalQuantity: number;
  customQuantity?: number;
  customUnit?: string;
  recipes: Recipe[];
  purchased?: boolean;
}

interface SavedList {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  original_list_id?: string;
}

const SUGGESTED_TAGS = [
  'Verdura',
  'Fruta',
  'Carne',
  'Pescado',
  'Lácteo',
  'Cereal',
  'Legumbre',
  'Fruto seco',
  'Condimento',
  'Aceite',
  'Bebida'
];

export function ShoppingList() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [ingredients, setIngredients] = useState<IngredientSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRecipeInfo, setShowRecipeInfo] = useState<string | null>(null);
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);
  const [selectedList, setSelectedList] = useState<SavedList | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 6)
  });
  const [listName, setListName] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Limpiar selectedTags si desaparecen de la lista dinámica
  useEffect(() => {
    const ingredientTags = ingredients.flatMap(item => item.ingredient.tags || []);
    const allTags = Array.from(new Set([...SUGGESTED_TAGS, ...ingredientTags]));
    setSelectedTags(prev => prev.filter(tag => allTags.includes(tag)));
    // eslint-disable-next-line
  }, [ingredients]);
  const [groupByTags, setGroupByTags] = useState(false);

  useEffect(() => {
    fetchSavedLists();
  }, []);

  useEffect(() => {
    if (selectedList) {
      fetchSavedListItems(selectedList.id);
    } else {
      fetchWeeklyIngredients();
    }
  }, [selectedDate, selectedList]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const getFilteredAndGroupedIngredients = () => {
    let filtered = ingredients;

    if (selectedTags.length > 0) {
      filtered = ingredients.filter(item =>
        selectedTags.some(tag => item.ingredient.tags?.includes(tag))
      );
    }

    if (!groupByTags) {
      return { Todos: filtered };
    }

    return filtered.reduce((groups: { [key: string]: IngredientSummary[] }, item) => {
      const itemTags = item.ingredient.tags || [];
      if (itemTags.length === 0) {
        groups['Sin categoría'] = groups['Sin categoría'] || [];
        groups['Sin categoría'].push(item);
      } else {
        itemTags.forEach(tag => {
          groups[tag] = groups[tag] || [];
          groups[tag].push(item);
        });
      }
      return groups;
    }, {});
  };

  const fetchSavedLists = async () => {
    try {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedLists(data || []);
    } catch (error) {
      console.error('Error fetching saved lists:', error);
      toast.error('Error al cargar las listas guardadas');
    }
  };

  const fetchSavedListItems = async (listId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('shopping_list_items')
        .select(`
          quantity,
          custom_quantity,
          custom_unit,
          purchased,
          ingredients (
            id,
            name,
            base_unit,
            base_quantity,
            image_url,
            tags,
            unit_equivalences (
              unit_name,
              conversion_factor
            )
          )
        `)
        .eq('shopping_list_id', listId);

      if (error) throw error;

      const processedIngredients = data.map(item => ({
        ingredient: item.ingredients,
        totalQuantity: item.quantity,
        customQuantity: item.custom_quantity,
        customUnit: item.custom_unit,
        recipes: [],
        purchased: item.purchased
      }));

      setIngredients(processedIngredients);
    } catch (error) {
      console.error('Error fetching list items:', error);
      toast.error('Error al cargar los items de la lista');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeeklyIngredients = async () => {
    setIsLoading(true);
    try {
      const dates = Array.from({ length: 7 }, (_, i) => 
        format(addDays(dateRange.start, i), 'yyyy-MM-dd')
      );

      const { data: mealPlans, error: mealPlansError } = await supabase
        .from('meal_plans')
        .select(`
          recipe_id,
          date,
          meal_types (
            name
          ),
          recipes (
            id,
            name,
            recipe_ingredients (
              quantity,
              unit_name,
              ingredients (
                id,
                name,
                base_unit,
                base_quantity,
                image_url,
                tags,
                unit_equivalences (
                  unit_name,
                  conversion_factor
                )
              )
            )
          )
        `)
        .in('date', dates);

      if (mealPlansError) throw mealPlansError;

      const ingredientMap = new Map<string, IngredientSummary>();

      mealPlans?.forEach(mealPlan => {
        const recipe = mealPlan.recipes;
        if (!recipe) return;

        recipe.recipe_ingredients?.forEach(ri => {
          const ingredient = ri.ingredients;
          if (!ingredient) return;

          // Multiplica la cantidad base por el número de porciones de la receta en el plan
          let baseQuantity = ri.quantity;
          const recipePortions = recipe.porciones || 1;
          baseQuantity = baseQuantity * recipePortions;
          if (ri.unit_name !== ingredient.base_unit) {
            const conversion = ingredient.unit_equivalences?.find(
              ue => ue.unit_name === ri.unit_name
            );
            if (conversion) {
              baseQuantity *= conversion.conversion_factor;
            }
          }

          const existingSummary = ingredientMap.get(ingredient.id);
          if (existingSummary) {
            existingSummary.totalQuantity += baseQuantity;
            existingSummary.recipes.push({
              id: recipe.id,
              name: recipe.name,
              date: mealPlan.date,
              meal_type: mealPlan.meal_types?.name || ''
            });
          } else {
            ingredientMap.set(ingredient.id, {
              ingredient,
              totalQuantity: baseQuantity,
              recipes: [{
                id: recipe.id,
                name: recipe.name,
                date: mealPlan.date,
                meal_type: mealPlan.meal_types?.name || ''
              }]
            });
          }
        });
      });

      setIngredients(Array.from(ingredientMap.values()));
    } catch (error) {
      console.error('Error fetching weekly ingredients:', error);
      toast.error('Error al cargar la lista de compras');
    } finally {
      setIsLoading(false);
    }
  };

  const getEquivalences = (item: IngredientSummary) => {
    if (!item.ingredient.unit_equivalences?.length) return [];

    const quantity = item.customQuantity ?? item.totalQuantity;
    // Siempre calcula la cantidad en base_unit
    const baseQuantity = item.customUnit ? 
      convertToBaseUnit(quantity, item.customUnit, item.ingredient) :
      quantity;

    // Equivalencia en la unidad base
    const equivalences = [
      {
        unit: item.ingredient.base_unit,
        quantity: Math.round(baseQuantity * 100) / 100
      },
      // Equivalencias relativas
      ...item.ingredient.unit_equivalences.map(ue => ({
        unit: ue.unit_name,
        quantity: Math.round((baseQuantity / ue.conversion_factor) * 100) / 100
      }))
    ];

    return equivalences;
  };

  const convertToBaseUnit = (quantity: number, unit: string, ingredient: Ingredient) => {
    if (unit === ingredient.base_unit) return quantity;
    
    const conversion = ingredient.unit_equivalences?.find(ue => ue.unit_name === unit);
    if (!conversion) return quantity;
    
    return quantity * conversion.conversion_factor;
  };

  const handleSaveList = async () => {
    if (!listName.trim()) {
      toast.error('Por favor ingresa un nombre para la lista');
      return;
    }

    try {
      const { data: list, error: listError } = await supabase
        .from('shopping_lists')
        .insert({
          name: listName,
          start_date: format(dateRange.start, 'yyyy-MM-dd'),
          end_date: format(dateRange.end, 'yyyy-MM-dd')
        })
        .select()
        .single();

      if (listError) throw listError;

      const items = ingredients.map(item => ({
        shopping_list_id: list.id,
        ingredient_id: item.ingredient.id,
        quantity: item.totalQuantity,
        purchased: false
      }));

      const { error: itemsError } = await supabase
        .from('shopping_list_items')
        .insert(items);

      if (itemsError) throw itemsError;

      toast.success('Lista guardada correctamente');
      setListName('');
      await fetchSavedLists();
    } catch (error) {
      console.error('Error saving list:', error);
      toast.error('Error al guardar la lista');
    }
  };

  const handleCopyList = async (list: SavedList) => {
    try {
      const { data: newList, error: listError } = await supabase
        .from('shopping_lists')
        .insert({
          name: `${list.name} (consolidado)`,
          start_date: list.start_date,
          end_date: list.end_date,
          original_list_id: list.id
        })
        .select()
        .single();

      if (listError) throw listError;

      const { data: items, error: itemsError } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('shopping_list_id', list.id);

      if (itemsError) throw itemsError;

      const newItems = items?.map(item => ({
        shopping_list_id: newList.id,
        ingredient_id: item.ingredient_id,
        quantity: item.quantity,
        custom_quantity: item.custom_quantity,
        custom_unit: item.custom_unit,
        purchased: false
      }));

      const { error: insertError } = await supabase
        .from('shopping_list_items')
        .insert(newItems);

      if (insertError) throw insertError;

      toast.success('Lista copiada correctamente');
      await fetchSavedLists();
      setSelectedList(newList);
    } catch (error) {
      console.error('Error copying list:', error);
      toast.error('Error al copiar la lista');
    }
  };

  const handleUpdateQuantity = async (
    ingredientId: string,
    quantity: number,
    unit: string
  ) => {
    if (!selectedList) return;

    try {
      const { error } = await supabase
        .from('shopping_list_items')
        .update({
          custom_quantity: quantity,
          custom_unit: unit
        })
        .eq('shopping_list_id', selectedList.id)
        .eq('ingredient_id', ingredientId);

      if (error) throw error;

      setIngredients(ingredients.map(i => 
        i.ingredient.id === ingredientId
          ? { ...i, customQuantity: quantity, customUnit: unit }
          : i
      ));

      setEditingItem(null);
      toast.success('Cantidad actualizada');
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Error al actualizar la cantidad');
    }
  };

  const handleTogglePurchased = async (ingredientId: string) => {
    if (!selectedList) return;

    try {
      const item = ingredients.find(i => i.ingredient.id === ingredientId);
      if (!item) return;

      const newPurchased = !item.purchased;

      const { error } = await supabase
        .from('shopping_list_items')
        .update({ purchased: newPurchased })
        .eq('shopping_list_id', selectedList.id)
        .eq('ingredient_id', ingredientId);

      if (error) throw error;

      setIngredients(prevIngredients => 
        prevIngredients.map(i => 
          i.ingredient.id === ingredientId
            ? { ...i, purchased: newPurchased }
            : i
        )
      );
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Error al actualizar el item');
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta lista?')) return;

    try {
      const { data: dependentLists, error: fetchError } = await supabase
        .from('shopping_lists')
        .select('id')
        .eq('original_list_id', listId);

      if (fetchError) throw fetchError;

      if (dependentLists && dependentLists.length > 0) {
        const { error: deleteError } = await supabase
          .from('shopping_lists')
          .delete()
          .in('id', dependentLists.map(list => list.id));

        if (deleteError) throw deleteError;
      }

      const { error: deleteError } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('id', listId);

      if (deleteError) throw deleteError;

      toast.success('Lista eliminada correctamente');
      setSelectedList(null);
      await fetchSavedLists();
    } catch (error) {
      console.error('Error deleting list:', error);
      toast.error('Error al eliminar la lista');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto mb-2 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Calculando lista de compras...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Lista de Compras</h1>
        <div className="flex items-center space-x-4">
          {!selectedList && (
            <>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Seleccionar fechas
              </button>
              <input
                type="text"
                placeholder="Nombre de la lista"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <button
                onClick={handleSaveList}
                disabled={!listName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar lista
              </button>
            </>
          )}
        </div>
      </div>

      {showDatePicker && !selectedList && (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha inicio
              </label>
              <input
                type="date"
                value={format(dateRange.start, 'yyyy-MM-dd')}
                onChange={(e) => setDateRange({
                  ...dateRange,
                  start: parseISO(e.target.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha fin
              </label>
              <input
                type="date"
                value={format(dateRange.end, 'yyyy-MM-dd')}
                onChange={(e) => setDateRange({
                  ...dateRange,
                  end: parseISO(e.target.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex space-x-4">
        <div className="w-64 space-y-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4">Listas guardadas</h2>
            <div className="space-y-2">
              {savedLists.map((list) => (
                <div
                  key={list.id}
                  className={`p-2 rounded-md ${
                    selectedList?.id === list.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <button
                      onClick={() => setSelectedList(
                        selectedList?.id === list.id ? null : list
                      )}
                      className="flex-grow text-left"
                    >
                      <div className="font-medium">{list.name}</div>
                      <div className="text-sm text-gray-500">
                        {format(parseISO(list.start_date), 'dd/MM/yyyy')} -
                        {format(parseISO(list.end_date), 'dd/MM/yyyy')}
                      </div>
                    </button>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleCopyList(list)}
                        className="p-1 text-gray-600 hover:text-gray-800 rounded"
                        title="Crear consolidado"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteList(list.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {list.original_list_id && (
                    <div className="mt-1 text-xs text-gray-500">
                      (Lista consolidada)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4">Filtros</h2>
            <div className="space-y-4">
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={groupByTags}
                    onChange={(e) => setGroupByTags(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span>Agrupar por categorías</span>
                </label>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Categorías</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(() => {
                    const ingredientTags = ingredients.flatMap(item => item.ingredient.tags || []);
                    const allTags = Array.from(new Set([...SUGGESTED_TAGS, ...ingredientTags]));
                    return allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleTagToggle(tag)}
                        className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                          selectedTags.includes(tag)
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </button>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-grow">
          {ingredients.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <p className="text-gray-500">No hay ingredientes para comprar</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 space-y-8">
                {Object.entries(getFilteredAndGroupedIngredients()).map(([tag, items]) => (
                  <div key={tag} className="space-y-6">
                    {groupByTags && (
                      <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Tag className="w-4 h-4 mr-2" />
                        {tag}
                      </h2>
                    )}
                    <div className="space-y-4">
                      {items.map((item) => (
                        <div
                          key={item.ingredient.id}
                          className={`flex items-start space-x-4 p-4 rounded-lg ${
                            item.purchased ? 'bg-green-50' : 'bg-gray-50'
                          }`}
                        >
                          {item.ingredient.image_url && (
                            <img
                              src={item.ingredient.image_url}
                              alt={item.ingredient.name}
                              className="w-16 h-16 object-cover rounded-md"
                            />
                          )}
                          <div className="flex-grow">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className={`text-lg font-medium ${
                                  item.purchased ? 'line-through text-gray-500' : 'text-gray-900'
                                }`}>
                                  {item.ingredient.name}
                                </h3>
                                <div className="text-gray-600 space-y-1">
                                  {editingItem === item.ingredient.id ? (
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="number"
                                        defaultValue={item.customQuantity ?? item.totalQuantity}
                                        min="0.01"
                                        step="0.01"
                                        className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            const input = e.target as HTMLInputElement;
                                            const select = input.nextElementSibling as HTMLSelectElement;
                                            handleUpdateQuantity(
                                              item.ingredient.id,
                                              parseFloat(input.value),
                                              select.value
                                            );
                                          }
                                        }}
                                      />
                                      <select
                                        defaultValue={item.customUnit ?? item.ingredient.base_unit}
                                        className="px-2 py-1 border border-gray-300 rounded-md"
                                      >
                                        {[
                                          item.ingredient.base_unit,
                                          ...(item.ingredient.unit_equivalences?.map(ue => ue.unit_name) ?? [])
                                        ]
                                          .filter((v, i, arr) => arr.indexOf(v) === i) // elimina duplicados
                                          .map(unit => (
                                            <option key={unit} value={unit}>
                                              {unit}
                                            </option>
                                          ))}
                                      </select>
                                      <button
                                        onClick={() => {
                                          const input = document.querySelector(
                                            `input[type="number"]`
                                          ) as HTMLInputElement;
                                          const select = document.querySelector(
                                            'select'
                                          ) as HTMLSelectElement;
                                          handleUpdateQuantity(
                                            item.ingredient.id,
                                            parseFloat(input.value),
                                            select.value
                                          );
                                        }}
                                        className="p-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <p>
                                        {item.customQuantity ?? item.totalQuantity} {item.customUnit ?? item.ingredient.base_unit}
                                      </p>
                                      {getEquivalences(item).map((eq, idx) => (
                                        <p key={idx} className="text-sm text-gray-500">
                                          ≈ {eq.quantity} {eq.unit}
                                        </p>
                                      ))}
                                    </>
                                  )}
                                </div>
                                {!groupByTags && item.ingredient.tags && item.ingredient.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {item.ingredient.tags.map(tag => (
                                      <span
                                        key={tag}
                                        className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs flex items-center"
                                      >
                                        <Tag className="w-3 h-3 mr-1" />
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                {selectedList?.original_list_id && (
                                  <button
                                    onClick={() => setEditingItem(
                                      editingItem === item.ingredient.id ? null : item.ingredient.id
                                    )}
                                    className="p-2 text-gray-600 hover:text-gray-800 rounded-md"
                                  >
                                    <Edit2 className="w-5 h-5" />
                                  </button>
                                )}
                                {selectedList && (
                                  <button
                                    onClick={() => handleTogglePurchased(item.ingredient.id)}
                                    className={`p-2 rounded-md ${
                                      item.purchased
                                        ? 'bg-green-100 text-green-600'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    <Check className="w-5 h-5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => setShowRecipeInfo(
                                    showRecipeInfo === item.ingredient.id ? null : item.ingredient.id
                                  )}
                                  className="p-2 text-gray-400 hover:text-gray-600"
                                >
                                  <Info className="w-5 h-5" />
                                </button>
                              </div>
                            </div>

                            {showRecipeInfo === item.ingredient.id && item.recipes.length > 0 && (
                              <div className="mt-4 space-y-2">
                                <h4 className="font-medium text-gray-700">Se utilizará en:</h4>
                                {item.recipes.map((recipe, index) => {
                                  // Buscar la cantidad y unidad específica de este ingrediente en la receta
                                  let cantidad = null;
                                  let unidad = null;
                                  let porciones = recipe.porciones || 1;
                                  if (recipe.recipe_ingredients && Array.isArray(recipe.recipe_ingredients)) {
                                    // Buscar el ingrediente actual en la receta
                                    const found = recipe.recipe_ingredients.find(ri => ri.ingredients?.id === item.ingredient.id);
                                    if (found) {
                                      cantidad = found.quantity * porciones;
                                      unidad = found.unit_name;
                                    }
                                  }
                                  return (
                                    <div key={index} className="text-sm text-gray-600">
                                      • {recipe.name} - {recipe.meal_type} ({format(new Date(recipe.date), 'EEEE d', { locale: es })})
                                      {cantidad !== null && unidad && (
                                        <span className="ml-2 text-xs text-gray-500">{cantidad} {unidad} ({porciones} porciones)</span>
                                      )}
                                      {((cantidad === null || !unidad) && typeof porciones !== 'undefined') && (
                                        <span className="ml-2 text-xs text-gray-400">({porciones} porciones)</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
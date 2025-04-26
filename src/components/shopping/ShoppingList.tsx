import React, { useState, useEffect, useCallback } from 'react';
import { format, startOfWeek, addDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Info, Check, Calendar, Edit2, Tag } from 'lucide-react';
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
  porciones?: number;
  portions?: number;
  quantity?: number;
  unit_name?: string;
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
  const [ingredients, setIngredients] = useState<IngredientSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRecipeInfo, setShowRecipeInfo] = useState<string | null>(null);
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);
  const [selectedList, setSelectedList] = useState<SavedList | null>(null);
  const [dateRange, setDateRange] = useState({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 6)
  });
  const [listName, setListName] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ [id: string]: { quantity: number; unit: string } }>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [groupByTags, setGroupByTags] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const allTags = Array.from(
    new Set([
      ...SUGGESTED_TAGS,
      ...ingredients.flatMap(item => item.ingredient.tags || [])
    ])
  );

  useEffect(() => {
    setSelectedTags(prev => prev.filter(tag => allTags.includes(tag)));
  }, [ingredients]);

  useEffect(() => {
    fetchSavedLists();
    const subscription = supabase
      .channel('meal_plan_details_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meal_plan_details' }, () => {
        if (!selectedList) fetchWeeklyIngredients();
      })
      .subscribe();
    return () => { subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (selectedList) {
      fetchSavedListItems(selectedList.id);
    } else {
      fetchWeeklyIngredients();
    }
  }, [selectedList, dateRange]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const getFilteredAndGroupedIngredients = useCallback(() => {
    let filtered = ingredients;
    if (!showCompleted) filtered = filtered.filter(i => !i.purchased);
    if (selectedTags.length)
      filtered = filtered.filter(i =>
        selectedTags.some(tag => i.ingredient.tags?.includes(tag))
      );
    if (!groupByTags) return { Todos: filtered };
    return filtered.reduce((groups: Record<string, IngredientSummary[]>, i) => {
      const tags = i.ingredient.tags || [];
      if (!tags.length) {
        groups['Sin categoría'] = groups['Sin categoría'] || [];
        groups['Sin categoría'].push(i);
      } else {
        tags.forEach(tag => {
          groups[tag] = groups[tag] || [];
          groups[tag].push(i);
        });
      }
      return groups;
    }, {});
  }, [ingredients, showCompleted, selectedTags, groupByTags]);

  const fetchSavedLists = async () => {
    try {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSavedLists(data || []);
    } catch (err) {
      console.error(err);
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
          recipes,
          ingredients (
            id,name,base_unit,base_quantity,image_url,tags,
            unit_equivalences(unit_name,conversion_factor)
          )
        `)
        .eq('shopping_list_id', listId);
      if (error) throw error;
      setIngredients(
        data.map(item => ({
          ingredient: Array.isArray(item.ingredients) ? item.ingredients[0] : item.ingredients,
          totalQuantity: item.quantity,
          customQuantity: item.custom_quantity,
          customUnit: item.custom_unit,
          recipes: item.recipes || [],
          purchased: item.purchased
        }))
      );
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar los items de la lista');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeeklyIngredients = async () => {
    setIsLoading(true);
    try {
      const dates: string[] = [];
      let curr = dateRange.start;
      while (curr <= dateRange.end) {
        dates.push(format(curr, 'yyyy-MM-dd'));
        curr = addDays(curr, 1);
      }
      const { data: details, error } = await supabase
        .from('meal_plan_details')
        .select(`date,meal_type,recipe_id,recipe_name,ingredients`)
        .in('date', dates);
      if (error) throw error;

      const map = new Map<string, IngredientSummary>();
      details.forEach((card: any) => {
        card.ingredients?.forEach((ing: any) => {
          const recetaPorciones = ing.porciones ?? card.porciones ?? card.portions ?? 1;
          const planPorciones = card.porciones ?? card.portions ?? recetaPorciones;
          const cantidadPorPorcion = (ing.quantity ?? 0) / recetaPorciones;
          const cantidadTotal = cantidadPorPorcion * planPorciones;



          if (!ing?.id) return;

          const existing = map.get(ing.id);
          if (existing) {
            existing.totalQuantity += convertToBaseUnit(cantidadTotal, ing.unit_name, ing);
            const idx = existing.recipes.findIndex(r => r.id === card.recipe_id && r.date === card.date);
            if (idx > -1) {
              existing.recipes[idx].quantity += cantidadTotal;
              existing.recipes[idx].porciones = (existing.recipes[idx].porciones ?? 0) + planPorciones;
            } else {
              existing.recipes.push({
                id: card.recipe_id,
                name: card.recipe_name,
                date: card.date,
                meal_type: card.meal_type,
                quantity: cantidadTotal,
                unit_name: ing.unit_name,
                porciones: planPorciones
              });
            }
          } else {
            map.set(ing.id, {
              ingredient: ing,
              totalQuantity: convertToBaseUnit(cantidadTotal, ing.unit_name, ing),
              recipes: [{
                id: card.recipe_id,
                name: card.recipe_name,
                date: card.date,
                meal_type: card.meal_type,
                quantity: cantidadTotal,
                unit_name: ing.unit_name,
                porciones: planPorciones
              }]
            });
          }
        });
      });

      setIngredients(Array.from(map.values()));
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar la lista de compras');
    } finally {
      setIsLoading(false);
    }
  };

  const convertToBaseUnit = (qty: number, unit: string, ing: Ingredient) => {
    if (unit === ing.base_unit) return qty;
    const conv = ing.unit_equivalences?.find(u => u.unit_name === unit);
    return conv ? qty * conv.conversion_factor : qty;
  };

  const getEquivalences = (item: IngredientSummary) => {
    if (!item.ingredient.unit_equivalences?.length) {
      return [{ unit: item.ingredient.base_unit, quantity: item.totalQuantity }];
    }
    const qty = item.customQuantity ?? item.totalQuantity;
    const baseQty = item.customUnit
      ? convertToBaseUnit(qty, item.customUnit, item.ingredient)
      : qty;
    return [
      { unit: item.ingredient.base_unit, quantity: Math.round(baseQty * 100) / 100 },
      ...item.ingredient.unit_equivalences.map(u => {
        if (item.ingredient.base_unit.toLowerCase().includes('unidad')) {
          return {
            unit: u.unit_name,
            quantity: Math.round((baseQty * u.conversion_factor) * 100) / 100
          };
        } else {
          return {
            unit: u.unit_name,
            quantity: Math.round((baseQty / u.conversion_factor) * 100) / 100
          };
        }
      })
    ];
  };

  const handleSaveList = async () => {
    if (!listName.trim()) {
      toast.error('Por favor ingresa un nombre para la lista');
      return;
    }
    try {
      const { data: list, error } = await supabase
        .from('shopping_lists')
        .insert({
          name: listName,
          start_date: format(dateRange.start, 'yyyy-MM-dd'),
          end_date: format(dateRange.end, 'yyyy-MM-dd')
        })
        .select()
        .single();
      if (error) throw error;
      const items = ingredients.map(i => ({
        shopping_list_id: list.id,
        ingredient_id: i.ingredient.id,
        quantity: i.totalQuantity,
        custom_quantity: i.customQuantity,
        custom_unit: i.customUnit,
        purchased: i.purchased ?? false,
        recipes: i.recipes
      }));
      const { error: e2 } = await supabase.from('shopping_list_items').insert(items);
      if (e2) throw e2;
      toast.success('Lista guardada correctamente');
      setListName('');
      await fetchSavedLists();
      setSelectedList(list);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar la lista');
    }
  };

  const handleCopyList = async (list: SavedList) => {
    try {
      const { data: newList, error } = await supabase
        .from('shopping_lists')
        .insert({
          name: `${list.name} (copia)`,
          start_date: list.start_date,
          end_date: list.end_date,
          original_list_id: list.id
        })
        .select()
        .single();
      if (error) throw error;
      const { data: items, error: e2 } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('shopping_list_id', list.id);
      if (e2) throw e2;
      const newItems = items.map((it: any) => ({
        shopping_list_id: newList.id,
        ingredient_id: it.ingredient_id,
        quantity: it.quantity,
        custom_quantity: it.custom_quantity,
        custom_unit: it.custom_unit,
        purchased: false,
        recipes: it.recipes || []
      }));
      const { error: e3 } = await supabase.from('shopping_list_items').insert(newItems);
      if (e3) throw e3;
      toast.success('Lista copiada correctamente');
      await fetchSavedLists();
      setSelectedList(newList);
    } catch (err) {
      console.error(err);
      toast.error('Error al copiar la lista');
    }
  };

  const handleUpdateQuantity = async (ingredientId: string, quantity: number, unit: string) => {
    if (!selectedList) return;
    try {
      const { error } = await supabase
        .from('shopping_list_items')
        .update({ custom_quantity: quantity, custom_unit: unit })
        .eq('shopping_list_id', selectedList.id)
        .eq('ingredient_id', ingredientId);
      if (error) throw error;
      setIngredients(prev =>
        prev.map(i =>
          i.ingredient.id === ingredientId
            ? { ...i, customQuantity: quantity, customUnit: unit }
            : i
        )
      );
      setEditingItem(null);
      toast.success('Cantidad actualizada');
    } catch (err) {
      console.error(err);
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
      setIngredients(prev =>
        prev.map(i =>
          i.ingredient.id === ingredientId
            ? { ...i, purchased: newPurchased }
            : i
        )
      );
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar el item');
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta lista?')) return;
    try {
      const { data: deps, error } = await supabase
        .from('shopping_lists')
        .select('id')
        .eq('original_list_id', listId);
      if (error) throw error;
      if (deps?.length) {
        const { error: e2 } = await supabase
          .from('shopping_lists')
          .delete()
          .in('id', deps.map(d => d.id));
        if (e2) throw e2;
      }
      const { error: e3 } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('id', listId);
      if (e3) throw e3;
      toast.success('Lista eliminada correctamente');
      if (selectedList?.id === listId) {
        setSelectedList(null);
        fetchWeeklyIngredients();
      }
      await fetchSavedLists();
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar la lista');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg className="animate whitenoise-spin h-8 w-8 mx-auto mb-2 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Calculando lista de compras...</p>
        </div>
      </div>
    );
  }

  const grouped = getFilteredAndGroupedIngredients();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Lista de Compras</h1>
      </div>
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filtros</h2>
        <div className="space-y-4">
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={groupByTags}
              onChange={() => setGroupByTags(!groupByTags)}
            />
            <span>Agrupar por categorías</span>
          </label>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={showCompleted}
              onChange={e => setShowCompleted(e.target.checked)}
            />
            <span>Mostrar completados</span>
          </label>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Categorías</h3>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${selectedTags.includes(tag)
                    ? 'bg-blue-100 text-blue-700 border border-blue-400'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  onClick={() => handleTagToggle(tag)}
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold mb-4">Listas guardadas</h2>
        <div className="flex items-center space-x-2 mb-4">
          <select
            value={selectedList?.id || ''}
            onChange={e => {
              const list = savedLists.find(l => l.id === e.target.value) || null;
              setSelectedList(list);
            }}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">Lista semanal actual</option>
            {savedLists.map(list => (
              <option key={list.id} value={list.id}>
                {list.name} ({format(parseISO(list.start_date), 'd MMM', { locale: es })} –
                {format(parseISO(list.end_date), 'd MMM', { locale: es })})
              </option>
            ))}
          </select>
          <button
            onClick={() => selectedList && handleCopyList(selectedList)}
            disabled={!selectedList}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Copiar
          </button>
          {selectedList && (
            <button
              onClick={() => handleDeleteList(selectedList.id)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Eliminar
            </button>
          )}
        </div>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Nombre para nueva lista"
            value={listName}
            onChange={e => setListName(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
          <button
            onClick={handleSaveList}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Guardar nueva lista
          </button>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-2 py-3 sm:px-4 sm:py-6">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 mb-2 flex flex-col gap-2 sm:static sm:bg-transparent sm:border-0 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1 sm:gap-2 w-full overflow-x-auto">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center px-2 py-2 rounded-md bg-blue-600 text rate-limit text-white hover:bg-blue-700 transition text-xs sm:text-sm whitespace-nowrap"
            >
              <Calendar className="w-4 h-4 mr-1" />
              {format(dateRange.start, 'd MMM', { locale: es })} – {format(dateRange.end, 'd MMM', { locale: es })}
            </button>
            {showDatePicker && (
              <div className="flex items-center gap-2 pl-2">
                <input
                  type="date"
                  className="border border-gray-300 rounded-md p-1 text-xs"
                  value={format(dateRange.start, 'yyyy-MM-dd')}
                  onChange={e =>
                    setDateRange({ start: parseISO(e.target.value), end: dateRange.end })
                  }
                />
                <span className="px-1">–</span>
                <input
                  type="date"
                  className="border border-gray-300 rounded-md p-1 text-xs"
                  value={format(dateRange.end, 'yyyy-MM-dd')}
                  onChange={e =>
                    setDateRange({ start: dateRange.start, end: parseISO(e.target.value) })
                  }
                />
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="ml-2 px-2 py-1 bg-blue-600 text-white rounded text-xs"
                >
                  Aplicar
                </button>
              </div>
            )}
            <button
              onClick={() =>
                setDateRange({
                  start: addDays(dateRange.start, -7),
                  end: addDays(dateRange.end, -7)
                })
              }
              className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                setDateRange({
                  start: addDays(dateRange.start, 7),
                  end: addDays(dateRange.end, 7)
                })
              }
              className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-1 flex-wrap w-full sm:w-auto">
            <button
              onClick={() => setGroupByTags(!groupByTags)}
              className={`px-2 py-2 rounded-md text-xs sm:text-sm font-medium transition ${groupByTags ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Agrupar por categoría
            </button>
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className={`px-2 py-2 rounded-md text-xs sm:text-sm font-medium transition ${showCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {showCompleted ? 'Ver todo' : 'Ocultar comprados'}
            </button>
          </div>
        </div>
        <div className="flex-grow">
          {ingredients.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <p className="text-gray-500">No hay ingredientes para comprar</p>
            </div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group} className="mb-4">
                {group !== 'Todos' && (
                  <div className="mb-2 text-xs sm:text-sm font-bold text-blue-700 uppercase tracking-wide flex items-center gap-1">
                    <Tag className="w-4 h-4" /> {group}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  {items.map(item => (
                    <div
                      key={item.ingredient.id}
                      className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 sm:p-3 rounded-lg border border-gray-100 bg-gray-50 shadow-sm transition-all ${item.purchased ? 'opacity-60 line-through' : ''
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
                            <h3
                              className={`text-lg font-medium ${item.purchased ? 'line-through text-gray-500' : 'text-gray-900'
                                }`}
                            >
                              {item.ingredient.name}
                            </h3>
                            <div className="text-xs text-gray-400">
                              en{' '}
                              {item.recipes.reduce(
                                (acc, r) =>
                                  acc +
                                  (typeof (r.porciones ?? r.portions) === 'number'
                                    ? r.porciones ?? r.portions!
                                    : 0),
                                0
                              )}{' '}
                              porciones
                            </div>
                            <div className="text-gray-600 space-y-1">
                              {editingItem === item.ingredient.id ? (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="number"
                                    value={
                                      editValues[item.ingredient.id]?.quantity ??
                                      item.customQuantity ??
                                      item.totalQuantity
                                    }
                                    min="0.01"
                                    step="0.01"
                                    className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                                    onChange={e =>
                                      setEditValues(v => ({
                                        ...v,
                                        [item.ingredient.id]: {
                                          ...v[item.ingredient.id],
                                          quantity: parseFloat(e.target.value)
                                        }
                                      }))
                                    }
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') {
                                        const val = editValues[item.ingredient.id];
                                        handleUpdateQuantity(
                                          item.ingredient.id,
                                          val?.quantity ?? item.customQuantity ?? item.totalQuantity,
                                          val?.unit ?? item.customUnit ?? item.ingredient.base_unit
                                        );
                                        setEditingItem(null);
                                      }
                                    }}
                                  />
                                  <select
                                    value={
                                      editValues[item.ingredient.id]?.unit ??
                                      item.customUnit ??
                                      item.ingredient.base_unit
                                    }
                                    className="px-2 py-1 border border-gray-300 rounded-md"
                                    onChange={e =>
                                      setEditValues(v => ({
                                        ...v,
                                        [item.ingredient.id]: {
                                          ...v[item.ingredient.id],
                                          unit: e.target.value
                                        }
                                      }))
                                    }
                                  >
                                    {[
                                      item.ingredient.base_unit,
                                      ...(item.ingredient.unit_equivalences?.map(ue => ue.unit_name) ?? [])
                                    ]
                                      .filter((v, i, a) => a.indexOf(v) === i)
                                      .map(u => (
                                        <option key={u} value={u}>
                                          {u}
                                        </option>
                                      ))}
                                  </select>
                                  <button
                                    onClick={() => {
                                      const val = editValues[item.ingredient.id];
                                      handleUpdateQuantity(
                                        item.ingredient.id,
                                        val?.quantity ?? item.customQuantity ?? item.totalQuantity,
                                        val?.unit ?? item.customUnit ?? item.ingredient.base_unit
                                      );
                                      setEditingItem(null);
                                    }}
                                    className="p-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <p>
                                    {item.customQuantity ?? item.totalQuantity}{' '}
                                    {item.customUnit ?? item.ingredient.base_unit}
                                  </p>
                                  {getEquivalences(item).map((eq, i) => (
                                    <p key={i} className="text-sm text-gray-500">
                                      ≈ {eq.quantity} {eq.unit}
                                    </p>
                                  ))}
                                </div>
                              )}
                              {!groupByTags && item.ingredient.tags?.length! > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {item.ingredient.tags!.map(t => (
                                    <span
                                      key={t}
                                      className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs flex items-center"
                                    >
                                      <Tag className="w-3 h-3 mr-1" />
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {selectedList && (
                              <>
                                <button
                                  onClick={() =>
                                    setEditingItem(
                                      editingItem === item.ingredient.id ? null : item.ingredient.id
                                    )
                                  }
                                  className="p-2 text-gray-600 hover:text-gray-800 rounded-md"
                                >
                                  <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleTogglePurchased(item.ingredient.id)}
                                  className={`p-2 rounded-md ${item.purchased
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-gray-100 text-gray-600'
                                    }`}
                                >
                                  <Check className="w-5 h-5" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() =>
                                setShowRecipeInfo(
                                  showRecipeInfo === item.ingredient.id ? null : item.ingredient.id
                                )
                              }
                              className="p-2 text-gray-400 hover:text-gray-600"
                            >
                              <Info className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                        {showRecipeInfo === item.ingredient.id && (
                          <div className="mt-4 space-y-2">
                            <h4 className="font-medium text-gray-700">Se utilizará en:</h4>
                            {item.recipes.length ? (
                              item.recipes.map((r, i) => (
                                <div key={i} className="text-sm text-gray-600">
                                  • {r.name} - {r.meal_type}{' '}
                                  ({format(parseISO(r.date), 'EEEE d', { locale: es })})
                                  {r.quantity && r.unit_name && (
                                    <span className="ml-2 text-xs text-gray-500">
                                      {r.quantity} {r.unit_name}
                                    </span>
                                  )}
                                  {(r.porciones ?? r.portions) && (
                                    <span className="ml-2 text-xs text-gray-400">
                                      en {r.porciones ?? r.portions} porciones
                                    </span>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="text-sm text-gray-500 italic">
                                No hay detalles de recetas para este ingrediente.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
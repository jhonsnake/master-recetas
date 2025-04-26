import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, ChevronLeft, ChevronRight, Settings, Users, Utensils, BarChart2, PieChart as PieIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { DayModal } from './DayModal';
import { MealTypeManager } from './MealTypeManager';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import type { MealType, Recipe, Person, Meal, DailyPlan } from '../../types';
import { Link } from 'react-router-dom';

const RECOMMENDED_MACROS = {
  carbs: { label: 'Carbs', target: 50, color: '#FFBB28' },
  protein: { label: 'Proteína', target: 20, color: '#0088FE' },
  fat: { label: 'Grasa', target: 30, color: '#FF8042' }
};

interface MealPlanDetailRow {
  meal_plan_id: string;
  date: string;
  meal_type_id: string;
  meal_type_name: string | null;
  recipe_id: string | null;
  porciones: number | null;
  recipe_name: string | null;
  image_url: string | null;
  instructions: string[] | null;
  receta_porciones: number | null;
  total_nutrition: any | null; // Changed from Json to any for TypeScript compatibility
  live_total_nutrition: any | null;
  ingredients: any[] | null;
}

export function MealPlanner() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  const [mealTypes, setMealTypes] = useState<MealType[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<Map<string, DailyPlan>>(new Map());
  const [persons, setPersons] = useState<Person[]>([]);
  const [showMealTypeManager, setShowMealTypeManager] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activePersonIndex, setActivePersonIndex] = useState(0);

  const weekStartsOn = 1; // Monday

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (mealTypes.length > 0 && persons.length > 0) {
      fetchWeeklyPlan();
    }
  }, [currentDate, mealTypes, persons]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [mealTypesResponse, personsResponse] = await Promise.all([
        supabase.from('meal_types').select('*').order('order'),
        supabase.from('persons').select('*').order('name')
      ]);

      if (mealTypesResponse.error) throw mealTypesResponse.error;
      if (personsResponse.error) throw personsResponse.error;

      setMealTypes(mealTypesResponse.data || []);
      setPersons(personsResponse.data || []);
      if (personsResponse.data?.length > 0) {
        setActivePersonIndex(0);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Error al cargar los datos iniciales');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeeklyPlan = async () => {
    if (persons.length === 0) {
      setWeeklyPlan(new Map());
      return;
    }
    try {
      const startDate = startOfWeek(currentDate, { weekStartsOn });
      const endDate = endOfWeek(currentDate, { weekStartsOn });
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('meal_plan_details')
        .select('*')
        .gte('date', startDateStr)
        .lte('date', endDateStr);

      if (error) throw error;

      if (!data) {
        setWeeklyPlan(new Map());
        return;
      }

      const newWeeklyPlan = new Map<string, DailyPlan>();
      const dates = Array.from({ length: 7 }, (_, i) => format(addDays(startDate, i), 'yyyy-MM-dd'));

      dates.forEach(dateStr => {
        const mealsForDate = (data as MealPlanDetailRow[])
          .filter(row => row.date === dateStr)
          .map((row): Meal | null => {
            if (!row.recipe_id || !row.recipe_name) {
              return null;
            }

            const defaultNutrition = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 };
            const nutritionData = row.live_total_nutrition || row.total_nutrition;
            const totalNutrition = typeof nutritionData === 'object' && nutritionData !== null
              ? { ...defaultNutrition, ...nutritionData }
              : defaultNutrition;

            return {
              meal_type_id: row.meal_type_id,
              meal_type_name: row.meal_type_name || mealTypes.find(mt => mt.id === row.meal_type_id)?.name || 'Tipo Desconocido',
              porciones: row.porciones ?? 1,
              recipe: {
                id: row.recipe_id,
                name: row.recipe_name,
                image_url: row.image_url,
                instructions: row.instructions || [],
                porciones: row.receta_porciones ?? 1,
                total_nutrition: totalNutrition,
                ingredients: Array.isArray(row.ingredients) ? row.ingredients : []
              } as Recipe
            };
          })
          .filter((meal): meal is Meal => meal !== null);

        let total_calories = 0, total_protein = 0, total_carbs = 0, total_fat = 0, total_fiber = 0, total_sugar = 0;
        mealsForDate.forEach(meal => {
          const nutrition = meal.recipe.total_nutrition;
          const recipeBasePorciones = meal.recipe.porciones || 1;
          const plannedPorciones = meal.porciones || 1;

          if (nutrition && recipeBasePorciones > 0) {
            const factor = plannedPorciones / recipeBasePorciones;
            total_calories += (Number(nutrition.calories) || 0) * factor;
            total_protein += (Number(nutrition.protein) || 0) * factor;
            total_carbs += (Number(nutrition.carbs) || 0) * factor;
            total_fat += (Number(nutrition.fat) || 0) * factor;
            total_fiber += (Number(nutrition.fiber) || 0) * factor;
            total_sugar += (Number(nutrition.sugar) || 0) * factor;
          }
        });

        newWeeklyPlan.set(dateStr, {
          date: dateStr,
          meals: mealsForDate,
          total_calories: Math.round(total_calories),
          total_protein: Math.round(total_protein),
          total_carbs: Math.round(total_carbs),
          total_fat: Math.round(total_fat),
          total_fiber: Math.round(total_fiber),
          total_sugar: Math.round(total_sugar),
        });
      });

      setWeeklyPlan(newWeeklyPlan);
    } catch (error) {
      console.error('Error fetching weekly plan:', error);
      toast.error('Error al cargar el plan semanal');
      setWeeklyPlan(new Map());
    }
  };

  const getDailyPlan = (date: Date): DailyPlan | undefined => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return weeklyPlan.get(formattedDate);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDay(date);
  };

  const openDayModal = (date: Date) => {
    setSelectedDay(date);
    setSelectedDayDate(date);
  };

  const closeDayModal = () => {
    setSelectedDayDate(null);
  };

  const handleDataChanged = () => {
    fetchWeeklyPlan();
  };

  const renderNutritionPieChart = (dailyPlan: DailyPlan) => {
    const totalGrams = (dailyPlan.total_protein || 0) + (dailyPlan.total_carbs || 0) + (dailyPlan.total_fat || 0);
    if (totalGrams === 0) return <p className="text-sm text-gray-500 text-center py-8">No hay datos de macronutrientes para mostrar.</p>;

    const selectedPerson = persons[activePersonIndex];
    const carbTargetPercent = selectedPerson?.carbs ?? RECOMMENDED_MACROS.carbs.target;
    const fatTargetPercent = selectedPerson?.fat ?? RECOMMENDED_MACROS.fat.target;
    const proteinTargetPercent = selectedPerson?.protein ?? RECOMMENDED_MACROS.protein.target;
    const data = [
      { name: RECOMMENDED_MACROS.carbs.label, value: dailyPlan.total_carbs || 0, target: carbTargetPercent, color: RECOMMENDED_MACROS.carbs.color },
      { name: RECOMMENDED_MACROS.protein.label, value: dailyPlan.total_protein || 0, target: proteinTargetPercent, color: RECOMMENDED_MACROS.protein.color },
      { name: RECOMMENDED_MACROS.fat.label, value: dailyPlan.total_fat || 0, target: fatTargetPercent, color: RECOMMENDED_MACROS.fat.color },
    ];

    const actualPercentages = data.map(item => ({
      ...item,
      percentage: totalGrams > 0 ? Math.round((item.value / totalGrams) * 100) : 0,
    }));

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          {actualPercentages.map(item => (
            <div key={item.name} className="text-xs p-2 bg-gray-50 rounded border border-gray-200">
              <div className="font-semibold" style={{ color: item.color }}>{item.name}</div>
              <div className="text-gray-700">{item.percentage}% <span className="text-gray-500">({item.value}g)</span></div>
              <div className="text-gray-500">Meta: {item.target}%</div>
            </div>
          ))}
        </div>
        <div className="h-56 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={actualPercentages}
                cx="50%"
                cy="50%"
                innerRadius="50%"
                outerRadius="80%"
                paddingAngle={3}
                dataKey="percentage"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
              >
                {actualPercentages.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip
                formatter={(value: number, name: string, props: any) => {
                  const item = actualPercentages.find(d => d.name === name);
                  return [`${item?.value ?? 0}g (${value}%)`, name];
                }}
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '0.375rem', border: '1px solid #e5e7eb', padding: '8px' }}
                itemStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderPersonProgressBarChart = (dailyPlan: DailyPlan, person: Person) => {
    const safeTarget = (target: number | null | undefined) => Math.max(Number(target) || 0, 0);

    const carbTargetGrams = person.calories && person.carbs ? (person.carbs / 100) * person.calories / 4 : 0;
    const fatTargetGrams = person.calories && person.fat ? (person.fat / 100) * person.calories / 9 : 0;
    const data = [
      { name: 'Calorías', actual: dailyPlan.total_calories || 0, target: safeTarget(person.calories), unit: 'kcal', color: '#8884d8' },
      { name: 'Proteínas', actual: dailyPlan.total_protein || 0, target: safeTarget(person.protein), unit: 'g', color: RECOMMENDED_MACROS.protein.color },
      { name: 'Carbs', actual: dailyPlan.total_carbs || 0, target: carbTargetGrams, unit: 'g', color: RECOMMENDED_MACROS.carbs.color, metaPercent: person.carbs },
      { name: 'Grasas', actual: dailyPlan.total_fat || 0, target: fatTargetGrams, unit: 'g', color: RECOMMENDED_MACROS.fat.color, metaPercent: person.fat },
    ].map(item => ({
      ...item,
      percentage: item.target > 0 ? Math.min(Math.round((item.actual / item.target) * 100), 150) : 0,
    }));

    return (
      <div className="h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} unit="%" tickFormatter={(value) => `${value}%`} />
            <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 12 }} />
            <RechartsTooltip
              formatter={(value: number, name: string, props: any) => {
                const item = data.find(d => d.name === props.payload.name);
                if (!item) return ['-', name];
                const actualPercentage = item.target > 0 ? Math.round((item.actual / item.target) * 100) : 0;
                if (item.metaPercent !== undefined) {
                  return [`${item.actual}${item.unit} / ${item.target.toFixed(1)}${item.unit} (${actualPercentage}%) | Meta: ${item.metaPercent}%`, name];
                }
                return [`${item.actual}${item.unit} / ${item.target}${item.unit} (${actualPercentage}%)`, name];
              }}
              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '0.375rem', border: '1px solid #e5e7eb', padding: '8px' }}
              itemStyle={{ fontSize: '12px' }}
            />
            <Bar dataKey="percentage" barSize={20}>
              {data.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto mb-2 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Cargando planificador...</p>
        </div>
      </div>
    );
  }

  if (persons.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow p-6">
        <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          No hay personas configuradas
        </h2>
        <p className="text-gray-600 mb-4 max-w-md mx-auto">
          Para usar el planificador y ver el progreso nutricional, primero debes crear al menos una persona con sus objetivos.
        </p>
        <Link
          to="/personas"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Crear Persona
        </Link>
      </div>
    );
  }

  const currentWeekStart = startOfWeek(currentDate, { weekStartsOn });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const selectedPerson = persons[activePersonIndex];
  const today = new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Planificador Semanal</h1>
        <button
          onClick={() => setShowMealTypeManager(true)}
          className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center justify-center text-sm"
        >
          <Settings className="w-4 h-4 mr-2" />
          Gestionar Tipos de Comida
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setCurrentDate(addDays(currentDate, -7))}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-600 hover:text-gray-800"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base sm:text-lg font-semibold text-center">
            Semana del {format(currentWeekStart, 'd MMM', { locale: es })} - {format(endOfWeek(currentDate, { weekStartsOn }), 'd MMM yyyy', { locale: es })}
          </h2>
          <button
            onClick={() => setCurrentDate(addDays(currentDate, 7))}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-600 hover:text-gray-800"
            aria-label="Semana siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-3">
          {weekDays.map((date) => {
            const dailyPlan = getDailyPlan(date);
            const isToday = isSameDay(date, today);
            const isSelected = selectedDay && isSameDay(date, selectedDay);
            return (
              <div
                key={date.toISOString()}
                className={`rounded-lg border p-3 cursor-pointer transition-all flex flex-col min-h-[120px]
                  ${isSelected ? 'border-2 border-blue-600 bg-blue-100 shadow-lg ring-2 ring-blue-400' : isToday ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                onClick={() => handleDayClick(date)}
              >
                <div className="text-center mb-2">
                  <div className={`font-semibold text-base ${isSelected ? 'text-blue-900' : isToday ? 'text-blue-700' : 'text-gray-700'}`}>
                    {format(date, 'EEE', { locale: es })}
                  </div>
                  <div className={`text-xs flex items-center justify-center gap-1 ${isSelected ? 'text-blue-800' : isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                    {format(date, 'dd/MM')}
                    {isToday && <span className="ml-1 px-1 rounded bg-blue-200 text-blue-800 text-[10px] font-bold">Hoy</span>}
                  </div>
                  {isSelected && (
                    <div className="mt-1 flex justify-center">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-bounce"></span>
                    </div>
                  )}
                </div>

                <div className="flex-grow space-y-1.5 overflow-y-auto text-xs">
                  {dailyPlan && dailyPlan.meals.length > 0 ? (
                    dailyPlan.meals.map((meal, index) => (
                      <div key={`${meal.meal_type_id}-${meal.recipe.id}-${index}`} className="bg-white p-1.5 rounded border border-gray-100 shadow-sm text-gray-700 leading-tight">
                        <div className="font-medium text-gray-800 truncate">{meal.recipe.name}</div>
                        <div className="text-gray-500">{meal.meal_type_name} ({meal.porciones}p)</div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <Utensils className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); openDayModal(date); }}
                  className="mt-2 w-full text-center text-xs text-blue-600 hover:underline"
                >
                  {dailyPlan && dailyPlan.meals.length > 0 ? 'Ver/Editar' : 'Añadir Comida'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {persons.length > 0 && selectedPerson && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
            <span className="text-sm font-medium text-gray-600 mr-2">Ver progreso para:</span>
            {persons.map((person, index) => (
              <button
                key={person.id}
                onClick={() => setActivePersonIndex(index)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${index === activePersonIndex
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {person.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-1 text-gray-800 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-600" />
                Progreso Diario vs Objetivos
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {selectedDay ? (
                  <>Nutrientes consumidos el día seleccionado ({format(selectedDay, 'EEEE d MMM', { locale: es })}) vs objetivos de {selectedPerson.name}.</>
                ) : (
                  <>Selecciona un día para ver el progreso.</>
                )}
              </p>
              {selectedDay && getDailyPlan(selectedDay) ? (
                renderPersonProgressBarChart(getDailyPlan(selectedDay)!, selectedPerson)
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">No hay comidas planificadas para este día.</p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-1 text-gray-800 flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-orange-500" />
                Distribución de Macros (Día seleccionado)
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {selectedDay ? (
                  <>Porcentaje de calorías provenientes de Carbs, Proteínas y Grasas del día seleccionado.</>
                ) : (
                  <>Selecciona un día para ver la distribución de macros.</>
                )}
              </p>
              {selectedDay && getDailyPlan(selectedDay) ? (
                renderNutritionPieChart(getDailyPlan(selectedDay)!)
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">No hay comidas planificadas para este día.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedDayDate && (
        <DayModal
          date={selectedDayDate}
          mealTypes={mealTypes}
          dailyPlan={getDailyPlan(selectedDayDate)}
          onClose={closeDayModal}
          onDataChanged={handleDataChanged}
        />
      )}

      {showMealTypeManager && (
        <MealTypeManager
          mealTypes={mealTypes}
          onClose={() => {
            setShowMealTypeManager(false);
            fetchInitialData();
          }}
        />
      )}
    </div>
  );
}
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
import type { MealType, Recipe, Person, Meal, DailyPlan } from '../../types'; // Assuming types are defined here
import { Link } from 'react-router-dom'; // Import Link

const RECOMMENDED_MACROS = {
  carbs: { label: 'Carbs', target: 50, color: '#FFBB28' }, // Amarillo/Naranja
  protein: { label: 'Proteína', target: 20, color: '#0088FE' }, // Azul
  fat: { label: 'Grasa', target: 30, color: '#FF8042' }  // Naranja/Rojo
};

// Define the expected structure from the meal_plan_details view
// This helps ensure type safety when accessing properties
interface MealPlanDetailRow {
  meal_plan_id: string; // Assuming this is selected by '*'
  date: string;
  meal_type_id: string;
  meal_type_name: string | null; // Changed from meal_type
  recipe_id: string | null;
  porciones: number | null;
  recipe_name: string | null;
  image_url: string | null;
  instructions: string[] | null;
  receta_porciones: number | null;
  total_nutrition: Json | null; // Keep as Json or define nutrition structure
  live_total_nutrition: Json | null; // Keep as Json or define nutrition structure
  ingredients: Json[] | null; // Keep as Json or define ingredient structure
}


export function MealPlanner() {
  const [currentDate, setCurrentDate] = useState(new Date()); // Renamed from selectedDate for clarity
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null); // For the modal
  const [mealTypes, setMealTypes] = useState<MealType[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<Map<string, DailyPlan>>(new Map()); // Use Map for easier access
  const [persons, setPersons] = useState<Person[]>([]);
  const [showMealTypeManager, setShowMealTypeManager] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activePersonIndex, setActivePersonIndex] = useState(0); // Track selected person for charts

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
      if ((personsResponse.data?.length ?? 0) > 0) {
        setActivePersonIndex(0); // Default to first person
      } else {

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
      
      setWeeklyPlan(new Map()); // Clear plan if no persons
      return;
    }
    try {
      const startDate = startOfWeek(currentDate, { weekStartsOn });
      const endDate = endOfWeek(currentDate, { weekStartsOn });
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      

      const { data, error } = await supabase
        .from('meal_plan_details') // Use the detailed view
        .select('*') // Select all columns from the view
        .gte('date', startDateStr)
        .lte('date', endDateStr);

      if (error) {
        
        throw error; // Rethrow to be caught by the outer catch block
      }

      if (data) {
        (data as MealPlanDetailRow[]).forEach(row => {

        });
      }

      if (!data) {
        
        setWeeklyPlan(new Map()); // Set empty plan if no data
        return;
      }

      const newWeeklyPlan = new Map<string, DailyPlan>();
      const dates = Array.from({ length: 7 }, (_, i) => format(addDays(startDate, i), 'yyyy-MM-dd'));

      dates.forEach(dateStr => {
        const mealsForDate = (data as MealPlanDetailRow[])
          .filter(row => {
            const match = row.date === dateStr;
            if (match) {

            }
            return match;
          })
          .map((row): Meal | null => {
             // **Critical Check:** Ensure essential recipe data exists
             if (!row.recipe_id || !row.recipe_name) {
               
               return null; // Skip this entry if recipe data is missing
             }

             // Safely construct the nutrition object
             const defaultNutrition = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 };
             const nutritionData = row.live_total_nutrition || row.total_nutrition;
             const totalNutrition = typeof nutritionData === 'object' && nutritionData !== null
                ? { ...defaultNutrition, ...nutritionData }
                : defaultNutrition;


             // Construct the meal object
             return {
                // Using meal_plan_id for a potentially more stable key if needed later
                // id: row.meal_plan_id, // Consider if needed for React keys
                meal_type_name: row.meal_type || mealTypes.find(mt => mt.id === row.meal_type_id)?.name || 'Tipo Desconocido', // Fallback for null meal type name
                porciones: row.porciones ?? 1, // Use nullish coalescing for default portions
                recipe: {
                  id: row.recipe_id, // Already checked this isn't null
                  name: row.recipe_name, // Already checked this isn't null
                  image_url: row.image_url,
                  instructions: row.instructions || [], // Default to empty array
                  porciones: row.receta_porciones ?? 1, // Default recipe base portions to 1
                  total_nutrition: totalNutrition, // Use the safely constructed nutrition object
                  // Ensure ingredients is an array, default to empty if null/undefined
                  ingredients: Array.isArray(row.ingredients) ? row.ingredients : []
                } as Recipe // Cast to Recipe type, assuming Recipe matches this structure
             };
          })
          .filter((meal): meal is Meal => meal !== null); // Type predicate to filter out nulls and satisfy TypeScript

        // Calculate total nutrition for the day based on *planned* portions
        let total_calories = 0, total_protein = 0, total_carbs = 0, total_fat = 0, total_fiber = 0, total_sugar = 0;
        mealsForDate.forEach(meal => {
          // Ensure nutrition object and its properties exist and are numbers
          const nutrition = meal.recipe?.total_nutrition;
          const recipeBasePorciones = meal.recipe?.porciones || 1;
          const plannedPorciones = meal.porciones || 1;

          if (nutrition && recipeBasePorciones > 0) {
            const factor = plannedPorciones / recipeBasePorciones;
            total_calories += (Number(nutrition.calories) || 0) * factor;
            total_protein += (Number(nutrition.protein) || 0) * factor;
            total_carbs += (Number(nutrition.carbs) || 0) * factor;
            total_fat += (Number(nutrition.fat) || 0) * factor;
            total_fiber += (Number(nutrition.fiber) || 0) * factor;
            total_sugar += (Number(nutrition.sugar) || 0) * factor;
          } else {
             
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
      
      toast.error('Error al cargar el plan semanal');
      setWeeklyPlan(new Map()); // Clear plan on error
    }
  };


  const getDailyPlan = (date: Date): DailyPlan | undefined => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return weeklyPlan.get(formattedDate);
  };

  const handleDayClick = (date: Date) => {

    setSelectedDayDate(date);
  };

  const closeDayModal = () => {

    setSelectedDayDate(null);
    // No automatic refetch here, rely on onDataChanged from modal
    // fetchWeeklyPlan(); // Removed: Let DayModal trigger refetch via onDataChanged
  };

  const handleDataChanged = () => {

    fetchWeeklyPlan(); // Refetch data when modal signals changes
  }

  const renderNutritionPieChart = (dailyPlan: DailyPlan) => {
    const totalGrams = (dailyPlan.total_protein || 0) + (dailyPlan.total_carbs || 0) + (dailyPlan.total_fat || 0);
    if (totalGrams === 0) return <p className="text-sm text-gray-500 text-center py-8">No hay datos de macronutrientes para mostrar.</p>;

    const data = [
      { name: RECOMMENDED_MACROS.carbs.label, value: dailyPlan.total_carbs || 0, target: RECOMMENDED_MACROS.carbs.target, color: RECOMMENDED_MACROS.carbs.color },
      { name: RECOMMENDED_MACROS.protein.label, value: dailyPlan.total_protein || 0, target: RECOMMENDED_MACROS.protein.target, color: RECOMMENDED_MACROS.protein.color },
      { name: RECOMMENDED_MACROS.fat.label, value: dailyPlan.total_fat || 0, target: RECOMMENDED_MACROS.fat.target, color: RECOMMENDED_MACROS.fat.color },
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
        <div className="h-56 sm:h-64"> {/* Adjust height for responsiveness */}
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={actualPercentages}
                cx="50%"
                cy="50%"
                innerRadius="50%" // Make it a donut chart
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
              {/* <Legend verticalAlign="bottom" height={36}/> */}
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderPersonProgressBarChart = (dailyPlan: DailyPlan, person: Person) => {
    // Ensure targets are numbers and greater than 0 for percentage calculation
    const safeTarget = (target: number | null | undefined) => Math.max(Number(target) || 0, 0);

    const data = [
      { name: 'Calorías', actual: dailyPlan.total_calories || 0, target: safeTarget(person.calories), unit: 'kcal', color: '#8884d8' },
      { name: 'Proteínas', actual: dailyPlan.total_protein || 0, target: safeTarget(person.protein), unit: 'g', color: RECOMMENDED_MACROS.protein.color },
      { name: 'Carbs', actual: dailyPlan.total_carbs || 0, target: safeTarget(person.carbs), unit: 'g', color: RECOMMENDED_MACROS.carbs.color },
      { name: 'Grasas', actual: dailyPlan.total_fat || 0, target: safeTarget(person.fat), unit: 'g', color: RECOMMENDED_MACROS.fat.color },
    ].map(item => ({
      ...item,
      // Calculate percentage, cap at a reasonable max like 150% for visual clarity
      percentage: item.target > 0 ? Math.min(Math.round((item.actual / item.target) * 100), 150) : 0,
    }));

    return (
      <div className="h-64 sm:h-72"> {/* Adjust height */}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 60, bottom: 5 }} // Adjust margins
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} unit="%" tickFormatter={(value) => `${value}%`} />
            <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 12 }} />
            <RechartsTooltip
              formatter={(value: number, name: string, props: any) => {
                 const item = data.find(d => d.name === props.payload.name);
                 if (!item) return ['-', name];
                 const actualPercentage = item.target > 0 ? Math.round((item.actual / item.target) * 100) : 0;
                 // Display actual vs target, and the percentage achieved
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
        <Link // Use React Router Link
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
      {/* Header */}
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

      {/* Week Navigation */}
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

        {/* Weekly Calendar Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-3">
          {weekDays.map((date) => {
            const dailyPlan = getDailyPlan(date);
            const isToday = isSameDay(date, today);

            return (
              <div
                key={date.toISOString()}
                className={`rounded-lg border p-3 cursor-pointer transition-all flex flex-col min-h-[120px] ${isToday ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                onClick={() => handleDayClick(date)}
              >
                <div className="text-center mb-2">
                  <div className={`font-medium text-sm ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
                    {format(date, 'EEE', { locale: es })}
                  </div>
                  <div className={`text-xs ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                    {format(date, 'dd/MM')}
                  </div>
                </div>

                <div className="flex-grow space-y-1.5 overflow-y-auto text-xs">
                  {dailyPlan && dailyPlan.meals.length > 0 ? (
                    dailyPlan.meals.map((meal, index) => (
                      // Use a more stable key if possible, e.g., combining meal_type and recipe id
                      <div key={`${meal.meal_type_id}-${meal.recipe.id}-${index}`} className="bg-white p-1.5 rounded border border-gray-100 shadow-sm text-gray-700 leading-tight">
                        <div className="font-medium text-gray-800 truncate">{meal.recipe.name}</div>
                        <div className="text-gray-500">{meal.meal_type_name} ({meal.porciones}p)</div>
                      </div>
                    ))
                  ) : (
                     <div className="flex items-center justify-center h-full text-gray-400">
                       <Utensils className="w-4 h-4"/>
                     </div>
                  )}
                </div>
                 <button
                    onClick={(e) => { e.stopPropagation(); handleDayClick(date); }}
                    className="mt-2 w-full text-center text-xs text-blue-600 hover:underline"
                  >
                    {dailyPlan && dailyPlan.meals.length > 0 ? 'Ver/Editar' : 'Añadir Comida'}
                  </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Person Selector and Charts */}
      {persons.length > 0 && selectedPerson && (
        <div className="space-y-6">
          {/* Person Selector Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
             <span className="text-sm font-medium text-gray-600 mr-2">Ver progreso para:</span>
            {persons.map((person, index) => (
              <button
                key={person.id}
                onClick={() => setActivePersonIndex(index)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  index === activePersonIndex
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {person.name}
              </button>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Progress Chart */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-1 text-gray-800 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-600"/>
                Progreso Diario vs Objetivos
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Nutrientes consumidos hoy ({format(today, 'EEEE d MMM', { locale: es })}) vs objetivos de {selectedPerson.name}.
              </p>
              {getDailyPlan(today) ? (
                renderPersonProgressBarChart(getDailyPlan(today)!, selectedPerson)
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">No hay comidas planificadas para hoy.</p>
              )}
            </div>

            {/* Daily Macronutrient Distribution */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-1 text-gray-800 flex items-center gap-2">
                 <PieIcon className="w-5 h-5 text-orange-500"/>
                 Distribución de Macros (Hoy)
              </h3>
               <p className="text-sm text-gray-500 mb-4">
                Porcentaje de calorías provenientes de Carbs, Proteínas y Grasas hoy.
              </p>
              {getDailyPlan(today) ? (
                renderNutritionPieChart(getDailyPlan(today)!)
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">No hay comidas planificadas para hoy.</p>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Modals */}
      {selectedDayDate && (
        <DayModal
          date={selectedDayDate}
          mealTypes={mealTypes}
          dailyPlan={getDailyPlan(selectedDayDate)} // Pass the potentially undefined plan
          onClose={closeDayModal}
          onDataChanged={handleDataChanged} // Pass the handler to trigger refetch
        />
      )}

      {showMealTypeManager && (
        <MealTypeManager
          mealTypes={mealTypes}
          onClose={() => {

            setShowMealTypeManager(false);
            fetchInitialData(); // Refetch meal types and potentially persons
          }}
        />
      )}
    </div>
  );
}

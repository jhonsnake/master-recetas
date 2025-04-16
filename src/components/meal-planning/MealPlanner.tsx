import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, ChevronLeft, ChevronRight, Settings, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { DayModal } from './DayModal';
import { MealTypeManager } from './MealTypeManager';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

interface MealType {
  id: string;
  name: string;
  order: number;
}

interface Recipe {
  id: string;
  name: string;
  date: string;
  meal_type: string;
}

interface Person {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface DailyPlan {
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  calories_percentage: number;
  protein_percentage: number;
  carbs_percentage: number;
  fat_percentage: number;
  meals: Meal[];
}

const RECOMMENDED_MACROS = {
  carbs: { label: 'Carbohidratos', target: 50, color: '#FFBB28' },
  protein: { label: 'Proteínas', target: 20, color: '#FF8042' },
  fat: { label: 'Grasas', target: 30, color: '#00C49F' }
};

export function MealPlanner() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mealTypes, setMealTypes] = useState<MealType[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<DailyPlan[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showMealTypeManager, setShowMealTypeManager] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchWeeklyPlan();
  }, [selectedDate]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [mealTypesResponse, personsResponse] = await Promise.all([
        supabase
          .from('meal_types')
          .select('*')
          .order('order'),
        supabase
          .from('persons')
          .select('*')
          .order('name')
      ]);

      if (mealTypesResponse.error) throw mealTypesResponse.error;
      if (personsResponse.error) throw personsResponse.error;

      setMealTypes(mealTypesResponse.data);
      setPersons(personsResponse.data);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Error al cargar los datos iniciales');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeeklyPlan = async () => {
    try {
      const startDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const dates = Array.from({ length: 7 }, (_, i) =>
        format(addDays(startDate, i), 'yyyy-MM-dd')
      );

      const { data, error } = await supabase
        .from('meal_plan_details')
        .select('*')
        .in('date', dates);

      if (error) throw error;

      // Agrupa por fecha
      const groupedByDate = {};
      for (const row of data || []) {
        if (!groupedByDate[row.date]) groupedByDate[row.date] = [];
        groupedByDate[row.date].push(row);
      }

      // Construye el array de DailyPlan
      const weeklyPlan = dates.map(date => {
        const meals = (groupedByDate[date] || []).map(row => ({
          meal_type: row.meal_type,
          porciones: row.porciones,
          recipe: {
            id: row.recipe_id,
            name: row.recipe_name,
            image_url: row.image_url,
            instructions: row.instructions,
            porciones: row.receta_porciones,
            total_nutrition: row.total_nutrition,
            live_total_nutrition: row.live_total_nutrition,
            ingredients: row.ingredients
          }
        }));

        return {
          date,
          meals,
          // Puedes agregar otros campos si lo deseas
        };
      });

      setWeeklyPlan(weeklyPlan);
    } catch (error) {
      console.error('Error fetching weekly plan:', error);
      toast.error('Error al cargar el plan semanal');
    }
  };

  // Calcula los totales diarios considerando meal.porciones
  const getDailyPlan = (date: Date): DailyPlan | undefined => {
    const plan = weeklyPlan.find(plan =>
      plan.date === format(date, 'yyyy-MM-dd')
    );
    if (!plan) return undefined;
    // Sumar los totales considerando porciones
    let total_calories = 0, total_protein = 0, total_carbs = 0, total_fat = 0;
    const mealsArr = Array.isArray(plan.meals) ? plan.meals : [];
    for (const meal of mealsArr) {
      const porciones = meal.porciones || 1;
      const n = meal.recipe?.live_total_nutrition || meal.recipe || {};
      total_calories += (n.calories || 0) * porciones;
      total_protein += (n.protein || 0) * porciones;
      total_carbs += (n.carbs || 0) * porciones;
      total_fat += (n.fat || 0) * porciones;
    }
    return {
      ...plan,
      total_calories,
      total_protein,
      total_carbs,
      total_fat,
    };
  };

  const renderNutritionChart = (dailyPlan: DailyPlan) => {
    const totalMacros = dailyPlan.total_protein + dailyPlan.total_carbs + dailyPlan.total_fat;
    if (totalMacros === 0) return null;

    const actualPercentages = {
      carbs: Math.round((dailyPlan.total_carbs / totalMacros) * 100),
      protein: Math.round((dailyPlan.total_protein / totalMacros) * 100),
      fat: Math.round((dailyPlan.total_fat / totalMacros) * 100)
    };

    const data = Object.entries(RECOMMENDED_MACROS).map(([key, value]) => ({
      name: value.label,
      actual: actualPercentages[key as keyof typeof actualPercentages] || 0,
      target: value.target,
      color: value.color
    }));

    return (
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Distribución de macronutrientes
          </h4>
          <div className="grid grid-cols-3 gap-4">
            {data.map(item => (
              <div key={item.name} className="text-sm">
                <div className="font-medium" style={{ color: item.color }}>
                  {item.name}
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Actual: {item.actual}%</span>
                  <span>Meta: {item.target}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="actual"
                label={({ name, actual }) => `${name}: ${actual ?? 0}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any, name: string) => {
                  const val = value != null ? value : 0;
                  return [`${val}%`, name];
                }}
                contentStyle={{ backgroundColor: 'white', borderRadius: '0.5rem' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderPersonProgress = (dailyPlan: DailyPlan, person: Person) => {
    const data = [
      {
        name: 'Calorías',
        actual: Math.round(dailyPlan.total_calories) || 0,
        target: person.calories,
        percentage: Math.round((dailyPlan.total_calories / person.calories) * 100) || 0,
        color: '#8884d8'
      },
      {
        name: 'Proteínas',
        actual: Math.round(dailyPlan.total_protein) || 0,
        target: person.protein,
        percentage: Math.round((dailyPlan.total_protein / person.protein) * 100) || 0,
        color: '#FF8042'
      },
      {
        name: 'Carbohidratos',
        actual: Math.round(dailyPlan.total_carbs) || 0,
        target: person.carbs,
        percentage: Math.round((dailyPlan.total_carbs / person.carbs) * 100) || 0,
        color: '#FFBB28'
      },
      {
        name: 'Grasas',
        actual: Math.round(dailyPlan.total_fat) || 0,
        target: person.fat,
        percentage: Math.round((dailyPlan.total_fat / person.fat) * 100) || 0,
        color: '#00C49F'
      }
    ];

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">{person.name}</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} unit="%" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip
                formatter={(value: any, name: string, props: any) => {
                  if (!props || !props.payload) return ['-', name];
                  const item = data.find(d => d.name === props.payload.name);
                  if (!item) return ['-', name];
                  return [`${item.actual}/${item.target}g (${item.percentage}%)`, name];
                }}
                contentStyle={{ backgroundColor: 'white', borderRadius: '0.5rem' }}
              />
              <Bar dataKey="percentage" fill="#8884d8">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
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

  if (persons.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          No hay personas configuradas
        </h2>
        <p className="text-gray-600 mb-4">
          Para usar el planificador, primero debes crear al menos una persona con sus objetivos nutricionales.
        </p>
        <a
          href="/personas"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Crear Persona
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Planificador de Comidas</h1>
        <button
          onClick={() => setShowMealTypeManager(true)}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
        >
          <Settings className="w-4 h-4 mr-2" />
          Gestionar Tipos de Comida
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, -7))}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold">
            Semana del {format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd/MM/yyyy')}
          </h2>
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, 7))}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-4">
          {Array.from({ length: 7 }, (_, i) => {
            const date = addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), i);
            const dailyPlan = getDailyPlan(date);
            const isSelected = isSameDay(date, selectedDate);

            return (
              <div
                key={i}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  isSelected ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => {
                  setSelectedDate(date);
                  setShowDayModal(true);
                }}
              >
                <div className="text-center mb-2">
                  <div className="font-medium">
                    {format(date, 'EEE', { locale: es })}
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(date, 'dd/MM')}
                  </div>
                </div>

                {dailyPlan && (
                  <div className="space-y-2">
                    {(Array.isArray(dailyPlan.meals) ? dailyPlan.meals : []).map((meal, index) => (
                      <div key={index} className="text-sm">
                        <div className="font-medium text-gray-700">
                          {meal.meal_type}
                        </div>
                        <div className="text-gray-600 truncate">
                          {meal.recipe.name}
                          <span className="ml-2 px-2 py-0.5 bg-blue-200 text-blue-900 rounded text-xs">{meal.porciones || 1} porciones</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {dailyPlan && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Calorías:</span>
                        <span>{Math.round(dailyPlan.total_calories)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Proteínas:</span>
                        <span>{Math.round(dailyPlan.total_protein)}g</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {weeklyPlan.length > 0 && getDailyPlan(selectedDate) && (
        <>
          <div className="grid grid-cols-2 gap-6">
            {persons.map(person => (
              <div key={person.id}>
                {renderPersonProgress(getDailyPlan(selectedDate)!, person)}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">
              Distribución de Macronutrientes
            </h3>
            {renderNutritionChart(getDailyPlan(selectedDate)!)}
          </div>
        </>
      )}

      {showDayModal && (
        <DayModal
          date={selectedDate}
          mealTypes={mealTypes}
          dailyPlan={getDailyPlan(selectedDate)}
          onClose={() => {
            setShowDayModal(false);
            fetchWeeklyPlan();
          }}
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
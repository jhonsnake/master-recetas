import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, ChevronRight, Tag } from 'lucide-react';
import { RecipeForm } from './RecipeForm';
import { RecipeDetails } from './RecipeDetails';
import { toast } from 'react-hot-toast';
import type { Recipe, RecipeWithIngredients } from '../../types';

const AVAILABLE_TAGS = ['Desayuno', 'Almuerzo', 'Cena', 'Merienda', 'Snack', 'Postre', 'Bebida', 'Vegetariano', 'Vegano', 'Sin Gluten'];

export function RecipeList() {
  const [recipes, setRecipes] = useState<RecipeWithIngredients[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithIngredients | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    setIsLoading(true);
    try {
      // Fetch from the view that includes live nutrition calculation
      const { data, error } = await supabase
        .from('recipe_with_live_nutrition') // Use the view
        .select('*')
        .order('name');

      if (error) throw error;

      // Map data to ensure consistency, especially with nutrition and ingredients
      const mappedData = data?.map(recipe => ({
        ...recipe,
        // Ensure ingredients array exists, preferring 'ingredients' from the view
        ingredients: recipe.ingredients || recipe.recipe_ingredients || [],
        // Ensure total_nutrition exists, preferring 'live_total_nutrition'
        total_nutrition: recipe.live_total_nutrition || recipe.total_nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 },
        // Ensure porciones exists
        porciones: recipe.porciones ?? recipe.servings ?? 1,
        tags: recipe.tags || [],
        instructions: recipe.instructions || [],
      })) || [];

      setRecipes(mappedData);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast.error('Error al cargar las recetas');
    } finally {
      setIsLoading(false);
    }
  };


  const handleViewDetails = (recipe: RecipeWithIngredients) => {
    setSelectedRecipe(recipe);
    setShowDetails(true);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const filteredRecipes = recipes.filter(recipe => {
    const nameMatch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase());
    const descriptionMatch = recipe.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const ingredientMatch = recipe.ingredients?.some(ing => ing.ingredient_name?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSearch = nameMatch || descriptionMatch || ingredientMatch;

    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every(tag => recipe.tags?.includes(tag));

    return matchesSearch && matchesTags;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto mb-2 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Cargando recetas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Recetas</h1>
        <button
          onClick={() => { setEditingRecipe(null); setShowForm(true); }}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Receta
        </button>
      </div>

      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre, descripción o ingrediente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Tag Filters */}
        <details className="bg-gray-50 rounded-md border border-gray-200">
          <summary className="px-4 py-2 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center justify-between">
            <span>Filtrar por etiquetas ({selectedTags.length} seleccionada{selectedTags.length !== 1 ? 's' : ''})</span>
            {/* Ensure the Chevron rotates on open */}
            <ChevronRight className="w-4 h-4 transform transition-transform ui-open:rotate-90" />
          </summary>
          <div className="p-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 rounded-full text-xs sm:text-sm flex items-center gap-1 border transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </button>
              ))}
              {selectedTags.length > 0 && (
                 <button
                  onClick={() => setSelectedTags([])}
                  className="px-3 py-1 rounded-full text-xs sm:text-sm text-red-700 hover:bg-red-50 border border-red-200 transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        </details>
      </div>

      {/* Recipe Grid / List */}
      {filteredRecipes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {recipes.length === 0 ? 'No hay recetas creadas todavía.' : 'No se encontraron recetas que coincidan con tu búsqueda.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => {
            const servings = recipe.porciones ?? 1;
            const nut = recipe.live_total_nutrition || recipe.total_nutrition || {};
            const nutPerServing = {
              calories: Math.round((nut.calories || 0) / servings),
              protein: Math.round((nut.protein || 0) / servings),
              fat: Math.round((nut.fat || 0) / servings),
              carbs: Math.round((nut.carbs || 0) / servings),
              fiber: Math.round((nut.fiber || 0) / servings),
              sugar: Math.round((nut.sugar || 0) / servings),
            };

            const badge = (label: string, value: string | number, unit: string = '', color: string) => (
              <div className={`flex items-baseline gap-1 text-xs ${color}`}>
                <span className="font-medium min-w-[60px]">{label}:</span>
                <span className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-800 text-sm font-semibold">{value}{unit}</span>
              </div>
            );

            return (
              <div
                key={recipe.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100 flex flex-col overflow-hidden group"
              >
                <img
                  src={recipe.image_url || '/placeholder.jpg'} // Use a placeholder if no image
                  alt={recipe.name}
                  className="w-full h-48 object-cover bg-gray-100 group-hover:opacity-90 transition-opacity"
                  onError={(e) => (e.currentTarget.src = '/placeholder.jpg')} // Fallback placeholder
                />
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 leading-tight">{recipe.name}</h3>
                  {recipe.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{recipe.description}</p>
                  )}
                  {recipe.tags && recipe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {recipe.tags.slice(0, 3).map(tag => ( // Show max 3 tags initially
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100"
                        >
                          {tag}
                        </span>
                      ))}
                      {recipe.tags.length > 3 && (
                         <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium border border-gray-200">
                          +{recipe.tags.length - 3} más
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                    <span>
                      <b>{recipe.ingredients?.length ?? 0}</b> ingrediente{recipe.ingredients?.length !== 1 ? 's' : ''}
                    </span>
                    <span>
                      <b>{servings}</b> porci{servings !== 1 ? 'ones' : 'ón'}
                    </span>
                  </div>

                  {/* Nutrition Info */}
                  <div className="mt-auto pt-3 border-t border-gray-100">
                     <div className="text-xs font-medium text-gray-600 mb-2">Nutrición por porción:</div>
                     <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                        {badge('Calorías', nutPerServing.calories, 'kcal', 'text-orange-700')}
                        {badge('Proteínas', nutPerServing.protein, 'g', 'text-green-700')}
                        {badge('Grasas', nutPerServing.fat, 'g', 'text-yellow-800')}
                        {badge('Carbs', nutPerServing.carbs, 'g', 'text-blue-700')}
                        {badge('Fibra', nutPerServing.fiber, 'g', 'text-purple-700')}
                        {badge('Azúcar', nutPerServing.sugar, 'g', 'text-pink-700')}
                     </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setEditingRecipe(recipe);
                        setShowForm(true);
                      }}
                      className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleViewDetails(recipe)}
                      className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded flex items-center transition-colors"
                    >
                      Ver detalles
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <RecipeForm
          onClose={() => {
            setEditingRecipe(null);
            setShowForm(false);
            fetchRecipes(); // Refetch after closing form
          }}
          editingRecipe={editingRecipe}
        />
      )}

      {showDetails && selectedRecipe && (
        <RecipeDetails
          // Pass the consistent recipe structure
          recipe={selectedRecipe}
          onClose={() => {
            setSelectedRecipe(null);
            setShowDetails(false);
          }}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, ChevronRight, Tag } from 'lucide-react';
import { RecipeForm } from './RecipeForm';
import { RecipeDetails } from './RecipeDetails';
import { toast } from 'react-hot-toast';
import type { Recipe, RecipeWithIngredients } from '../../types';

const AVAILABLE_TAGS = ['Desayuno', 'Almuerzo', 'Cena', 'Merienda', 'Snack'];

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
      const { data, error } = await supabase
        .from('recipe_with_live_nutrition')
        .select('*')
        .order('name');

      if (error) throw error;

      setRecipes(data || []);
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
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase());
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Recetas</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Receta
        </button>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar recetas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TAGS.map(tag => (
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
          ))}
        </div>
      </div>

      {filteredRecipes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontraron recetas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <img
                src={recipe.image_url || 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?w=800'}
                alt={recipe.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {recipe.name}
                </h3>
                {recipe.description && (
                  <p className="text-gray-600 text-sm mb-4">{recipe.description}</p>
                )}

                {recipe.tags && recipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {recipe.tags.map(tag => (
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
                
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Ingredientes:</span>{' '}
                    {recipe.recipe_ingredients ? recipe.recipe_ingredients.length : 0}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Calorías:</span>{' '}
                      {Math.round(recipe.live_total_nutrition?.calories || 0)}
                    </div>
                    <div>
                      <span className="font-medium">Fibra:</span>{' '}
                      {Math.round(recipe.live_total_nutrition?.fiber || 0)}g
                    </div>
                    <div>
                      <span className="font-medium">Proteínas:</span>{' '}
                      {Math.round(recipe.live_total_nutrition?.protein || 0)}g
                    </div>
                    <div>
                      <span className="font-medium">Azúcares:</span>{' '}
                      {Math.round(recipe.live_total_nutrition?.sugar || 0)}g
                    </div>
                    <div>
                      <span className="font-medium">Grasas:</span>{' '}
                      {Math.round(recipe.live_total_nutrition?.fat || 0)}g
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <button
                    onClick={() => {
                      setEditingRecipe(recipe);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-700 flex items-center text-sm font-medium"
                  >
                    Editar receta
                  </button>
                  <button
                    onClick={() => handleViewDetails(recipe)}
                    className="text-blue-600 hover:text-blue-700 flex items-center text-sm font-medium"
                  >
                    Ver detalles
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <RecipeForm
          onClose={() => {
            setEditingRecipe(null);
            setShowForm(false);
            fetchRecipes();
          }}
          editingRecipe={editingRecipe}
        />
      )}

      {showDetails && selectedRecipe && (
        <RecipeDetails
          recipe={{
            ...selectedRecipe,
            ingredients: selectedRecipe.ingredients || selectedRecipe.recipe_ingredients || [],
            instructions: selectedRecipe.instructions || [],
            total_nutrition: selectedRecipe.total_nutrition || selectedRecipe.live_total_nutrition || {
              calories: 0, protein: 0, carbs: 0, fat: 0
            }
          }}
          onClose={() => {
            setSelectedRecipe(null);
            setShowDetails(false);
          }}
        />
      )}
    </div>
  );
}
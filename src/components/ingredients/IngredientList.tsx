import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { Plus, Pencil, Trash2, Search, Tag } from 'lucide-react';
import { IngredientForm } from './IngredientForm';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';

type Ingredient = Database['public']['Tables']['ingredients']['Row'] & {
  unit_equivalences?: Database['public']['Tables']['unit_equivalences']['Row'][];
};

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3';

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

export function IngredientList() {
  const { ingredients, setIngredients } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Limpiar selectedTags si desaparecen de la lista dinámica
  useEffect(() => {
    const ingredientTags = ingredients.flatMap(ing => ing.tags || []);
    const allTags = Array.from(new Set([...SUGGESTED_TAGS, ...ingredientTags]));
    setSelectedTags(prev => prev.filter(tag => allTags.includes(tag)));
    // eslint-disable-next-line
  }, [ingredients]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    setIsLoading(true);
    try {
      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from('ingredients')
        .select('*')
        .order('name');

      if (ingredientsError) {
        throw ingredientsError;
      }

      // Fetch unit equivalences for each ingredient
      const ingredientsWithUnits = await Promise.all(
        (ingredientsData || []).map(async (ingredient) => {
          const { data: unitData } = await supabase
            .from('unit_equivalences')
            .select('*')
            .eq('ingredient_id', ingredient.id);
          
          return {
            ...ingredient,
            unit_equivalences: unitData || []
          };
        })
      );

      setIngredients(ingredientsWithUnits);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      toast.error('Error al cargar los ingredientes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // First, check if the ingredient is used in any recipes
      const { data: recipeIngredients, error: checkError } = await supabase
        .from('recipe_ingredients')
        .select('recipe_id')
        .eq('ingredient_id', id);

      if (checkError) {
        throw checkError;
      }

      if (recipeIngredients && recipeIngredients.length > 0) {
        const confirmDelete = window.confirm(
          `Este ingrediente está siendo usado en ${recipeIngredients.length} receta(s). ¿Estás seguro de que deseas eliminarlo? Esta acción también eliminará el ingrediente de todas las recetas.`
        );

        if (!confirmDelete) return;

        // First delete all recipe_ingredients entries
        const { error: deleteRecipeIngredientsError } = await supabase
          .from('recipe_ingredients')
          .delete()
          .eq('ingredient_id', id);

        if (deleteRecipeIngredientsError) {
          throw deleteRecipeIngredientsError;
        }
      } else {
        if (!confirm('¿Estás seguro de que deseas eliminar este ingrediente?')) return;
      }

      // Buscar el ingrediente para obtener la imagen
      const ingredientToDelete = ingredients.find(ing => ing.id === id);
      // Eliminar imagen de Supabase Storage si no es la imagen por defecto
      if (ingredientToDelete && ingredientToDelete.image_url && !ingredientToDelete.image_url.includes('unsplash.com')) {
        const path = ingredientToDelete.image_url.split('/storage/v1/object/public/ingredients/')[1];
        if (path) {
          await supabase.storage.from('ingredients').remove([path]);
        }
      }

      // Delete unit equivalences first
      const { error: deleteUnitsError } = await supabase
        .from('unit_equivalences')
        .delete()
        .eq('ingredient_id', id);

      if (deleteUnitsError) {
        throw deleteUnitsError;
      }

      // Now delete the ingredient
      const { error: deleteError } = await supabase
        .from('ingredients')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setIngredients(ingredients.filter((ing) => ing.id !== id));
      toast.success('Ingrediente eliminado correctamente');
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      toast.error('Error al eliminar el ingrediente');
    }
  };

  const handleFormClose = async () => {
    setShowForm(false);
    setEditingIngredient(null);
    await fetchIngredients(); // Refresh the list after form closes
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const filteredIngredients = ingredients.filter(ing => {
    const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => ing.tags?.includes(tag));
    return matchesSearch && matchesTags;
  });

  const getImageUrl = (ingredient: Ingredient) => {
    if (!ingredient.image_url) return PLACEHOLDER_IMAGE;
    return ingredient.image_url;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto mb-2 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Cargando ingredientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Ingredientes</h1>
        <button
          onClick={() => {
            setEditingIngredient(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Ingrediente
        </button>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar ingredientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md"
          />
        </div>

        {/* Filtros de etiquetas dinámicos: sugeridas + todas las usadas en ingredientes, sin duplicados */}
        <div className="flex flex-wrap gap-2">
          {(() => {
            const ingredientTags = ingredients.flatMap(ing => ing.tags || []);
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

      {filteredIngredients.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontraron ingredientes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIngredients.map((ingredient) => (
            <div
              key={ingredient.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <img
                src={getImageUrl(ingredient)}
                alt={ingredient.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {ingredient.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4">{ingredient.description}</p>

                {ingredient.tags && ingredient.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {ingredient.tags.map(tag => (
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
                
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700">
                    Tamaño de la porción:
                    <span className="ml-1 font-normal">
                      {ingredient.base_quantity} {ingredient.base_unit}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div>
                    <span className="font-medium">Calorías:</span> {ingredient.calories}
                  </div>
                  <div>
                    <span className="font-medium">Carbohidratos:</span> {ingredient.carbs}g
                  </div>
                  <div>
                    <span className="font-medium">Proteínas:</span> {ingredient.protein}g
                  </div>
                  <div>
                    <span className="font-medium">Grasas:</span> {ingredient.fat}g
                  </div>
                </div>

                {ingredient.unit_equivalences && ingredient.unit_equivalences.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Unidades de referencia:</h4>
                    <div className="space-y-1">
                      {ingredient.unit_equivalences.map((unit, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          1 {unit.unit_name} = {unit.conversion_factor} {ingredient.base_unit}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setEditingIngredient(ingredient);
                      setShowForm(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(ingredient.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <IngredientForm
          onClose={handleFormClose}
          editingIngredient={editingIngredient || undefined}
        />
      )}
    </div>
  );
}
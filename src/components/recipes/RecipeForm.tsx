import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, X, Search, Upload, Link as LinkIcon, Plus, Trash2, Image, Check, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Recipe, Ingredient, RecipeIngredient } from '../../types';

interface RecipeFormProps {
  onClose: () => void;
  editingRecipe?: Recipe;
}

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?w=800';

type ImageSource = 'upload' | 'url' | 'search';

interface RecipeIngredientInput {
  ingredient: Ingredient;
  quantity: number;
  unit_name: string;
  availableUnits: { name: string; conversion_factor: number }[];
}

const AVAILABLE_TAGS = ['Desayuno', 'Almuerzo', 'Cena', 'Merienda', 'Snack'];

export function RecipeForm({ onClose, editingRecipe }: RecipeFormProps) {
  const [formData, setFormData] = useState({
    name: editingRecipe?.name || '',
    description: editingRecipe?.description || '',
    instructions: editingRecipe?.instructions || [''],
    tags: editingRecipe?.tags || []
  });

  const [ingredients, setIngredients] = useState<RecipeIngredientInput[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredIngredients, setFilteredIngredients] = useState<Ingredient[]>([]);
  const [showIngredientSearch, setShowIngredientSearch] = useState(false);

  // Image handling states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>(editingRecipe?.image_url || '');
  const [imageSource, setImageSource] = useState<ImageSource>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingRecipe) {
      loadRecipeIngredients();
    }
  }, [editingRecipe]);

  const loadRecipeIngredients = async () => {
    if (!editingRecipe) return;

    const { data: recipeIngredients, error } = await supabase
      .from('recipe_ingredients')
      .select(`
        quantity,
        unit_name,
        ingredients:ingredient_id (
          *,
          unit_equivalences (*)
        )
      `)
      .eq('recipe_id', editingRecipe.id);

    if (error) {
      toast.error('Error al cargar los ingredientes de la receta');
      return;
    }

    const loadedIngredients = recipeIngredients.map(ri => {
      const ingredient = ri.ingredients;
      const customUnits = ingredient.unit_equivalences?.map(ue => ({
        name: ue.unit_name,
        conversion_factor: ue.conversion_factor
      })) || [];

      return {
        ingredient,
        quantity: ri.quantity,
        unit_name: ri.unit_name,
        availableUnits: [
          { name: ingredient.base_unit, conversion_factor: 1 },
          ...customUnits
        ]
      };
    });

    setIngredients(loadedIngredients);
  };

  const handleTagToggle = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const getConversionText = (item: RecipeIngredientInput) => {
    if (item.unit_name === item.ingredient.base_unit) {
      return null;
    }

    const unit = item.availableUnits.find(u => u.name === item.unit_name);
    if (!unit) return null;

    const convertedQuantity = item.quantity * unit.conversion_factor;
    return `(${convertedQuantity} ${item.ingredient.base_unit})`;
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = availableIngredients.filter(ing => 
        ing.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredIngredients(filtered);
    } else {
      setFilteredIngredients([]);
    }
  }, [searchTerm, availableIngredients]);

  const fetchIngredients = async () => {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*, unit_equivalences(*)');
    
    if (error) {
      toast.error('Error al cargar los ingredientes');
      return;
    }

    setAvailableIngredients(data);
  };

  const handleAddIngredient = (ingredient: Ingredient) => {
    const customUnits = ingredient.unit_equivalences?.map(ue => ({
      name: ue.unit_name,
      conversion_factor: ue.conversion_factor
    })) || [];

    setIngredients([
      ...ingredients,
      {
        ingredient,
        quantity: 1,
        unit_name: ingredient.base_unit,
        availableUnits: [
          { name: ingredient.base_unit, conversion_factor: 1 },
          ...customUnits
        ]
      }
    ]);

    setSearchTerm('');
    setShowIngredientSearch(false);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, field: keyof RecipeIngredientInput, value: any) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = {
      ...newIngredients[index],
      [field]: value
    };
    setIngredients(newIngredients);
  };

  const handleAddInstruction = () => {
    setFormData({
      ...formData,
      instructions: [...formData.instructions, '']
    });
  };

  const handleRemoveInstruction = (index: number) => {
    setFormData({
      ...formData,
      instructions: formData.instructions.filter((_, i) => i !== index)
    });
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...formData.instructions];
    newInstructions[index] = value;
    setFormData({
      ...formData,
      instructions: newInstructions
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB');
      return;
    }

    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
  };

  const uploadImage = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `recipes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('recipes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('recipes')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Error al subir la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/search-images?query=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Error en la búsqueda de imágenes');
      
      const images = await response.json();
      setSearchResults(images);
      
      if (!imageUrl && images.length > 0) {
        setImageUrl(images[0]);
      }
    } catch (error) {
      console.error('Error searching images:', error);
      toast.error('Error al buscar imágenes');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (ingredients.length === 0) {
      setError('Debes agregar al menos un ingrediente');
      return;
    }

    if (formData.instructions.some(i => !i.trim())) {
      setError('Todos los pasos de las instrucciones deben tener contenido');
      return;
    }

    try {
      let finalImageUrl = imageUrl;

      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      }

      const recipeData = {
        ...formData,
        image_url: finalImageUrl || PLACEHOLDER_IMAGE,
        user_id: null,
        instructions: formData.instructions.filter(i => i.trim())
      };

      let recipe;
      if (editingRecipe) {
        const { data, error } = await supabase
          .from('recipes')
          .update(recipeData)
          .eq('id', editingRecipe.id)
          .select()
          .single();

        if (error) throw error;
        recipe = data;

        await supabase
          .from('recipe_ingredients')
          .delete()
          .eq('recipe_id', editingRecipe.id);
      } else {
        const { data, error } = await supabase
          .from('recipes')
          .insert([recipeData])
          .select()
          .single();

        if (error) throw error;
        recipe = data;
      }

      const ingredientInserts = ingredients.map(ing => ({
        recipe_id: recipe.id,
        ingredient_id: ing.ingredient.id,
        quantity: ing.quantity,
        unit_name: ing.unit_name
      }));

      const { error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientInserts);

      if (ingredientsError) throw ingredientsError;

      toast.success(editingRecipe ? 'Receta actualizada correctamente' : 'Receta guardada correctamente');
      onClose();
    } catch (err) {
      console.error('Error saving recipe:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar la receta');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {editingRecipe ? 'Editar Receta' : 'Nueva Receta'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              maxLength={200}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={2}
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.description.length}/200 caracteres
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Etiquetas
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                    formData.tags.includes(tag)
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

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Ingredientes</h3>
              <button
                type="button"
                onClick={() => setShowIngredientSearch(true)}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar
              </button>
            </div>

            {showIngredientSearch && (
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar ingrediente..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                {filteredIngredients.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredIngredients.map((ingredient) => (
                      <button
                        key={ingredient.id}
                        type="button"
                        onClick={() => handleAddIngredient(ingredient)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                      >
                        {ingredient.image_url && (
                          <img
                            src={ingredient.image_url}
                            alt={ingredient.name}
                            className="w-8 h-8 object-cover rounded-full mr-2"
                          />
                        )}
                        <span>{ingredient.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              {ingredients.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
                  <div className="flex-shrink-0">
                    {item.ingredient.image_url && (
                      <img
                        src={item.ingredient.image_url}
                        alt={item.ingredient.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    )}
                  </div>
                  <div className="flex-grow grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cantidad
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleIngredientChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0.01"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unidad
                      </label>
                      <select
                        value={item.unit_name}
                        onChange={(e) => handleIngredientChange(index, 'unit_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      >
                        {item.availableUnits.map((unit) => (
                          <option key={unit.name} value={unit.name}>
                            {unit.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-1 flex items-center">
                      <span className="text-gray-700">{item.ingredient.name}</span>
                    </div>
                    {getConversionText(item) && (
                      <div className="col-span-3 mt-1">
                        <span className="text-sm text-gray-500">
                          {getConversionText(item)}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Instrucciones</h3>
              <button
                type="button"
                onClick={handleAddInstruction}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar paso
              </button>
            </div>

            <div className="space-y-4">
              {formData.instructions.map((instruction, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium">
                    {index + 1}
                  </span>
                  <div className="flex-grow">
                    <textarea
                      value={instruction}
                      onChange={(e) => handleInstructionChange(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={2}
                      placeholder={`Paso ${index + 1}`}
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveInstruction(index)}
                    className="text-red-600 hover:text-red-700"
                    disabled={formData.instructions.length === 1}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Imagen</h3>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setImageSource('upload')}
                className={`flex items-center px-3 py-2 rounded-md ${
                  imageSource === 'upload' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'
                }`}
              >
                <Upload className="w-4 h-4 mr-2" />
                Subir
              </button>
              <button
                type="button"
                onClick={() => setImageSource('url')}
                className={`flex items-center px-3 py-2 rounded-md ${
                  imageSource === 'url' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'
                }`}
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                URL
              </button>
              <button
                type="button"
                onClick={() => setImageSource('search')}
                className={`flex items-center px-3 py-2 rounded-md ${
                  imageSource === 'search' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'
                }`}
              >
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </button>
            </div>

            {imageSource === 'upload' && (
              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full"
                />
                {!imageFile && !imageUrl && (
                  <div className="flex items-center justify-center h-48 bg-gray-100 rounded-md">
                    <Image className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
            )}

            {imageSource === 'url' && (
              <input
                type="url"
                placeholder="https://ejemplo.com/imagen.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            )}

            {imageSource === 'search' && (
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Buscar imágenes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleImageSearch()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <button
                    type="button"
                    onClick={handleImageSearch}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <span className="flex items-center">
                        <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Buscando...
                      </span>
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {searchResults.map((url, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setImageUrl(url)}
                        className={`relative aspect-video overflow-hidden rounded-md transition-all ${
                          url === imageUrl ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:ring-2 hover:ring-blue-300'
                        }`}
                      >
                        <img
                          src={url}
                          alt={`Resultado ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(imageUrl || imageFile) && (
              <div className="relative">
                <img
                  src={imageUrl}
                  alt="Vista previa"
                  className="w-full h-48 object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl('');
                    setImageFile(null);
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              disabled={isUploading}
            >
              {isUploading ? (
                <span className="flex items-center">
                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Guardando...
                </span>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
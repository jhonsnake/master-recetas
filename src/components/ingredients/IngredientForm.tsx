import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, X, Search, Upload, Link as LinkIcon, Plus, Trash2, Image, Check, Tag } from 'lucide-react';
import { units } from '../../constants/units';
import { toast } from 'react-hot-toast';
import type { Ingredient } from '../../types';

interface IngredientFormProps {
  onClose: () => void;
  editingIngredient?: Ingredient;
}

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3';

type ImageSource = 'upload' | 'url' | 'search';

interface CustomUnit {
  name: string;
  conversion_factor: number;
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

export function IngredientForm({ onClose, editingIngredient }: IngredientFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>(editingIngredient?.image_url || '');
  const [imageSource, setImageSource] = useState<ImageSource>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showCustomUnits, setShowCustomUnits] = useState(false);
  const [customUnits, setCustomUnits] = useState<CustomUnit[]>([]);
  const [newUnit, setNewUnit] = useState<CustomUnit>({ name: '', conversion_factor: 1 });
  const [error, setError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  
  const [formData, setFormData] = useState({
    name: editingIngredient?.name || '',
    description: editingIngredient?.description || '',
    base_unit: editingIngredient?.base_unit || '',
    base_quantity: editingIngredient?.base_quantity || 100,
    calories: editingIngredient?.calories || 0,
    carbs: editingIngredient?.carbs || 0,
    fiber: editingIngredient?.fiber || 0,
    sugar: editingIngredient?.sugar || 0,
    fat: editingIngredient?.fat || 0,
    protein: editingIngredient?.protein || 0,
    tags: editingIngredient?.tags || []
  });

  // Load existing custom units when editing
  useEffect(() => {
    if (editingIngredient?.id) {
      loadCustomUnits();
    }
  }, [editingIngredient?.id]);

  const loadCustomUnits = async () => {
    if (!editingIngredient?.id) return;

    try {
      const { data: unitEquivalences, error } = await supabase
        .from('unit_equivalences')
        .select('*')
        .eq('ingredient_id', editingIngredient.id);

      if (error) throw error;

      if (unitEquivalences) {
        setCustomUnits(
          unitEquivalences.map(ue => ({
            name: ue.unit_name,
            conversion_factor: ue.conversion_factor
          }))
        );
      }
    } catch (error) {
      console.error('Error loading custom units:', error);
      toast.error('Error al cargar las unidades personalizadas');
    }
  };

  const handleAddCustomUnit = () => {
    if (newUnit.name && newUnit.conversion_factor > 0) {
      setCustomUnits([...customUnits, newUnit]);
      setNewUnit({ name: '', conversion_factor: 1 });
    }
  };

  const handleRemoveCustomUnit = (index: number) => {
    setCustomUnits(customUnits.filter((_, i) => i !== index));
  };

  const handleTagToggle = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleAddCustomTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
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
      const filePath = `ingredients/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('ingredients')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('ingredients')
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

    try {
      let finalImageUrl = imageUrl;

      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      }

      const ingredientData = {
        ...formData,
        image_url: finalImageUrl || PLACEHOLDER_IMAGE,
        user_id: null
      };

      let ingredientId = editingIngredient?.id;

      if (editingIngredient) {
        // Si la imagen cambió y la anterior no es la de Unsplash, bórrala de Supabase Storage
        if (
          editingIngredient.image_url &&
          editingIngredient.image_url !== finalImageUrl &&
          !editingIngredient.image_url.includes('unsplash.com')
        ) {
          const path = editingIngredient.image_url.split('/storage/v1/object/public/ingredients/')[1];
          if (path) {
            await supabase.storage.from('ingredients').remove([path]);
          }
        }
        // Update existing ingredient
        const { error: updateError } = await supabase
          .from('ingredients')
          .update(ingredientData)
          .eq('id', editingIngredient.id);

        if (updateError) throw updateError;

        // Delete existing unit equivalences
        const { error: deleteUnitsError } = await supabase
          .from('unit_equivalences')
          .delete()
          .eq('ingredient_id', editingIngredient.id);

        if (deleteUnitsError) throw deleteUnitsError;
      } else {
        // Insert new ingredient
        const { data: newIngredient, error: insertError } = await supabase
          .from('ingredients')
          .insert([ingredientData])
          .select()
          .single();

        if (insertError) throw insertError;
        ingredientId = newIngredient.id;
      }

      // Insert custom units if any
      if (showCustomUnits && customUnits.length > 0 && ingredientId) {
        const { error: unitsError } = await supabase
          .from('unit_equivalences')
          .insert(
            customUnits.map(unit => ({
              ingredient_id: ingredientId,
              unit_name: unit.name,
              conversion_factor: unit.conversion_factor
            }))
          );

        if (unitsError) throw unitsError;
      }

      toast.success(editingIngredient ? 'Ingrediente actualizado correctamente' : 'Ingrediente guardado correctamente');
      onClose();
    } catch (err) {
      console.error('Error saving ingredient:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar el ingrediente');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {editingIngredient ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Etiquetas
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {SUGGESTED_TAGS.map(tag => (
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
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Agregar etiqueta personalizada"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomTag();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidad Base
              </label>
              <select
                value={formData.base_unit}
                onChange={(e) => setFormData({ ...formData, base_unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Selecciona una unidad</option>
                {units.map((unit) => (
                  <option key={unit.abbreviation} value={unit.abbreviation}>
                    {unit.name} ({unit.abbreviation})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tamaño de la Porción
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={formData.base_quantity}
                  onChange={(e) => setFormData({ ...formData, base_quantity: parseFloat(e.target.value) || 0 })}
                  min="0.01"
                  step="0.01"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md"
                  required
                />
                <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-600">
                  {formData.base_unit}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Los valores nutricionales corresponden a esta cantidad
              </p>
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Unidades de Referencia</h3>
              <button
                type="button"
                onClick={() => setShowCustomUnits(!showCustomUnits)}
                className={`px-3 py-1 rounded-md text-sm ${
                  showCustomUnits 
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showCustomUnits ? 'Ocultar' : 'Agregar'}
              </button>
            </div>

            {showCustomUnits && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <p className="text-sm text-gray-600">
                  Define unidades de referencia y su equivalencia en la unidad base.
                  Por ejemplo: 1 cucharada = 15 ml
                </p>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la unidad
                    </label>
                    <input
                      type="text"
                      placeholder="ej: cucharada"
                      value={newUnit.name}
                      onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="w-48">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Equivale a
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        placeholder="15"
                        value={newUnit.conversion_factor}
                        onChange={(e) => setNewUnit({ ...newUnit, conversion_factor: parseFloat(e.target.value) || 0 })}
                        min="0.01"
                        step="0.01"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-l-md"
                      />
                      <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-600">
                        {formData.base_unit}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddCustomUnit}
                      disabled={!newUnit.name || newUnit.conversion_factor <= 0}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {customUnits.map((unit, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-3 rounded-md">
                    <div className="flex-1">
                      <span className="font-medium">{unit.name}</span>
                      <span className="text-gray-500 ml-2">
                        (1 {unit.name} = {unit.conversion_factor} {formData.base_unit})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomUnit(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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

          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">
              Información Nutricional
              <span className="text-sm font-normal text-gray-500 ml-2">
                (por {formData.base_quantity} {formData.base_unit})
              </span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Calorías', key: 'calories' },
                { label: 'Carbohidratos', key: 'carbs' },
                { label: 'Fibra', key: 'fiber' },
                { label: 'Azúcar', key: 'sugar' },
                { label: 'Grasas', key: 'fat' },
                { label: 'Proteínas', key: 'protein' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                  </label>
                  <input
                    type="number"
                    value={formData[key as keyof typeof formData]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [key]: parseFloat(e.target.value) || 0,
                      })
                    }
                    min="0"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              ))}
            </div>
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

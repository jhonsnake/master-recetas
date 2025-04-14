import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import type { Person } from '../../types';

interface PersonFormProps {
  onClose: () => void;
  editingPerson?: Person;
}

export function PersonForm({ onClose, editingPerson }: PersonFormProps) {
  const [formData, setFormData] = useState({
    name: editingPerson?.name || '',
    calories: editingPerson?.calories || 0,
    carbs: editingPerson?.carbs || 0,
    fiber: editingPerson?.fiber || 0,
    sugar: editingPerson?.sugar || 0,
    fat: editingPerson?.fat || 0,
    protein: editingPerson?.protein || 0
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const personData = {
        ...formData,
        user_id: null
      };

      if (editingPerson) {
        const { error } = await supabase
          .from('persons')
          .update(personData)
          .eq('id', editingPerson.id);

        if (error) throw error;
        toast.success('Persona actualizada correctamente');
      } else {
        const { error } = await supabase
          .from('persons')
          .insert([personData]);

        if (error) throw error;
        toast.success('Persona agregada correctamente');
      }

      onClose();
    } catch (err) {
      console.error('Error saving person:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar la persona');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {editingPerson ? 'Editar Persona' : 'Nueva Persona'}
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
              disabled={isSubmitting}
            >
              {isSubmitting ? (
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
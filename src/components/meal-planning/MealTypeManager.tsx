import React, { useState } from 'react';
import { X, Plus, GripVertical, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface MealType {
  id: string;
  name: string;
  order: number;
}

interface MealTypeManagerProps {
  mealTypes: MealType[];
  onClose: () => void;
}

export function MealTypeManager({ mealTypes, onClose }: MealTypeManagerProps) {
  const [newMealType, setNewMealType] = useState('');
  const [localMealTypes, setLocalMealTypes] = useState([...mealTypes]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddMealType = async () => {
    if (!newMealType.trim()) return;

    try {
      const { data, error } = await supabase
        .from('meal_types')
        .insert({
          name: newMealType.trim(),
          order: localMealTypes.length + 1
        })
        .select()
        .single();

      if (error) throw error;

      setLocalMealTypes([...localMealTypes, data]);
      setNewMealType('');
      toast.success('Tipo de comida agregado');
    } catch (error) {
      console.error('Error adding meal type:', error);
      toast.error('Error al agregar el tipo de comida');
    }
  };

  const handleDeleteMealType = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este tipo de comida?')) return;

    try {
      const { error } = await supabase
        .from('meal_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLocalMealTypes(localMealTypes.filter(mt => mt.id !== id));
      toast.success('Tipo de comida eliminado');
    } catch (error) {
      console.error('Error deleting meal type:', error);
      toast.error('Error al eliminar el tipo de comida');
    }
  };

  const handleReorder = async (dragIndex: number, dropIndex: number) => {
    const newMealTypes = [...localMealTypes];
    const [draggedItem] = newMealTypes.splice(dragIndex, 1);
    newMealTypes.splice(dropIndex, 0, draggedItem);

    // Update order property
    const updatedMealTypes = newMealTypes.map((mt, index) => ({
      ...mt,
      order: index + 1
    }));

    setLocalMealTypes(updatedMealTypes);

    try {
      const updates = updatedMealTypes.map(mt => ({
        id: mt.id,
        order: mt.order
      }));

      const { error } = await supabase
        .from('meal_types')
        .upsert(updates);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating meal type order:', error);
      toast.error('Error al actualizar el orden');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Gestionar Tipos de Comida</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMealType}
              onChange={(e) => setNewMealType(e.target.value)}
              placeholder="Nuevo tipo de comida"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={handleAddMealType}
              disabled={!newMealType.trim() || isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {localMealTypes.map((mealType, index) => (
              <div
                key={mealType.id}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-md"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', index.toString());
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
                  handleReorder(dragIndex, index);
                }}
              >
                <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                <span className="flex-1">{mealType.name}</span>
                <button
                  onClick={() => handleDeleteMealType(mealType.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Tag } from 'lucide-react';
import type { Database } from '../../types/supabase';

interface IngredientDetailsProps {
  ingredient: Database['public']['Tables']['ingredients']['Row'] & {
    unit_equivalences?: Database['public']['Tables']['unit_equivalences']['Row'][];
  };
  onClose: () => void;
}

export function IngredientDetails({ ingredient, onClose }: IngredientDetailsProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto p-6 pb-2 relative flex flex-col items-center">
        <img
          src={ingredient.image_url || '/placeholder.jpg'}
          alt={ingredient.name}
          className="w-full h-48 object-cover object-center rounded-xl mb-4"
        />
        <h2 className="text-2xl font-bold text-gray-900 mb-1 text-center">{ingredient.name}</h2>
        {ingredient.description && (
          <p className="text-gray-500 text-base mb-2 text-center">{ingredient.description}</p>
        )}
        {ingredient.tags && ingredient.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 justify-center">
            {ingredient.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1"
              >
                <Tag className="w-3 h-3" /> {tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 mb-4 justify-center">
          <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
            <b>{ingredient.base_quantity}</b> {ingredient.base_unit}
          </span>
        </div>
        <div className="my-3 w-full">
          <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 flex flex-col gap-2">
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600">
                <span className="inline-block min-w-[70px]">Calorías:</span>
                <span className="inline-block px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-900 text-sm font-semibold">{ingredient.calories}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                <span className="inline-block min-w-[70px]">Proteínas:</span>
                <span className="inline-block px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-900 text-sm font-semibold">{ingredient.protein}g</span>
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700">
                <span className="inline-block min-w-[70px]">Grasas:</span>
                <span className="inline-block px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-900 text-sm font-semibold">{ingredient.fat}g</span>
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700">
                <span className="inline-block min-w-[70px]">Carbohidratos:</span>
                <span className="inline-block px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-900 text-sm font-semibold">{ingredient.carbs}g</span>
              </span>
            </div>
          </div>
        </div>
        {ingredient.unit_equivalences && ingredient.unit_equivalences.length > 0 && (
          <div className="mb-4 w-full">
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
        <button
          className="mt-6 mb-4 w-full py-2 px-4 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

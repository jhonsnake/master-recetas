import React from 'react';

// Updated props to reflect usage in DayModal
interface PortionModalProps {
  portionRecipe: { // Contains details about the recipe being edited
    mealTypeId: string;
    recipeId: string;
    currentPortions: number;
    recipeName: string;
    recipeBasePortions: number;
  };
  portionCount: number; // The current value in the input field
  setPortionCount: (val: number) => void; // Function to update the input value state
  onCancel: () => void; // Function to call when cancelling
  onConfirm: () => void; // Function to call when confirming/saving
}

const PortionModal: React.FC<PortionModalProps> = ({
  portionRecipe,
  portionCount,
  setPortionCount,
  onCancel,
  onConfirm,
}) => {
  if (!portionRecipe) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold mb-2">Editar Porciones</h3>
        <p className="text-sm text-gray-600 mb-4">Receta: <span className="font-medium">{portionRecipe.recipeName}</span></p>
        <div className="mb-4">
          <label htmlFor="portion-input" className="block text-sm font-medium text-gray-700 mb-1">
            Número de porciones a planificar
          </label>
          <input
            id="portion-input"
            type="number"
            min={1}
            value={portionCount}
            onChange={e => setPortionCount(Math.max(1, parseInt(e.target.value) || 1))} // Ensure value is at least 1
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            autoFocus // Focus the input when the modal opens
          />
           <p className="text-xs text-gray-500 mt-1">
            La receta base tiene {portionRecipe.recipeBasePortions} porción(es).
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
            onClick={onCancel}
          >Cancelar</button>
          <button
            type="button"
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            onClick={onConfirm}
          >Guardar</button>
        </div>
      </div>
    </div>
  );
};

export default PortionModal;

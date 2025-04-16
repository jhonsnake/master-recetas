import React from 'react';

interface PortionModalProps {
  portionRecipe: any;
  portionCount: number;
  setPortionCount: (val: number) => void;
  onCancel: () => void;
  onConfirm: () => void;
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
        <h3 className="text-lg font-semibold mb-4">¿Cuántas porciones quieres agendar?</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Porciones</label>
          <input
            type="number"
            min={1}
            value={portionCount}
            onChange={e => setPortionCount(parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            onClick={onCancel}
          >Cancelar</button>
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            onClick={onConfirm}
          >Agregar</button>
        </div>
      </div>
    </div>
  );
};

export default PortionModal;

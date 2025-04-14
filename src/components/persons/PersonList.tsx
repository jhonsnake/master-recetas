import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PersonForm } from './PersonForm';
import { toast } from 'react-hot-toast';
import type { Person } from '../../types';

export function PersonList() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPersons();
  }, []);

  const fetchPersons = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('persons')
        .select('*')
        .order('name');

      if (error) throw error;
      setPersons(data || []);
    } catch (error) {
      console.error('Error fetching persons:', error);
      toast.error('Error al cargar las personas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta persona?')) return;

    try {
      const { error } = await supabase
        .from('persons')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPersons(persons.filter(person => person.id !== id));
      toast.success('Persona eliminada correctamente');
    } catch (error) {
      console.error('Error deleting person:', error);
      toast.error('Error al eliminar la persona');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPerson(null);
    fetchPersons();
  };

  const filteredPersons = persons.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto mb-2 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Cargando personas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Personas</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Persona
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar personas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md"
        />
      </div>

      {filteredPersons.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontraron personas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPersons.map((person) => (
            <div
              key={person.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {person.name}
                </h3>
                
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div>
                    <span className="font-medium">Calorías:</span> {person.calories}
                  </div>
                  <div>
                    <span className="font-medium">Carbohidratos:</span> {person.carbs}g
                  </div>
                  <div>
                    <span className="font-medium">Fibra:</span> {person.fiber}g
                  </div>
                  <div>
                    <span className="font-medium">Azúcar:</span> {person.sugar}g
                  </div>
                  <div>
                    <span className="font-medium">Grasas:</span> {person.fat}g
                  </div>
                  <div>
                    <span className="font-medium">Proteínas:</span> {person.protein}g
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setEditingPerson(person);
                      setShowForm(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(person.id)}
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
        <PersonForm
          onClose={handleFormClose}
          editingPerson={editingPerson || undefined}
        />
      )}
    </div>
  );
}
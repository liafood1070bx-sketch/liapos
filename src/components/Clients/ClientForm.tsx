import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Client } from '../../types';
import { supabase } from '../../lib/supabase';

interface ClientFormProps {
  client?: Client | null;
  onClose: () => void;
  onSave: () => void;
}

export function ClientForm({ client, onClose, onSave }: ClientFormProps) {
  const { dispatch } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    postal_code: '',
    city: '',
    country: 'Belgique',
    vat_intra: ''
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        address: client.address || '',
        postal_code: client.postal_code || '',
        city: client.city || '',
        country: client.country || 'Belgique',
        vat_intra: client.vat_intra || ''
      });
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (client) {
      const { error } = await supabase
        .from('clients')
        .update(formData)
        .eq('id', client.id);

      if (error) {
        console.error('Error updating client:', error);
      } else {
        dispatch({ type: 'UPDATE_CLIENT', payload: { id: client.id, data: formData } });
        onSave();
      }
    } else {
      // Generate new client code
      const { data: lastClient, error: lastClientError } = await supabase
        .from('clients')
        .select('code')
        .order('code', { ascending: false })
        .limit(1)
        .single();

      let newCode = 'CL0050';
      if (lastClient && lastClient.code) {
        const lastCodeNumber = parseInt(lastClient.code.substring(2), 10);
        newCode = `CL${(lastCodeNumber + 1).toString().padStart(4, '0')}`;
      }

      const newClientData = { ...formData, code: newCode };

      const { data, error } = await supabase
        .from('clients')
        .insert(newClientData)
        .select();

      if (error) {
        console.error('Error creating client:', error);
      } else if (data) {
        dispatch({ type: 'ADD_CLIENT', payload: data[0] });
        onSave();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {client ? 'Modifier le Client' : 'Nouveau Client'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom Client
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              N° TVA
            </label>
            <input
              type="text"
              value={formData.vat_intra}
              onChange={(e) => setFormData({ ...formData, vat_intra: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code Postale
            </label>
            <input
              type="text"
              value={formData.postal_code}
              onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ville
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paye
            </label>
            <input
              type="text"
              value={formData.country}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {client ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
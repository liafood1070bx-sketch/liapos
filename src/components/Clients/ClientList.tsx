import  { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Mail, Phone, MapPin, FileText, RefreshCw, AlertTriangle, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ClientForm } from './ClientForm';
import { supabase } from '../../lib/supabase';

import { Client } from '../../types';

export function ClientList() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nameFilter, setNameFilter] = useState('');
  const [vatFilter, setVatFilter] = useState('');
  const [debouncedNameFilter, setDebouncedNameFilter] = useState('');
  const [debouncedVatFilter, setDebouncedVatFilter] = useState('');

  // Debounce name filter
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedNameFilter(nameFilter);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [nameFilter]);

  // Debounce VAT filter
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedVatFilter(vatFilter);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [vatFilter]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase.from('clients').select('*');

      if (debouncedNameFilter) {
        query = query.ilike('name', `%${debouncedNameFilter}%`);
      }

      if (debouncedVatFilter) {
        query = query.ilike('vat_intra', `%${debouncedVatFilter}%`);
      }

      const { data, error: supabaseError } = await query.order('name', { ascending: true });

      if (supabaseError) throw supabaseError;

      dispatch({ type: 'SET_CLIENTS', payload: data || [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clients');
      console.error('Client fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      dispatch({ type: 'DELETE_CLIENT', payload: clientId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete client');
      console.error('Delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [debouncedNameFilter, debouncedVatFilter]);

  if (loading && state.clients.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto">
          <RefreshCw className="m-auto" />
        </div>
        <p className="mt-2">Chargement des clients...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex flex-col items-center text-center">
            <AlertTriangle className="text-red-500 h-12 w-12 mb-3" />
            <h3 className="mt-2 text-lg font-medium text-red-800 mb-2">Erreur de chargement</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchClients}
              className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-2"
            >
              <RefreshCw size={16} />
              <span>Réessayer</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Clients</h1>
          <p className="text-gray-600 mt-1">Gérez votre base de clients</p>
        </div>
        <button
          onClick={() => {
            setEditingClient(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          disabled={loading}
        >
          <Plus size={20} />
          <span>Nouveau Client</span>
        </button>
      </div>

      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="nameFilter" className="block text-sm font-medium text-gray-700 mb-1">Filtrer par nom</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                id="nameFilter"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full"
                placeholder="Nom du client..."
              />
            </div>
          </div>
          <div>
            <label htmlFor="vatFilter" className="block text-sm font-medium text-gray-700 mb-1">Filtrer par TVA</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                id="vatFilter"
                value={vatFilter}
                onChange={(e) => setVatFilter(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full"
                placeholder="Numéro de TVA..."
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => { setNameFilter(''); setVatFilter(''); }}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors w-full"
            >
              Effacer les filtres
            </button>
          </div>
        </div>
      </div>

      {state.clients.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Aucun client trouvé</h3>
          <p className="mt-1 text-gray-500">Aucun client ne correspond à vos critères de recherche.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {state.clients.map((client) => (
            <div key={client.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{client.name}</h3>
                    {(client as any).company && (
                      <p className="text-sm text-gray-600">{(client as any).company}</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => {
                      setEditingClient(client);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 p-1"
                    disabled={loading}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="text-red-600 hover:text-red-900 p-1"
                    disabled={loading}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {(client as any).email && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail size={16} />
                    <span>{(client as any).email}</span>
                  </div>
                )}
                {(client as any).phone && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone size={16} />
                    <span>{(client as any).phone}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-start space-x-2 text-sm text-gray-600">
                    <MapPin size={16} className="mt-0.5" />
                    <div>
                      <p>{client.address}</p>
                      {client.postal_code && <p>{client.postal_code}</p>}
                    </div>
                  </div>
                )}
                {client.vat_intra && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <FileText size={16} />
                    <span>TVA: {client.vat_intra}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Achats</span>
                  <span className="font-semibold text-green-600">
                    €{(client as any).totalPurchases?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ClientForm
          client={editingClient}
          onClose={() => {
            setShowForm(false);
            setEditingClient(null);
          }}
          onSave={() => {
            fetchClients();
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}
    

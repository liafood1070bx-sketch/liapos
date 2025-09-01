import React, { useState } from 'react';
import { FileText, Plus, Eye, Download, Edit, RefreshCw, AlertTriangle, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InvoiceForm } from './InvoiceForm';
import { InvoicePDF } from './InvoicePDF';

export function InvoiceList() {
  const { state, refreshData } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleEdit = (invoice: any): void => {
    setEditingInvoice(invoice);
    setShowForm(true);
  };

  const handleView = (invoice: any): void => {
    setViewingInvoice(invoice);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingInvoice(null);
  };

  const handleFormSave = () => {
    refreshData();
    setShowForm(false);
    setEditingInvoice(null);
  };

  const getStatusColor = (status: 'paid' | 'sent' | 'overdue' | string): string => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: 'paid' | 'sent' | 'overdue' | string): string => {
    switch (status) {
      case 'paid': return 'Payée';
      case 'sent': return 'Envoyée';
      case 'overdue': return 'Échue';
      default: return 'Brouillon';
    }
  };

  const filteredInvoices = state.invoices.filter(invoice =>
    invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
(invoice as any).client?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (state.loading && state.invoices.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto">
          <RefreshCw className="m-auto" />
        </div>
        <p className="mt-2">Chargement des factures...</p>
      </div>
    );
  }

  console.log('showForm:', showForm);
  console.log('state.loading:', state.loading);

  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Factures</h1>
          <p className="text-gray-600 mt-1">Créez et gérez vos factures</p>
        </div>
        <button
          onClick={() => {
            console.log('Nouvelle Facture button clicked');
            setEditingInvoice(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          disabled={state.loading}
        >
          <Plus size={20} />
          <span>Nouvelle Facture</span>
        </button>
      </div>

      <div className="mb-6 relative">
        <input
          type="text"
          placeholder="Rechercher une facture par numéro ou nom de client..."
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Aucune facture trouvée</h3>
          <p className="mt-1 text-gray-500">Commencez par créer votre première facture</p>
          <div className="mt-6">
            <button
              onClick={() => {
                console.log('Créer une facture button clicked');
                setEditingInvoice(null);
                setShowForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus size={16} className="inline mr-1" />
              Créer une facture
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Facture
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date d'échéance
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="text-blue-600" size={20} />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{invoice.id}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(invoice.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(invoice as any).client?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      €{invoice.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(invoice.due_date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleView(invoice)}
                          className="text-gray-600 hover:text-gray-900 p-1"
                          title="Voir"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(invoice)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Modifier"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleView(invoice)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Télécharger PDF"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <InvoiceForm
          invoice={editingInvoice}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      )}

      {viewingInvoice && (
        <InvoicePDF
          invoice={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Search, Save, ArrowLeft, Calculator, FileText, User, Calendar, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

interface InvoiceItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price_ht: number;
  vat_rate: number;
  price_ttc: number;
  total_ht: number;
  total_ttc: number;
}

interface InvoiceFormProps {
  invoice?: any | null;
  onClose: () => void;
  onSave?: () => void;
}

export function InvoiceForm({ invoice, onClose, onSave }: InvoiceFormProps) {
  const { state } = useApp();
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState(invoice?.client_id || '');
  const [paymentMethod, setPaymentMethod] = useState<'Espèce' | 'Virement bancaire' | 'Versement bancaire'>(
    invoice?.payment_method || 'Espèce'
  );
  const [items, setItems] = useState<InvoiceItem[]>(invoice?.items || []);
  const [searchTerms, setSearchTerms] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (invoice?.items) {
      const initialSearchTerms: { [key: string]: string } = {};
      invoice.items.forEach((item: InvoiceItem) => {
        initialSearchTerms[item.id] = item.product_name;
      });
      setSearchTerms(initialSearchTerms);
    }
  }, [invoice]);
  const [showSuggestions, setShowSuggestions] = useState<{ [key: string]: boolean }>({});
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // New state for the generated invoice number
  const [currentInvoiceNumber, setCurrentInvoiceNumber] = useState<string>(invoice?.id || '');

  // Function to generate the next invoice number
  const generateNextInvoiceNumber = async () => {
    if (invoice) {
      setCurrentInvoiceNumber(invoice.id);
      return;
    }

    const currentYear = new Date().getFullYear().toString().slice(-2);
    let nextNumber = 158; // Starting number for FV0158/25

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('id')
        .order('id', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const lastInvoiceId = data[0].id;
        const parts = lastInvoiceId.match(/^FV(\d{4})\/(\d{2})$/);
        if (parts && parts[2] === currentYear) {
          nextNumber = parseInt(parts[1], 10) + 1;
        }
      }
    } catch (err) {
      console.error('Error fetching last invoice number:', err);
      // Fallback to default if fetching fails
    }

    const formattedNumber = String(nextNumber).padStart(4, '0');
    setCurrentInvoiceNumber(`FV${formattedNumber}/${currentYear}`);
  };

  // Fetch and set invoice number on component mount
  useEffect(() => {
    generateNextInvoiceNumber();
  }, [invoice]); // Re-run if invoice prop changes (for editing existing invoice)

  // Fonction pour obtenir le taux de TVA selon la catégorie
  const getVATRateByCategory = (category: string): number => {
    switch (category?.toLowerCase()) {
      case 'boisson':
      case 'snack':
        return 6.0;
      case 'emballage':
        return 21.0;
      default:
        return 6.0;
    }
  };

  // Ajouter une nouvelle ligne
  const addNewLine = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      product_id: '',
      product_name: '',
      quantity: 1,
      price_ht: 0,
      vat_rate: 6.0,
      price_ttc: 0,
      total_ht: 0,
      total_ttc: 0
    };
    setItems([...items, newItem]);
    setSearchTerms({ ...searchTerms, [newItem.id]: '' });
  };

  // Supprimer une ligne
  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    const newSearchTerms = { ...searchTerms };
    delete newSearchTerms[id];
    setSearchTerms(newSearchTerms);
    const newShowSuggestions = { ...showSuggestions };
    delete newShowSuggestions[id];
    setShowSuggestions(newShowSuggestions);
  };

  // Mettre à jour un item
  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalculer les totaux
        if (field === 'quantity' || field === 'price_ht' || field === 'vat_rate') {
          updatedItem.total_ht = updatedItem.quantity * updatedItem.price_ht;
          updatedItem.price_ttc = updatedItem.price_ht * (1 + updatedItem.vat_rate / 100);
          updatedItem.total_ttc = updatedItem.quantity * updatedItem.price_ttc;
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  // Sélectionner un produit
  const selectProduct = (itemId: string, product: any) => {
    const vatRate = getVATRateByCategory(product.category);
    const priceHT = product.sale_price_ht;
    const priceTTC = priceHT * (1 + vatRate / 100);
    
    const currentItem = items.find(i => i.id === itemId);
    const quantity = currentItem?.quantity || 1;
    
    setItems(items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          product_id: product.id,
          product_name: product.name,
          price_ht: priceHT,
          vat_rate: vatRate,
          price_ttc: priceTTC,
          total_ht: quantity * priceHT,
          total_ttc: quantity * priceTTC
        };
      }
      return item;
    }));
    
    setSearchTerms({ ...searchTerms, [itemId]: product.name });
    setShowSuggestions({ ...showSuggestions, [itemId]: false });
    setFocusedInput(null);
  };

  // Filtrer les produits pour les suggestions
  const getFilteredProducts = (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 1) return [];
    
    return state.products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 20);
  };

  // Gérer le focus et blur des inputs
  const handleInputFocus = (itemId: string) => {
    setFocusedInput(itemId);
    if (searchTerms[itemId]) {
      setShowSuggestions({ ...showSuggestions, [itemId]: true });
    }
  };

  const handleInputBlur = (itemId: string) => {
    // Délai pour permettre le clic sur les suggestions
    setTimeout(() => {
      if (focusedInput === itemId) {
        setShowSuggestions({ ...showSuggestions, [itemId]: false });
        setFocusedInput(null);
      }
    }, 300);
  };

  // Calculer les totaux par taux de TVA
  const calculateVATTotals = () => {
    const vatGroups: { [rate: number]: { totalHT: number; totalTVA: number; totalTTC: number } } = {};
    
    items.forEach(item => {
      if (item.product_id && item.price_ht > 0) {
        if (!vatGroups[item.vat_rate]) {
          vatGroups[item.vat_rate] = { totalHT: 0, totalTVA: 0, totalTTC: 0 };
        }
        
        vatGroups[item.vat_rate].totalHT += item.total_ht;
        vatGroups[item.vat_rate].totalTVA += item.total_ht * (item.vat_rate / 100);
        vatGroups[item.vat_rate].totalTTC += item.total_ttc;
      }
    });
    
    return vatGroups;
  };

  const vatTotals = calculateVATTotals();
  const grandTotalHT = Object.values(vatTotals).reduce((sum, group) => sum + group.totalHT, 0);
  const grandTotalTVA = Object.values(vatTotals).reduce((sum, group) => sum + group.totalTVA, 0);
  const grandTotalTTC = Object.values(vatTotals).reduce((sum, group) => sum + group.totalTTC, 0);

  // Ajouter une ligne vide au démarrage
  useEffect(() => {
    if (items.length === 0) {
      addNewLine();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validItems = items.filter(item => item.product_id && item.price_ht > 0);
    
    if (!selectedClient || validItems.length === 0) {
      alert('Veuillez sélectionner un client et ajouter au moins un article valide');
      return;
    }

    setLoading(true);
    
    try {
      const client = state.clients.find(c => c.id === selectedClient);
      if (!client) throw new Error('Client non trouvé');

      const invoiceData = {
        id: currentInvoiceNumber,
        client_id: selectedClient,
        client_name: client.name,
        items: validItems,
        subtotal: grandTotalHT,
        tax: grandTotalTVA,
        total: grandTotalTTC,
        status: invoice?.status || 'draft',
        payment_method: paymentMethod,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: invoice?.created_at || new Date().toISOString()
      };

      if (invoice) {
        const { error } = await supabase
          .from('invoices')
          .update(invoiceData)
          .eq('id', invoice.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('invoices')
          .insert([invoiceData]);
        
        if (error) throw error;
      }

      if (onSave && typeof onSave === 'function') {
        onSave();
      }
      
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde de la facture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-full max-h-full overflow-y-auto relative">
        <div className="absolute top-2 left-2 z-50">
          <button
            onClick={onClose}
            className="bg-red-600 text-white hover:bg-red-700 hover:text-white p-1 rounded-full transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        {/* En-tête de la modal */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <FileText size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {invoice ? 'Modifier la Facture' : 'Nouvelle Facture'}
                </h2>
                <p className="text-blue-100">Gestion professionnelle de facturation</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-white text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors font-semibold flex items-center space-x-2"
              >
                <Save size={18} />
                <span>{loading ? 'Sauvegarde...' : 'Sauvegarder'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Contenu de la facture */}
        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
          <div className="p-4 bg-gray-50">
            <div className="bg-white rounded-xl shadow-lg max-w-full mx-auto">
              
              {/* En-tête facture */}
              <div className="p-8 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-blue-700">
                      <FileText size={16} />
                      <span>Numéro</span>
                    </label>
                    <input
                      type="text"
                      value={currentInvoiceNumber}
                      onChange={(e) => setCurrentInvoiceNumber(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-blue-700">
                      <Calendar size={16} />
                      <span>Date</span>
                    </label>
                    <input
                      type="date"
                      value={new Date().toISOString().split('T')[0]}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-blue-700">
                      <User size={16} />
                      <span>Client</span>
                    </label>
                    <select
                      value={selectedClient}
                      onChange={(e) => setSelectedClient(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Sélectionner un client</option>
                      {state.clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-blue-700">
                      <Calculator size={16} />
                      <span>Mode de règlement</span>
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as 'Espèce' | 'Virement bancaire' | 'Versement bancaire')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="Espèce">Espèce</option>
                      <option value="Virement bancaire">Virement bancaire</option>
                      <option value="Versement bancaire">Versement bancaire</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tableau des articles */}
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Articles</h3>
                    <button
                      type="button"
                      onClick={addNewLine}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Plus size={16} />
                      <span>Ajouter</span>
                    </button>
                  </div>

                  {/* Conteneur principal avec overflow visible pour les suggestions */}
                  <div className="relative" style={{ overflow: 'visible' }}>
                    {/* Tableau avec overflow-x-auto seulement */}
                    <div className="border border-gray-200 rounded-lg" style={{ overflowX: 'auto', overflowY: 'visible' }}>
                      <table className="w-full min-w-[1200px]">
                        <thead className="bg-blue-600 text-white">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold" style={{ width: '320px' }}>Article</th>
                            <th className="px-4 py-3 text-center font-semibold" style={{ width: '80px' }}>Qté</th>
                            <th className="px-4 py-3 text-right font-semibold" style={{ width: '120px' }}>Prix Unit. HT</th>
                            <th className="px-4 py-3 text-center font-semibold" style={{ width: '80px' }}>TVA</th>
                            <th className="px-4 py-3 text-right font-semibold" style={{ width: '120px' }}>Prix Unit. TTC</th>
                            <th className="px-4 py-3 text-right font-semibold" style={{ width: '120px' }}>Mt Tot HT</th>
                            <th className="px-4 py-3 text-right font-semibold" style={{ width: '120px' }}>Mt Tot TTC</th>
                            <th className="px-4 py-3 text-center font-semibold" style={{ width: '80px' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {items.map((item, index) => (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3" style={{ position: 'relative' }}>
                                <div style={{ position: 'relative' }}>
                                  <input
                                    ref={(el) => inputRefs.current[item.id] = el}
                                    type="text"
                                    value={item.product_name || searchTerms[item.id] || ''}
                                    onChange={(e) => {
                                      const newProductName = e.target.value;
                                      setSearchTerms({ ...searchTerms, [item.id]: newProductName });
                                      updateItem(item.id, 'product_name', newProductName);
                                      setShowSuggestions({ ...showSuggestions, [item.id]: true });
                                    }}
                                    onFocus={() => handleInputFocus(item.id)}
                                    onBlur={() => handleInputBlur(item.id)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Rechercher un produit..."
                                    style={{ width: '300px' }}
                                  />
                                  <Search className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={16} />
                                  
                                  {/* Suggestions avec positionnement fixe */}
                                  {showSuggestions[item.id] && searchTerms[item.id] && getFilteredProducts(searchTerms[item.id]).length > 0 && (
                                    <div 
                                      className="bg-white border-2 border-blue-300 rounded-lg shadow-2xl max-h-80 overflow-y-auto"
                                      style={{ 
                                        position: 'fixed',
                                        zIndex: 9999,
                                        width: '700px',
                                        top: inputRefs.current[item.id] ? 
                                          inputRefs.current[item.id]!.getBoundingClientRect().bottom + 4 + 'px' : 'auto',
                                        left: inputRefs.current[item.id] ? 
                                          inputRefs.current[item.id]!.getBoundingClientRect().left + 'px' : 'auto',
                                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(59, 130, 246, 0.3)',
                                        backgroundColor: '#ffffff'
                                      }}
                                    >
                                      {/* En-tête des suggestions */}
                                      <div className="bg-blue-600 text-white px-4 py-2 text-sm font-semibold sticky top-0">
                                        <div className="grid grid-cols-12 gap-2">
                                          <div className="col-span-4">Libellé</div>
                                          <div className="col-span-2">Code</div>
                                          <div className="col-span-2">Famille</div>
                                          <div className="col-span-2">Prix HT</div>
                                          <div className="col-span-1">TVA</div>
                                          <div className="col-span-1">Stock</div>
                                        </div>
                                      </div>
                                      
                                      {/* Liste des produits */}
                                      {getFilteredProducts(searchTerms[item.id]).map((product, productIndex) => (
                                        <div
                                          key={product.id}
                                          className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-all duration-200"
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            selectProduct(item.id, product);
                                          }}
                                        >
                                          <div className="grid grid-cols-12 gap-2 items-center text-sm">
                                            <div className="col-span-4">
                                              <div className="font-semibold text-gray-900 truncate">{product.name}</div>
                                              {product.brand && (
                                                <div className="text-xs text-gray-500">{product.brand}</div>
                                              )}
                                            </div>
                                            <div className="col-span-2">
                                              <span className="font-medium text-blue-600">{product.code}</span>
                                            </div>
                                            <div className="col-span-2">
                                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                product.category === 'BOISSON' ? 'bg-blue-100 text-blue-800' :
                                                product.category === 'SNACK' ? 'bg-green-100 text-green-800' :
                                                product.category === 'EMBALLAGE' ? 'bg-orange-100 text-orange-800' :
                                                'bg-gray-100 text-gray-800'
                                              }`}>
                                                {product.category}
                                              </span>
                                            </div>
                                            <div className="col-span-2">
                                              <span className="font-bold text-green-600">
                                                {product.sale_price_ht.toFixed(2)}€
                                              </span>
                                            </div>
                                            <div className="col-span-1">
                                              <span className={`text-xs font-medium ${
                                                getVATRateByCategory(product.category) === 6 
                                                  ? 'text-green-600' 
                                                  : 'text-orange-600'
                                              }`}>
                                                {getVATRateByCategory(product.category)}%
                                              </span>
                                            </div>
                                            <div className="col-span-1">
                                              <span className={`text-xs font-medium ${
                                                product.stock > 10 ? 'text-green-600' :
                                                product.stock > 0 ? 'text-orange-600' : 'text-red-600'
                                              }`}>
                                                {product.stock}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                      
                                      {/* Pied de page des suggestions */}
                                      <div className="bg-gray-50 px-4 py-2 text-xs text-gray-600 sticky bottom-0">
                                        {getFilteredProducts(searchTerms[item.id]).length} résultat(s) trouvé(s)
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                              
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                  className="w-full px-2 py-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  min="1"
                                />
                              </td>
                              
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.price_ht}
                                  onChange={(e) => updateItem(item.id, 'price_ht', parseFloat(e.target.value) || 0)}
                                  className="w-full px-2 py-2 border border-gray-300 rounded text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </td>
                              
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                                  item.vat_rate === 6 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-orange-100 text-orange-800'
                                }`}>
                                  {item.vat_rate}%
                                </span>
                              </td>
                              
                              <td className="px-4 py-3 text-right">
                                <span className="font-semibold text-gray-900">{item.price_ttc.toFixed(2)} €</span>
                              </td>
                              
                              <td className="px-4 py-3 text-right">
                                <span className="font-semibold text-gray-900">{item.total_ht.toFixed(2)} €</span>
                              </td>
                              
                              <td className="px-4 py-3 text-right">
                                <span className="font-semibold text-blue-600">{item.total_ttc.toFixed(2)} €</span>
                              </td>
                              
                              <td className="px-4 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Totaux */}
                <div className="flex justify-end ">
                  <div className="w-96 space-y-3">
                    <div className="flex justify-between py-2 text-gray-700 border-b">
                      <span className="font-medium">Total HT:</span>
                      <span className="font-semibold">{grandTotalHT.toFixed(2)} €</span>
                    </div>
                    
                    {Object.entries(vatTotals).map(([rate, details]) => (
                      <div key={rate} className="border-l-4 border-blue-500 pl-3 py-1">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>TVA {rate}%:</span>
                          <span>{details.totalTVA.toFixed(2)} €</span>
                        </div>
                      </div>
                    ))}
                    
                    <div className="border-t-2 border-blue-500 pt-3">
                      <div className="flex justify-between py-2 font-bold text-xl text-gray-900">
                        <span>TOTAL TTC:</span>
                        <span className="text-blue-600">{grandTotalTTC.toFixed(2)} €</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
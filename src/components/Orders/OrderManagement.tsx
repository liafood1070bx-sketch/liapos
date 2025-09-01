import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ClipboardList, Package, Check, Calendar, User, Hash, AlertCircle, RefreshCw, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showErrorToast, showSuccessToast } from '../../utils/toastUtils';
import { Order, OrderItem } from '../../types';

// Sub-component for Order Statistics
const OrderStats: React.FC<{ totalOrders: number; uniqueProducts: number }> = 
  ({ totalOrders, uniqueProducts }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <StatCard 
        title="Total Commandes"
        value={totalOrders}
        icon={<ClipboardList size={24} className="text-white" />}
        bgColor="bg-blue-500"
      />
      <StatCard 
        title="Produits différents"
        value={uniqueProducts}
        icon={<Package size={24} className="text-white" />}
        bgColor="bg-green-500"
      />
      
    </div>
  );

// Sub-component for a single Stat Card
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; bgColor: string }> = 
  ({ title, value, icon, bgColor }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );

// Sub-component for Product Summary
const ProductSummary: React.FC<{ productSummary: any[]; showAllOrders: boolean; onMarkPrepared: () => void; loading: boolean }> = 
  ({ productSummary, showAllOrders, onMarkPrepared, loading }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Résumé des Produits</h2>
        {!showAllOrders && productSummary.length > 0 && (
          <button
            onClick={onMarkPrepared}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Check size={16} />
            <span>Marquer comme Préparées</span>
          </button>
        )}
      </div>

      {productSummary.length === 0 ? (
        <div className="text-center py-8">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Aucune commande</h3>
          <p className="mt-1 text-gray-500">Aucune commande en attente pour cette date ou aucun filtre correspondant</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {productSummary.map((product) => (
            <div key={product.product_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{product.product_name}</h3>
                <p className="text-sm text-gray-600">{product.product_code}</p>
                <p className="text-xs text-gray-500">Dans {product.total_orders} commande(s)</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-600">{product.quantity}</span>
                <p className="text-xs text-gray-500">unités</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

// Sub-component for Detailed Orders List
const DetailedOrdersList: React.FC<{ orders: Order[] }> = ({ orders }) => {
  console.log('DetailedOrdersList - orders received:', orders); // Debug log for received orders
  return (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h2 className="text-xl font-semibold text-gray-900 mb-4">Commandes Détaillées</h2>
    
    {orders.length === 0 ? (
      <div className="text-center py-8">
        <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Aucune commande</h3>
        <p className="mt-1 text-gray-500">Aucune commande en attente pour cette date ou aucun filtre correspondant</p>
      </div>
    ) : (
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {orders.map((order) => (
          <div key={order.id} className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center space-x-2"> {/* Made client name an h3 */}
              <User size={20} className="text-gray-600" /> {/* Slightly larger icon */}
              <span className="text-red-500">{order.client_name || 'Client Inconnu'}</span> {/* Added red color */}
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}
              >
                {order.status === 'pending' ? 'En attente' : 'Préparée'}
              </span>
            </h3>
            <div className="flex items-center justify-between mb-3"> {/* Moved total and time here */}
              <div> {/* Empty div to push total/time to right */}</div>
              <div className="text-right">
                
                <p className="text-xs text-gray-500">
                  {new Date(order.created_at).toLocaleTimeString('fr-FR')}
                </p>
              </div>
            </div>
            
            <div className="space-y-1">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.quantity}x {item.product_name}
                  </span>
                  
                </div>
              ))}
            </div>
            
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                TVA: {order.client_vat_number} • Commande: {order.id}
              </p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);}; // Added closing brace and semicolon

export function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('fr-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')); // Formats to YYYY-MM-DD
  const [clientFilter, setClientFilter] = useState('');
  const [showAllOrders, setShowAllOrders] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase.from('orders').select('*');

      if (!showAllOrders) {
        const startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);

        query = query
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .eq('status', 'pending');
      }

      if (clientFilter) {
        query = query.or(`client_name.ilike.%${clientFilter}%,client_vat_number.ilike.%${clientFilter}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, clientFilter, showAllOrders]);

  const markOrdersPrepared = useCallback(async () => {
    if (orders.length === 0) {
      showErrorToast('Aucune commande à marquer comme préparée.');
      return;
    }

    try {
      setLoading(true);
      
      const orderIds = orders.map(order => order.id);
      console.log('Attempting to mark orders as prepared. Order IDs:', orderIds);
      
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status: 'prepared',
          prepared_at: new Date().toISOString()
        })
        .in('id', orderIds);

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('Supabase update successful. Data:', data);

      showSuccessToast('Commandes marquées comme préparées avec succès!');
      await fetchOrders();
      
    } catch (error) {
      console.error('Error marking orders as prepared:', error);
      showErrorToast(`Erreur lors du marquage des commandes: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  }, [orders, fetchOrders]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const productSummary = useMemo(() => {
    const productMap = new Map();
    orders.forEach(order => {
      order.items.forEach(item => {
        const key = item.product_id;
        if (productMap.has(key)) {
          const existing = productMap.get(key);
          existing.quantity += item.quantity;
          existing.total_orders += 1;
        } else {
          productMap.set(key, {
            product_id: item.product_id,
            product_name: item.product_name,
            product_code: item.product_code,
            quantity: item.quantity,
            total_orders: 1
          });
        }
      });
    });
    return Array.from(productMap.values()).sort((a, b) => b.quantity - a.quantity);
  }, [orders]);

  const totalOrders = orders.length;
// Removed unused totalAmount calculation

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Commandes</h1>
          <p className="text-gray-600 mt-1">Suivi des commandes</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {!showAllOrders && (
            <div className="flex items-center space-x-2">
              <Calendar size={20} className="text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full"
              placeholder="Filtrer par client/TVA..."
            />
          </div>

          <button
            onClick={() => setShowAllOrders(!showAllOrders)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            {showAllOrders ? 'Voir Commandes du Jour' : 'Voir Toutes les Commandes'}
          </button>

          <button
            onClick={fetchOrders}
            disabled={loading}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      <OrderStats 
        totalOrders={totalOrders}
        uniqueProducts={productSummary.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductSummary 
          productSummary={productSummary}
          showAllOrders={showAllOrders}
          onMarkPrepared={markOrdersPrepared}
          loading={loading}
        />
        <DetailedOrdersList orders={orders} />
      </div>

      {!showAllOrders && orders.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <div className="flex items-start space-x-2">
            <AlertCircle size={16} className="text-blue-600 mt-0.5" />
            <div className="text-blue-800 text-sm">
              <p className="font-medium">Information importante:</p>
              <p>Une fois que vous cliquez sur "Marquer comme Préparées", toutes les commandes de cette liste seront supprimées de la vue pour éviter la double préparation.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
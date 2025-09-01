import  { useEffect } from 'react';
import { Package, Users, FileText, TrendingUp, AlertTriangle } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { RecentSalesChart } from './RecentSalesChart';
import { useApp } from '../../context/AppContext';
import { useStockAlerts } from '../../hooks/useStockAlerts';
import { supabase } from '../../lib/supabase'; // Import supabase
export function Dashboard() {

  useEffect(() => {
    const audio = new Audio('data:audio/wav;base64,UklGRlpaCwBXQVZFZm10IBAAAAABAAEARKwAAQAgAZGF0YQAAgAIAAAAAAA=='); // Simple beep sound

    const ordersChannel = supabase
      .channel('orders_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload: { new: any }) => {
        console.log('New order received:', payload.new);
        audio.play();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  const { state } = useApp();
  const totalRevenue = state.sales.reduce((sum, sale) => sum + sale.total, 0);
  const alerts = useStockAlerts();
  const lowStockCount = alerts.length;
  const recentSales = state.sales.slice(-5);

  return (
    <div className="p-2 space-y-2">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
        <p className="text-gray-600 mt-1">Vue d'ensemble de votre activité</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Produits"
          value={state.products.length}
          change="+2 ce mois"
          changeType="positive"
          icon={Package}
          color="bg-blue-500"
        />
        
        <StatsCard
          title="Clients Actifs"
          value={state.clients.length}
          change="+5 ce mois"
          changeType="positive"
          icon={Users}
          color="bg-green-500"
        />
        
        <StatsCard
          title="Factures"
          value={state.invoices.length}
          change="3 en attente"
          changeType="neutral"
          icon={FileText}
          color="bg-orange-500"
        />
        
        <StatsCard
          title="Chiffre d'Affaires"
          value={`€${totalRevenue.toFixed(2)}`}
          change="+12% ce mois"
          changeType="positive"
          icon={TrendingUp}
          color="bg-purple-500"
        />
      </div>

      {lowStockCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="text-red-600" size={20} />
            <span className="text-red-800 font-semibold">
              Alerte Stock: {lowStockCount} produit(s) en rupture ou stock faible
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ventes Récentes</h3>
          <RecentSalesChart sales={recentSales} />
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Produits Populaires</h3>
          <div className="space-y-3">
            {state.products.slice(0, 5).map((product) => (
              <div key={product.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-600">{product.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">€{product.sale_price_ttc}</p>
                  <p className="text-sm text-gray-600">Stock: {product.stock}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section Dernières Commandes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Dernières Commandes</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Commande</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentSales.map((sale: { id: string; client_name: string; created_at: string; status: string }) => (
                <tr key={sale.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sale.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.client_name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(sale.created_at).toLocaleString('fr-FR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })}</td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>);
}

export default Dashboard;

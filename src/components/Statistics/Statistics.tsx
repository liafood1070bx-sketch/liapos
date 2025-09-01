import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useApp } from '../../context/AppContext';

export function Statistics() {
  const { state } = useApp();

  // Données pour le graphique des ventes mensuelles
  const salesData = [
    { month: 'Jan', ventes: 2400 },
    { month: 'Fév', ventes: 1800 },
    { month: 'Mar', ventes: 3200 },
    { month: 'Avr', ventes: 2800 },
    { month: 'Mai', ventes: 3800 },
    { month: 'Juin', ventes: 4500 }
  ];

  // Données pour le graphique des catégories
  const categoryData = state.categories.map(category => {
    const categoryProducts = state.products.filter(p => p.category === category.name);
    const totalValue = categoryProducts.reduce((sum, product) => sum + ((product as any).price * product.stock), 0);
    return {
      name: category.name,
      value: totalValue,
      color: category.color
    };
  });

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
  const totalRevenue = state.sales.reduce((sum, sale) => sum + sale.total, 0);
  const averageOrderValue = totalRevenue / state.sales.length || 0;

  return (
    <div className="p-2 space-y-2">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Statistiques et Rapports</h1>
        <p className="text-gray-600 mt-1">Analysez les performances de votre entreprise</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Chiffre d'Affaires Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">€{totalRevenue.toFixed(2)}</p>
              <p className="text-green-600 text-sm mt-1 flex items-center">
                <TrendingUp size={16} className="mr-1" />
                +12% ce mois
              </p>
            </div>
            <div className="p-3 bg-blue-500 rounded-lg">
              <DollarSign size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Nombre de Ventes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{state.sales.length}</p>
              <p className="text-green-600 text-sm mt-1 flex items-center">
                <TrendingUp size={16} className="mr-1" />
                +8% ce mois
              </p>
            </div>
            <div className="p-3 bg-green-500 rounded-lg">
              <TrendingUp size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Panier Moyen</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">€{averageOrderValue.toFixed(2)}</p>
              <p className="text-red-600 text-sm mt-1 flex items-center">
                <TrendingDown size={16} className="mr-1" />
                -3% ce mois
              </p>
            </div>
            <div className="p-3 bg-orange-500 rounded-lg">
              <DollarSign size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Produits en Stock</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {state.products.reduce((sum, p) => sum + p.stock, 0)}
              </p>
              <p className="text-gray-600 text-sm mt-1">
                {state.products.length} produits
              </p>
            </div>
            <div className="p-3 bg-purple-500 rounded-lg">
              <Package size={24} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution des Ventes</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`€${value}`, 'Ventes']} />
                <Line 
                  type="monotone" 
                  dataKey="ventes" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par Catégorie</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`€${value}`, 'Valeur']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top produits */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Produits les Plus Vendus</h3>
        <div className="space-y-4">
          {state.products.slice(0, 5).map((product, index) => {
            const salesCount = state.sales.filter(sale => sale.productId === product.id).length;
            const revenue = state.sales
              .filter(sale => sale.productId === product.id)
              .reduce((sum, sale) => sum + sale.total, 0);
            
            return (
              <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{salesCount} ventes</p>
                  <p className="text-sm text-gray-600">€{revenue.toFixed(2)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
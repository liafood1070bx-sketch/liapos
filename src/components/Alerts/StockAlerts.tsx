import React from 'react';
import { AlertTriangle, Package, Truck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useStockAlerts } from '../../hooks/useStockAlerts';

export function StockAlerts() {
  const { state } = useApp();
  const alerts = useStockAlerts();

  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
  const lowStockAlerts = alerts.filter(alert => alert.severity === 'low');

  const getAlertColor = (severity: string) => {
    return severity === 'critical' ? 'border-red-500 bg-red-50' : 'border-orange-500 bg-orange-50';
  };

  const getAlertIcon = (severity: string) => {
    return severity === 'critical' ? 'text-red-600' : 'text-orange-600';
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Alertes de Stock</h1>
        <p className="text-gray-600 mt-1">Surveillez les niveaux de stock critiques</p>
      </div>

      {/* Résumé des alertes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Alertes Critiques</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{criticalAlerts.length}</p>
              <p className="text-sm text-gray-600 mt-1">Rupture de stock</p>
            </div>
            <div className="p-3 bg-red-500 rounded-lg">
              <AlertTriangle size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Stock Faible</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{lowStockAlerts.length}</p>
              <p className="text-sm text-gray-600 mt-1">À réapprovisionner</p>
            </div>
            <div className="p-3 bg-orange-500 rounded-lg">
              <Package size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Actions Requises</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{alerts.length}</p>
              <p className="text-sm text-gray-600 mt-1">Commandes à passer</p>
            </div>
            <div className="p-3 bg-blue-500 rounded-lg">
              <Truck size={24} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Liste des alertes */}
      {alerts.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Produits Nécessitant une Attention</h2>
          
          {alerts.map((alert) => {
            const product = state.products.find(p => p.id === alert.productId);
            return (
              <div
                key={alert.id}
                className={`border-l-4 rounded-lg p-4 ${getAlertColor(alert.severity)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle 
                      size={24} 
                      className={getAlertIcon(alert.severity)}
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">{alert.productName}</h3>
                      <p className="text-sm text-gray-600">
                        {product?.category} - Stock actuel: {alert.currentStock} / Minimum: {alert.minStock}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        alert.severity === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {alert.severity === 'critical' ? 'CRITIQUE' : 'ATTENTION'}
                    </span>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                      Commander
                    </button>
                  </div>
                </div>
                
                {alert.severity === 'critical' && (
                  <div className="mt-3 p-3 bg-red-100 rounded-lg">
                    <p className="text-sm text-red-800 font-medium">
                      ⚠️ Ce produit est en rupture de stock ! Commande urgente nécessaire.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <Package size={48} className="text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Tous les stocks sont au niveau optimal !
          </h3>
          <p className="text-green-600">
            Aucune alerte de stock n'est active en ce moment.
          </p>
        </div>
      )}

      {/* Recommandations */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          Recommandations de Gestion de Stock
        </h3>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-start space-x-2">
            <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
            <span>Révisez régulièrement les niveaux de stock minimum selon la demande</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
            <span>Mettez en place des commandes automatiques pour les produits critiques</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
            <span>Analysez les tendances de vente pour optimiser les approvisionnements</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
import React from 'react';
import { Link, useLocation } from 'react-router-dom'; // Corrected import for Link and useLocation
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  FileText, 
  BarChart3, 
  AlertTriangle,
  Settings,
  FileBarChart,
  ClipboardList,
  QrCode
} from 'lucide-react'; // Corrected import for Lucide icons
import { useStockAlerts } from '../../hooks/useStockAlerts';

interface SidebarProps {
  isCollapsed: boolean;
}

const menuItems = [
  { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard, path: '/admin' },
  { id: 'my-app', label: 'Mon App', icon: QrCode, path: '/admin/my-app' },
  { id: 'products', label: 'Produits', icon: Package, path: '/admin/products' },
  { id: 'clients', label: 'Clients', icon: Users, path: '/admin/clients' },
  { id: 'invoices', label: 'Factures', icon: FileText, path: '/admin/invoices' },
  { id: 'reports', label: 'Rapports', icon: FileBarChart, path: '/admin/reports' },
  { id: 'statistics', label: 'Statistiques', icon: BarChart3, path: '/admin/statistics' },
  { id: 'alerts', label: 'Alertes Stock', icon: AlertTriangle, path: '/admin/alerts' },
  { id: 'orders', label: 'Commandes', icon: ClipboardList, path: '/admin/orders' },
  { id: 'settings', label: 'Paramètres', icon: Settings, path: '/admin/settings' }
];

export function Sidebar({ isCollapsed }: SidebarProps) {
  const location = useLocation();
  const alerts = useStockAlerts();

  return (
    <div className="bg-blue-900 text-blue-100 p-4 h-full overflow-y-auto shadow-lg"> {/* Changed background, text, added shadow */}
      <div className="mb-8 text-center">
        {!isCollapsed && (
          <h1 className="text-2xl font-bold text-blue-300">StockManager</h1>
        )}
        {!isCollapsed && (
          <p className="text-blue-200 text-sm">Gestion de Stock Pro</p>
        )}
      </div>
      
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const hasAlerts = item.id === 'alerts' && alerts.length > 0;
          
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center space-x-0' : 'space-x-3'} px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-700 text-white shadow-md' 
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white' 
              }`}
            >
              <Icon size={20} />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
              {hasAlerts && !isCollapsed && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {alerts.length}
                </span>
              )}
              {hasAlerts && isCollapsed && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded-full">
                  {alerts.length}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

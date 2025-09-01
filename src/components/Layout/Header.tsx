import React from 'react';
import { Bell, User, LogOut, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useStockAlerts } from '../../hooks/useStockAlerts';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext'; // Import useApp
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuToggle?: () => void;
  onCollapseToggle?: () => void; // New prop for sidebar collapse
}

export function Header({ onMenuToggle, onCollapseToggle }: HeaderProps) {
  const alerts = useStockAlerts();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { state, clearPendingOrders } = useApp(); // Get state and clearPendingOrders from AppContext

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Use pendingOrdersCount from AppContext
  const totalNotifications = alerts.length + state.pendingOrdersCount;

  const handleBellClick = async () => {
    navigate('/admin/orders'); // Redirect to admin orders page
  };
  
  return (
    <header className="bg-blue-600 shadow-lg px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onMenuToggle && (
            <button 
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <Menu size={24} />
            </button>
          )}
          {onCollapseToggle && (
            <button 
              onClick={onCollapseToggle}
              className="hidden lg:block p-2 rounded-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {/* You might want to change the icon based on sidebar state */}
              <PanelLeftClose size={24} /> 
            </button>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Bell 
              className="text-white cursor-pointer hover:text-blue-200 transition-all duration-200 transform hover:scale-110" 
              size={24} 
              onClick={handleBellClick}
            />
            {totalNotifications > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {totalNotifications}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2 bg-blue-700 rounded-lg px-3 py-2 transition-all duration-200 hover:bg-blue-800">
            <User className="text-white" size={20} />
            <span className="text-white font-medium">Admin</span>
            <button 
              onClick={handleLogout} // Re-added onClick
              className="text-white hover:text-blue-200 transition-all duration-200 p-1 rounded-full transform hover:scale-110"
              title="Déconnexion" // Re-added title attribute
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

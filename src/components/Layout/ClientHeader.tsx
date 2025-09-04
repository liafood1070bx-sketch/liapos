import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ClientHeader() {
  const { profile, logout } = useAuth();
  const location = useLocation();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 md:px-6 md:py-4">
      <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0 md:space-x-4">
        <div className="flex items-center space-x-4">
          <Link
            to="/pos"
            className={`
              text-lg font-bold whitespace-nowrap
              px-4 py-2 rounded-lg
              transition-colors duration-200 ease-in-out
              ${location.pathname === '/pos' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-200 hover:text-blue-600'}
            `}
          >
            POS
          </Link>
          <Link
            to="/order-history"
            className={`
              text-lg whitespace-nowrap
              px-4 py-2 rounded-lg
              transition-colors duration-200 ease-in-out
              ${location.pathname === '/order-history' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-200 hover:text-blue-600'}
            `}
          >
            Order History
          </Link>
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-4">
          {profile && (
            <span className="text-gray-700 font-medium truncate max-w-[120px] md:max-w-none">{profile.name}</span>
          )}
          <button onClick={logout} className="text-red-500 hover:text-red-700 transition-colors text-sm md:text-base">Logout</button>
        </div>
      </div>
    </header>
  );
}

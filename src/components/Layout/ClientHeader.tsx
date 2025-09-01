import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ClientHeader() {
  const { profile, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 md:px-6 md:py-4">
      <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0 md:space-x-4">
        <div className="flex items-center space-x-4">
          <Link to="/pos" className="text-lg font-bold whitespace-nowrap">POS</Link>
          <Link to="/order-history" className="text-lg whitespace-nowrap">Order History</Link>
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

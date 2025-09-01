import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false); // New state for collapse

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const collapseSidebar = () => {
    if (window.innerWidth < 1024) { // Only collapse on smaller screens
      setIsSidebarOpen(false);
    }
    setIsCollapsed(true);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className={`fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'} ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-auto`}>
        <Sidebar isCollapsed={isCollapsed} onLinkClick={collapseSidebar} />
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} onCollapseToggle={toggleCollapse} />
        <main className="flex-1 overflow-y-auto p-2 lg:p-4 bg-white rounded-lg shadow-sm m-1 lg:m-2">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
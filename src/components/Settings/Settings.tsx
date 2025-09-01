import React, { useState, useEffect } from 'react';
import { Save, Upload, Download, Settings as SettingsIcon, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ImportClients } from './ImportClients';
import { ImportProducts } from './ImportProducts';
import CompanySettings from './CompanySettings';

export function Settings() {
  const [activeTab, setActiveTab] = useState('company');

  const tabs = [
    { id: 'company', label: 'Entreprise', icon: Building2 },
    { id: 'import', label: 'Import/Export', icon: Upload }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600 mt-1">Configuration de l'application</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Company Settings */}
      {activeTab === 'company' && (
        <CompanySettings />
      )}

      {/* Import/Export */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          <ImportClients />
          <ImportProducts />
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { Upload, Download, Users, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Client } from '../../types';
import { supabase } from '../../lib/supabase';

export function ImportClients() {
  const { dispatch } = useApp();
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(';').map(h => h.replace(/"/g, '').trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(';').map(v => v.replace(/"/g, '').trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }

    return data;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const csvData = parseCSV(text);
      
      const clients: Omit<Client, 'id' | 'created_at'>[] = [];
      const errors: string[] = [];

      csvData.forEach((row, index) => {
        try {
          if (!row.Code || !row.Nom) {
            errors.push(`Ligne ${index + 2}: Code et Nom requis`);
            return;
          }

          const client: Omit<Client, 'id' | 'created_at'> = {
            code: row.Code,
            name: row.Nom,
            address: row.Adresse || '',
            postal_code: row['Code postal'] || '',
            city: row.Ville || '',
            country: row.Pays || '',
            contact: row.Contact || '',
            phone: row['Téléphones'] || '',
            mobile: row.Mobiles || '',
            fax: row.Fax || '',
            email: row['E-Mail'] || '',
            website: row['Site Web'] || '',
            rib: row.RIB || '',
            balance: parseFloat(row.Solde) || 0,
            initial_balance: parseFloat(row['Solde initial']) || 0,
            vat_intra: row['Tva Intra'] || '',
            siret: row['S.I.R.E.T'] || '',
            ape: row['A.P.E'] || '',
            rcs: row['R.C.S'] || '',
            total_purchases: 0
          };

          clients.push(client);
        } catch (error) {
          errors.push(`Ligne ${index + 2}: Erreur de format`);
        }
      });

      // Insert clients into database
      if (clients.length > 0) {
        const { data, error } = await supabase
          .from('clients')
          .insert(clients)
          .select();

        if (error) {
          throw error;
        }

        if (data) {
          dispatch({ type: 'SET_CLIENTS', payload: data });
        }
      }

      setImportResult({
        success: clients.length,
        errors
      });

    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: 0,
        errors: ['Erreur lors de l\'import du fichier']
      });
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const downloadTemplate = () => {
    const template = `Code;Nom;Adresse;Code postal;Ville;Pays;Contact;Téléphones;Mobiles;Fax;E-Mail;Site Web;RIB;Solde;Solde initial;Tva Intra;S.I.R.E.T;A.P.E;R.C.S
CL0001;"Exemple Client";"123 Rue Example";75001;Paris;France;;"01 23 45 67 89";;;"contact@example.com";;;"0";"0";"FR12345678901";"123456789";"1234Z";"Paris B 123456789"`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_clients.csv';
    link.click();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
        <Users size={20} />
        <span>Import des Clients</span>
      </h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Importez vos clients depuis un fichier CSV
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Format attendu: Code;Nom;Adresse;Code postal;Ville;Pays;Contact;Téléphones;Mobiles;Fax;E-Mail;Site Web;RIB;Solde;Solde initial;Tva Intra;S.I.R.E.T;A.P.E;R.C.S
            </p>
          </div>
          <button
            onClick={downloadTemplate}
            className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 text-sm"
          >
            <Download size={16} />
            <span>Télécharger le modèle</span>
          </button>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={importing}
            className="hidden"
            id="clients-csv-upload"
          />
          <label
            htmlFor="clients-csv-upload"
            className="cursor-pointer flex flex-col items-center space-y-2"
          >
            <Upload size={32} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-900">
              {importing ? 'Import en cours...' : 'Cliquez pour sélectionner un fichier CSV'}
            </span>
            <span className="text-xs text-gray-500">
              Ou glissez-déposez votre fichier ici
            </span>
          </label>
        </div>

        {importResult && (
          <div className={`p-4 rounded-lg ${importResult.errors.length > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
            <div className="flex items-start space-x-2">
              <AlertCircle size={16} className={importResult.errors.length > 0 ? 'text-yellow-600' : 'text-green-600'} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${importResult.errors.length > 0 ? 'text-yellow-800' : 'text-green-800'}`}>
                  Import terminé: {importResult.success} client(s) importé(s)
                </p>
                {importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-yellow-700 font-medium">Erreurs:</p>
                    <ul className="text-xs text-yellow-600 mt-1 space-y-1">
                      {importResult.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
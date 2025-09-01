import React, { useState } from 'react';
import { Upload, Download, Package, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { supabase } from '../../lib/supabase';

export function ImportProducts() {
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
      
      const products: Omit<Product, 'id' | 'created_at' | 'updated_at'>[] = [];
      const errors: string[] = [];

      csvData.forEach((row, index) => {
        try {
          if (!row.Code || !row['Libellé']) {
            errors.push(`Ligne ${index + 2}: Code et Libellé requis`);
            return;
          }

          const product: Omit<Product, 'id' | 'created_at' | 'updated_at'> = {
            code: row.Code,
            name: row['Libellé'],
            description: row['Libellé ticket de caisse'] || row['Désignation'] || '',
            category: row.Famille || 'Divers',
            brand: row.Marque || '',
            purchase_price_ht: parseFloat(row['Prix d\'achat HT']) || 0,
            sale_price_ht: parseFloat(row['Prix de vente HT']) || 0,
            vat_rate: parseFloat(row.Tva) || 6,
            sale_price_ttc: parseFloat(row['Prix de vente TTC']) || 0,
            stock: parseInt(row['Quantité']) || 0,
            weight: parseFloat(row['Poids (Kg)']) || 0,
            unit: row['Unité'] || '',
            observations: row.Observations || '',
            alert_quantity: parseInt(row['Quantité d\'Alerte']) || 0
          };

          products.push(product);
        } catch (error) {
          errors.push(`Ligne ${index + 2}: Erreur de format`);
        }
      });

      // Insert products into database
      if (products.length > 0) {
        const { data, error } = await supabase
          .from('products')
          .insert(products)
          .select();

        if (error) {
          throw error;
        }

        if (data) {
          dispatch({ type: 'SET_PRODUCTS', payload: data });
        }
      }

      setImportResult({
        success: products.length,
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
    const template = `Code;Libellé;Libellé ticket de caisse;Famille;Marque;Prix d'achat HT;Prix de vente HT;Tva;Prix de vente TTC;Quantité;Poids (Kg);Unité;Désignation;Observations;Quantité d'Alerte
ART0001;"Produit Exemple";;"SNACK";"Marque";10.00;12.00;6.00;12.72;100;0.5;"kg";"Produit Exemple";;"10"`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_produits.csv';
    link.click();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
        <Package size={20} />
        <span>Import des Produits</span>
      </h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Importez vos produits depuis un fichier CSV
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Format attendu: Code;Libellé;Libellé ticket de caisse;Famille;Marque;Prix d'achat HT;Prix de vente HT;Tva;Prix de vente TTC;Quantité;Poids (Kg);Unité;Désignation;Observations;Quantité d'Alerte
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
            id="products-csv-upload"
          />
          <label
            htmlFor="products-csv-upload"
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
                  Import terminé: {importResult.success} produit(s) importé(s)
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
import React, { useState } from 'react';
import { FileText, Download, Calendar, Users, Package, Receipt, TrendingUp, Filter } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function Reports() {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState('invoices');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const tabs = [
    { id: 'invoices', label: 'Factures', icon: Receipt },
    { id: 'sales', label: 'Commandes', icon: Receipt }, // New tab for orders/sales
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'products', label: 'Produits', icon: Package },
    { id: 'vat', label: 'TVA', icon: TrendingUp }
  ];

  // Fonction utilitaire pour filtrer par date
  const filterByDate = (items: any[], dateField: string) => {
    return items.filter(item => {
      const itemDate = new Date(item[dateField]);
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo) : null;
      
      if (from && itemDate < from) return false;
      if (to && itemDate > to) return false;
      return true;
    });
  };

  // Rapport des factures
  const generateInvoicesReport = () => {
    const doc = new jsPDF();
    const filteredInvoices = filterByDate(state.invoices, 'created_at')
      .filter(inv => !selectedClient || inv.client_id === selectedClient);

    const company = state.companySettings; // Access company settings

    // Company Info (Top Left)
    doc.setFontSize(10);
    doc.text(company.company_name, 14, 15);
    doc.text(`TVA ${company.vat_number}`, 14, 20);
    doc.text(`${company.address}, ${company.postal_code} ${company.city}`, 14, 25);
    doc.text(`${company.country}`, 14, 30);
    if (company.iban) {
      doc.text(`IBAN ${company.iban}`, 14, 35);
    }

    // Invoice Title (Top Right)
    doc.setFontSize(20);
    doc.text('RAPPORT DES FACTURES', doc.internal.pageSize.width - 14, 20, { align: 'right' });
    doc.setFontSize(12);
    doc.text(`Période: ${dateFrom || 'Début'} - ${dateTo || 'Fin'}`, doc.internal.pageSize.width - 14, 30, { align: 'right' });
    
    let currentY = 40; // Starting Y position for client info

    if (selectedClient) {
      const client = state.clients.find(c => c.id === selectedClient);
      doc.setFontSize(12);
      doc.text(`Client: ${client?.name}`, doc.internal.pageSize.width - 14, currentY, { align: 'right' });
      currentY += 7;
      // Add client VAT if available
      if (client?.vat_intra) {
        doc.text(`TVA Client: ${client.vat_intra}`, doc.internal.pageSize.width - 14, currentY, { align: 'right' });
        currentY += 7;
      }
    }

    // Statistiques
    const totalHT = filteredInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
    const totalTVA = filteredInvoices.reduce((sum, inv) => sum + inv.tax, 0);
    const totalTTC = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);

    const statsStartY = currentY + 10; // Give some space after client info
    doc.setFontSize(14);
    doc.text('Résumé:', 14, statsStartY);
    doc.setFontSize(11);
    doc.text(`Nombre de factures: ${filteredInvoices.length}`, 14, statsStartY + 8);
    doc.text(`Total HT: ${totalHT.toFixed(2)} €`, 14, statsStartY + 16);
    doc.text(`Total TVA: ${totalTVA.toFixed(2)} €`, 14, statsStartY + 24);
    doc.text(`Total TTC: ${totalTTC.toFixed(2)} €`, 14, statsStartY + 32);

    // Adjust table startY
    const tableStartY = statsStartY + 40; // Give some space after statistics

    // Tableau des factures
    const tableData = filteredInvoices.map(invoice => [
      invoice.id,
      invoice.client_name,
      new Date(invoice.created_at).toLocaleDateString('fr-FR'),
      `${invoice.subtotal.toFixed(2)} €`,
      `${invoice.tax.toFixed(2)} €`,
      `${invoice.total.toFixed(2)} €`,
      invoice.status === 'paid' ? 'Payée' : 
      invoice.status === 'sent' ? 'Envoyée' : 
      invoice.status === 'overdue' ? 'Échue' : 'Brouillon'
    ]);

    autoTable(doc, {
      head: [['N° Facture', 'Client', 'Date', 'HT', 'TVA', 'TTC', 'Statut']],
      body: tableData,
      startY: tableStartY, // Use dynamic startY
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    doc.save(`rapport_factures_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Rapport des commandes (Sales)
  const generateOrdersReport = () => {
    const doc = new jsPDF();
    const filteredSales = filterByDate(state.sales, 'created_at');

    console.log('Generating Orders Report. filteredSales:', filteredSales);

    doc.setFontSize(20);
    doc.text('Rapport des Commandes', 14, 20);
    doc.setFontSize(12);
    doc.text(`Période: ${dateFrom || 'Début'} - ${dateTo || 'Fin'}`, 14, 30);

    // Statistiques
    const totalSalesRevenue = filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0);

    doc.setFontSize(14);
    doc.text('Résumé:', 14, 45);
    doc.setFontSize(11);
    doc.text(`Nombre de commandes: ${filteredSales.length}`, 14, 53);
    doc.text(`Chiffre d'affaires total: ${totalSalesRevenue.toFixed(2)} €`, 14, 61);

    // Tableau des commandes
    const tableData = filteredSales.map(sale => [
      sale.id,
      sale.client_name || 'N/A',
      new Date(sale.created_at).toLocaleDateString('fr-FR'),
      `${(sale.total || 0).toFixed(2)} €`,
      sale.status
    ]);

    autoTable(doc, {
      head: [['N° Commande', 'Client', 'Date', 'Total TTC', 'Statut']],
      body: tableData,
      startY: 70,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [22, 163, 74], textColor: 255 }, // Green color for sales
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    doc.save(`rapport_commandes_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Rapport des clients
  const generateClientsReport = () => {
    const doc = new jsPDF();
    const filteredClients = state.clients
      .filter(client => !selectedClient || client.id === selectedClient);

    doc.setFontSize(20);
    doc.text('Rapport des Clients', 14, 20);
    doc.setFontSize(12);
    doc.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);

    // Statistiques
    doc.setFontSize(14);
    doc.text('Résumé:', 14, 45);
    doc.setFontSize(11);
    doc.text(`Nombre de clients: ${filteredClients.length}`, 14, 53);
    doc.text(`Total des achats: ${filteredClients.reduce((sum, c) => sum + c.total_purchases, 0).toFixed(2)} €`, 14, 61);

    // Tableau des clients
    const tableData = filteredClients.map(client => [
      client.name,
      client.email || '-',
      client.phone || '-',
      client.city || '-',
      `${client.total_purchases.toFixed(2)} €`,
      new Date(client.created_at).toLocaleDateString('fr-FR')
    ]);

    autoTable(doc, {
      head: [['Nom', 'Email', 'Téléphone', 'Ville', 'Total Achats', 'Date Création']],
      body: tableData,
      startY: 70,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    doc.save(`rapport_clients_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Rapport des produits
  const generateProductsReport = () => {
    const doc = new jsPDF();
    const filteredProducts = state.products
      .filter(product => !selectedCategory || product.category === selectedCategory)
      .filter(product => !selectedProduct || product.id === selectedProduct);

    doc.setFontSize(20);
    doc.text('Rapport des Produits', 14, 20);
    doc.setFontSize(12);
    doc.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);
    if (selectedCategory) {
      doc.text(`Catégorie: ${selectedCategory}`, 14, 38);
    }

    // Statistiques
    const totalStock = filteredProducts.reduce((sum, p) => sum + p.stock, 0);
    const totalValue = filteredProducts.reduce((sum, p) => sum + (p.sale_price_ht * p.stock), 0);
    const lowStockProducts = filteredProducts.filter(p => p.stock <= (p.alert_quantity || 0));

    doc.setFontSize(14);
    doc.text('Résumé:', 14, 50);
    doc.setFontSize(11);
    doc.text(`Nombre de produits: ${filteredProducts.length}`, 14, 58);
    doc.text(`Stock total: ${totalStock} unités`, 14, 66);
    doc.text(`Valeur du stock: ${totalValue.toFixed(2)} €`, 14, 74);
    doc.text(`Produits en alerte: ${lowStockProducts.length}`, 14, 82);

    // Tableau des produits
    const tableData = filteredProducts.map(product => [
      product.code,
      product.name,
      product.category || '-',
      `${product.sale_price_ht.toFixed(2)} €`,
      `${product.vat_rate}%`,
      `${product.sale_price_ttc.toFixed(2)} €`,
      product.stock.toString(),
      product.stock <= (product.alert_quantity || 0) ? '⚠️' : '✓'
    ]);

    autoTable(doc, {
      head: [['Code', 'Produit', 'Catégorie', 'Prix HT', 'TVA', 'Prix TTC', 'Stock', 'Alerte']],
      body: tableData,
      startY: 90,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [168, 85, 247], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    doc.save(`rapport_produits_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Rapport TVA
  const generateVATReport = () => {
    const doc = new jsPDF();
    const filteredInvoices = filterByDate(state.invoices, 'created_at');

    // Calculer les totaux par taux de TVA
    const vatTotals: { [rate: number]: { totalHT: number; totalTVA: number; totalTTC: number } } = {};
    
    filteredInvoices.forEach(invoice => {
      invoice.items?.forEach((item: any) => {
        const rate = item.vat_rate || 6;
        if (!vatTotals[rate]) {
          vatTotals[rate] = { totalHT: 0, totalTVA: 0, totalTTC: 0 };
        }
        vatTotals[rate].totalHT += item.total_ht || 0;
        vatTotals[rate].totalTVA += (item.total_ht || 0) * (rate / 100);
        vatTotals[rate].totalTTC += item.total_ttc || 0;
      });
    });

    doc.setFontSize(20);
    doc.text('Rapport TVA', 14, 20);
    doc.setFontSize(12);
    doc.text(`Période: ${dateFrom || 'Début'} - ${dateTo || 'Fin'}`, 14, 30);

    // Résumé global
    const grandTotalHT = Object.values(vatTotals).reduce((sum, vat) => sum + vat.totalHT, 0);
    const grandTotalTVA = Object.values(vatTotals).reduce((sum, vat) => sum + vat.totalTVA, 0);
    const grandTotalTTC = Object.values(vatTotals).reduce((sum, vat) => sum + vat.totalTTC, 0);

    doc.setFontSize(14);
    doc.text('Résumé Global:', 14, 45);
    doc.setFontSize(11);
    doc.text(`Total HT: ${grandTotalHT.toFixed(2)} €`, 14, 53);
    doc.text(`Total TVA: ${grandTotalTVA.toFixed(2)} €`, 14, 61);
    doc.text(`Total TTC: ${grandTotalTTC.toFixed(2)} €`, 14, 69);

    // Tableau par taux de TVA
    const tableData = Object.entries(vatTotals).map(([rate, totals]) => [
      `${rate}%`,
      `${totals.totalHT.toFixed(2)} €`,
      `${totals.totalTVA.toFixed(2)} €`,
      `${totals.totalTTC.toFixed(2)} €`
    ]);

    autoTable(doc, {
      head: [['Taux TVA', 'Base HT', 'Montant TVA', 'Total TTC']],
      body: tableData,
      startY: 80,
      styles: { fontSize: 11, cellPadding: 4 },
      headStyles: { fillColor: [245, 158, 11], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    doc.save(`rapport_tva_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateReport = () => {
    switch (activeTab) {
      case 'invoices': generateInvoicesReport(); break;
      case 'sales': generateOrdersReport(); break; // New case for orders/sales report
      case 'clients': generateClientsReport(); break;
      case 'products': generateProductsReport(); break;
      case 'vat': generateVATReport(); break;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Rapports Professionnels</h1>
        <p className="text-gray-600 mt-1">Générez des rapports détaillés par dates, clients, produits et TVA</p>
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

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Filter size={20} />
          <span>Filtres de Rapport</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filtres de date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de début
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de fin
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filtre client */}
          {(activeTab === 'invoices' || activeTab === 'clients') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client
              </label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tous les clients</option>
                {state.clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtre catégorie */}
          {activeTab === 'products' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Toutes les catégories</option>
                <option value="SNACK">SNACK</option>
                <option value="BOISSON">BOISSON</option>
                <option value="EMBALLAGE">EMBALLAGE</option>
              </select>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={generateReport}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Download size={16} />
            <span>Générer le Rapport PDF</span>
          </button>
        </div>
      </div>

      {/* Aperçu des données */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Aperçu des Données</h2>
        
        {activeTab === 'invoices' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-600 text-sm font-medium">Factures</p>
              <p className="text-2xl font-bold text-blue-900">{state.invoices.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-600 text-sm font-medium">Total HT</p>
              <p className="text-2xl font-bold text-green-900">
                {state.invoices.reduce((sum, inv) => sum + inv.subtotal, 0).toFixed(2)} €
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-orange-600 text-sm font-medium">Total TVA</p>
              <p className="text-2xl font-bold text-orange-900">
                {state.invoices.reduce((sum, inv) => sum + inv.tax, 0).toFixed(2)} €
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-purple-600 text-sm font-medium">Total TTC</p>
              <p className="text-2xl font-bold text-purple-900">
                {state.invoices.reduce((sum, inv) => sum + inv.total, 0).toFixed(2)} €
              </p>
            </div>
          </div>
        )}

        {activeTab === 'sales' && ( // New section for sales/orders
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-600 text-sm font-medium">Total Commandes</p>
              <p className="text-2xl font-bold text-blue-900">{state.sales.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-600 text-sm font-medium">Chiffre d'affaires Commandes</p>
              <p className="text-2xl font-bold text-green-900">
                {state.sales.reduce((sum, sale) => sum + sale.total, 0).toFixed(2)} €
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-orange-600 text-sm font-medium">Commandes en attente</p>
              <p className="text-2xl font-bold text-orange-900">
                {state.sales.filter(sale => sale.status === 'pending').length}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-purple-600 text-sm font-medium">Commandes terminées</p>
              <p className="text-2xl font-bold text-purple-900">
                {state.sales.filter(sale => sale.status === 'completed').length}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'clients' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-600 text-sm font-medium">Total Clients</p>
              <p className="text-2xl font-bold text-blue-900">{state.clients.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-600 text-sm font-medium">Clients Actifs</p>
              <p className="text-2xl font-bold text-green-900">
                {state.clients.filter(c => c.total_purchases > 0).length}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-purple-600 text-sm font-medium">CA Total Clients</p>
              <p className="text-2xl font-bold text-purple-900">
                {state.clients.reduce((sum, c) => sum + c.total_purchases, 0).toFixed(2)} €
              </p>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-600 text-sm font-medium">Total Produits</p>
              <p className="text-2xl font-bold text-blue-900">{state.products.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-600 text-sm font-medium">Stock Total</p>
              <p className="text-2xl font-bold text-green-900">
                {state.products.reduce((sum, p) => sum + p.stock, 0)}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-orange-600 text-sm font-medium">Valeur Stock</p>
              <p className="text-2xl font-bold text-orange-900">
                {state.products.reduce((sum, p) => sum + (p.sale_price_ht * p.stock), 0).toFixed(2)} €
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-red-600 text-sm font-medium">Alertes Stock</p>
              <p className="text-2xl font-bold text-red-900">
                {state.products.filter(p => p.stock <= (p.alert_quantity || 0)).length}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'vat' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-600 text-sm font-medium">TVA 6%</p>
              <p className="text-2xl font-bold text-green-900">
                {state.products.filter(p => p.vat_rate === 6).length} produits
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-orange-600 text-sm font-medium">TVA 21%</p>
              <p className="text-2xl font-bold text-orange-900">
                {state.products.filter(p => p.vat_rate === 21).length} produits
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-600 text-sm font-medium">Total Factures</p>
              <p className="text-2xl font-bold text-blue-900">{state.invoices.length}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
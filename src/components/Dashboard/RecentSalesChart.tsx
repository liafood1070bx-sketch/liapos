import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Sale } from '../../types';

interface RecentSalesChartProps {
  sales: Sale[];
}

export function RecentSalesChart({ sales }: RecentSalesChartProps) {
  const chartData = sales.map((sale, index) => ({
    name: `Vente ${index + 1}`,
    montant: sale.total,
    produit: sale.product_name
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip 
            formatter={(value, _name, props) => [
              `€${value}`, 
              'Montant',
              props.payload.produit
            ]}
          />
          <Bar dataKey="montant" fill="#3B82F6" radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
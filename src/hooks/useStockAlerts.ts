import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { StockAlert } from '../types';

export function useStockAlerts() {
  const { state, dispatch } = useApp();

  useEffect(() => {
    const alerts: StockAlert[] = state.products
      .filter(product => product.stock <= product.minStock)
      .map(product => ({
        id: `alert-${product.id}`,
        productId: product.id,
        productName: product.name,
        currentStock: product.stock,
        minStock: product.minStock,
        severity: product.stock === 0 ? 'critical' : 'low'
      }));

    dispatch({ type: 'UPDATE_ALERTS', payload: alerts });
  }, [state.products, dispatch]);

  return state.alerts;
}
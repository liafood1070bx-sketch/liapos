import React, { useState, useEffect } from 'react';
import { Order, Product } from '../../types';
import { supabase } from '../../lib/supabase';
import { showErrorToast, showSuccessToast } from '../../utils/toastUtils';

interface AddProductsModalProps {
  order: Order;
  onClose: () => void;
  onProductsAdded: () => void;
}

export function AddProductsModal({ order, onClose, onProductsAdded }: AddProductsModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<{[key: string]: number}>({});

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase.from('products').select('*');
      if (error) {
        console.error('Error fetching products:', error);
        showErrorToast('Erreur lors de la récupération des produits.');
      } else {
        setProducts(data);
      }
    };
    fetchProducts();
  }, []);

  const handleProductSelection = (productId: string, quantity: number) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: quantity
    }));
  }

  const handleAddProducts = async () => {
    const orderItems = Object.entries(selectedProducts)
      .filter(([, quantity]) => quantity > 0)
      .map(([product_id, quantity]) => ({
        order_id: order.id,
        product_id,
        quantity,
        price_ht: products.find(p => p.id === product_id)?.sale_price_ht || 0 // Use sale_price_ht
      }));

    if (orderItems.length === 0) {
      showErrorToast('Veuillez sélectionner au moins un produit avec une quantité supérieure à 0.');
      return;
    }

    try {
      const { error: insertError } = await supabase.from('invoice_items').insert(orderItems);

      if (insertError) {
        throw insertError;
      }

      // Recalculate total based on current order items and newly added items
      const { data: currentOrderItems, error: fetchError } = await supabase
        .from('invoice_items')
        .select('quantity, price_ht')
        .eq('order_id', order.id);

      if (fetchError) {
        throw fetchError;
      }

      const newTotal = currentOrderItems.reduce((acc, item) => acc + (item.price_ht * item.quantity), 0);

      const { error: updateError } = await supabase.from('orders').update({ total: newTotal }).eq('id', order.id);

      if (updateError) {
        throw updateError;
      }

      showSuccessToast('Produits ajoutés à la commande avec succès !');
      onProductsAdded();
      onClose();
    } catch (error: any) {
      console.error('Error adding products to order:', error);
      showErrorToast(`Erreur lors de l'ajout de produits à la commande : ${error.message}`);
    }
  };

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Ajouter des produits à la commande</h3>
            <div className="mt-2">
              <div className="max-h-60 overflow-y-auto">
                {products.map(product => (
                  <div key={product.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.price} €</p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={selectedProducts[product.id] || ''}
                      className="w-24 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      onChange={(e) => handleProductSelection(product.id, parseInt(e.target.value, 10) || 0)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleAddProducts}
            >
              Ajouter les produits
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

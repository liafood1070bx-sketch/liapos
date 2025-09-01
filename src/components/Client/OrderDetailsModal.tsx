import React, { useState, useEffect } from 'react';
import { Order, OrderItem, Product } from '../../types';
import { supabase } from '../../lib/supabase';

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
}

export function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps) {
  const [orderItems, setOrderItems] = useState<(OrderItem & { products: Product })[]>([]);

  useEffect(() => {
    const fetchOrderItems = async () => {
      const { data, error } = await supabase
        .from('invoice_items')
        .select('*, products(*)')
        .eq('order_id', order.id);

      if (error) {
        console.error('Error fetching order items:', error);
      } else {
        setOrderItems(data as any);
      }
    };
    fetchOrderItems();
  }, [order.id]);

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Détails de la commande
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    <strong>ID de la commande :</strong> {order.id}
                  </p>
                  <p className="text-sm text-gray-500">
                    <strong>Date :</strong> {new Date(order.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    <strong>Statut :</strong> {order.status}
                  </p>
                  <div className="mt-4">
                    <h4 className="text-md font-medium text-gray-800">Articles de la commande</h4>
                    <ul className="divide-y divide-gray-200">
                      {orderItems.map(item => (
                        <li key={item.id} className="py-2 flex justify-between">
                          <span>{item.products.name} x {item.quantity}</span>
                          <span>{(item.products.price * item.quantity).toFixed(2)} €</span>
                        </li>
                      ))}
                    </ul>
                    <div className="text-right mt-2 font-bold">
                      Total : {order.total.toFixed(2)} €
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
import  { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { OrderDetailModal } from './OrderDetailModal';

export function OrderHistory() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateFilter, setSelectedDateFilter] = useState(''); // New state for date filter
  const [editingOrder, setEditingOrder] = useState<any | null>(null); // State for the order being edited
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
  const [viewingOrder, setViewingOrder] = useState<any | null>(null); // State for viewing order details
  const [availableProducts, setAvailableProducts] = useState<any[]>([]); // New state for available products
  const [selectedProductCategory, setSelectedProductCategory] = useState(''); // New state for product category filter
  const [productCategories, setProductCategories] = useState<string[]>([]); // New state for product categories

  const openEditModal = (order: any) => {
    // Deep copy the order to avoid direct state mutation
    setEditingOrder(JSON.parse(JSON.stringify(order)));
    setIsModalOpen(true);
    fetchProducts(); // Fetch products when modal opens
  };

  const closeEditModal = () => {
    setEditingOrder(null);
    setIsModalOpen(false);
  };

  const openDetailModal = (order: any) => {
    setViewingOrder(order);
  };

  const closeDetailModal = () => {
    setViewingOrder(null);
  };

  const fetchOrders = useCallback(async () => {
    if (profile && profile.vat_intra) {
      let query = supabase
        .from('orders')
        .select('*')
        .eq('client_vat_number', profile.vat_intra);

      if (selectedDateFilter) {
        const startDate = new Date(selectedDateFilter);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(selectedDateFilter);
        endDate.setHours(23, 59, 59, 999);

        query = query
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false }); // Sort by newest to oldest

      if (error) {
        console.error('Error fetching orders:', error);
      } else {
        setOrders(data);
      }
    }
    setLoading(false);
  }, [profile, selectedDateFilter]); // Dependencies for useCallback

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('products').select('*');

    if (selectedProductCategory) {
      query = query.eq('category', selectedProductCategory);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setAvailableProducts(data || []);
    }
    setLoading(false);
  }, [selectedProductCategory]);

  const fetchProductCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('category', { distinct: true });

    if (error) {
      console.error('Error fetching product categories:', error);
    } else {
      console.log('Fetched product categories:', data); // Added for debugging
      setProductCategories(data?.map((item: any) => item.category) || []);
    }
  }, []);

  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (!editingOrder) return;
    const updatedItems = [...editingOrder.items];
    if (newQuantity <= 0) {
      // If quantity is 0 or less, remove the item
      handleRemoveItem(index);
      return;
    }
    updatedItems[index].quantity = newQuantity;
    // Recalculate totals for the item (assuming price_ht and vat_rate are available)
    updatedItems[index].total_ht = updatedItems[index].price_ht * newQuantity;
    updatedItems[index].total_ttc = updatedItems[index].total_ht * (1 + updatedItems[index].vat_rate / 100);

    // Recalculate order totals
    const newSubtotal = updatedItems.reduce((sum, item) => sum + item.total_ht, 0);
    const newTax = updatedItems.reduce((sum, item) => sum + (item.total_ht * item.vat_rate / 100), 0);
    const newTotal = newSubtotal + newTax;

    setEditingOrder({
      ...editingOrder,
      items: updatedItems,
      subtotal: newSubtotal,
      tax: newTax,
      total: newTotal,
    });
  };

  const handleRemoveItem = (index: number) => {
    if (!editingOrder) return;
    const updatedItems = editingOrder.items.filter((_: any, i: number) => i !== index);

    // Recalculate order totals
    const newSubtotal = updatedItems.reduce((sum: number, item: { total_ht: number }) => sum + item.total_ht, 0);
    const newTax = updatedItems.reduce((sum: number, item: { total_ht: number, vat_rate: number }) => sum + (item.total_ht * item.vat_rate / 100), 0);
    const newTotal = newSubtotal + newTax;

    setEditingOrder({
      ...editingOrder,
      items: updatedItems,
      subtotal: newSubtotal,
      tax: newTax,
      total: newTotal,
    });
  };

  const handleAddProduct = (product: any) => {
    if (!editingOrder) return;

    const existingItemIndex = editingOrder.items.findIndex(
      (item: any) => item.product_id === product.id
    );

    let updatedItems;
    if (existingItemIndex > -1) {
      // If product already exists, increment quantity
      updatedItems = [...editingOrder.items];
      updatedItems[existingItemIndex].quantity += 1;
      updatedItems[existingItemIndex].total_ht = updatedItems[existingItemIndex].price_ht * updatedItems[existingItemIndex].quantity;
      updatedItems[existingItemIndex].total_ttc = updatedItems[existingItemIndex].total_ht * (1 + updatedItems[existingItemIndex].vat_rate / 100);
    } else {
      // Add new product with quantity 1
      const newItem = {
        product_id: product.id,
        product_name: product.name,
        product_code: product.code,
        price_ht: product.price_ht,
        vat_rate: product.vat_rate,
        quantity: 1,
        total_ht: product.price_ht,
        total_ttc: product.price_ht * (1 + product.vat_rate / 100),
      };
      updatedItems = [...editingOrder.items, newItem];
    }

    // Recalculate order totals
    const newSubtotal = updatedItems.reduce((sum: number, item: { total_ht: number }) => sum + item.total_ht, 0);
    const newTax = updatedItems.reduce((sum: number, item: { total_ht: number, vat_rate: number }) => sum + (item.total_ht * item.vat_rate / 100), 0);
    const newTotal = newSubtotal + newTax;

    setEditingOrder({
      ...editingOrder,
      items: updatedItems,
      subtotal: newSubtotal,
      tax: newTax,
      total: newTotal,
    });
  };

  const saveEditedOrder = async (): Promise<void> => {
    if (!editingOrder || editingOrder.status !== 'pending') return;

    setLoading(true);
    try {
      // Check if the order is still pending and not prepared
      const { data: currentOrder, error: fetchError } = await supabase
        .from('orders')
        .select('status, prepared_at')
        .eq('id', editingOrder.id)
        .single();

      if (fetchError || currentOrder.status !== 'pending' || currentOrder.prepared_at) {
        alert('Order cannot be modified. It might have been prepared or its status changed.');
        setLoading(false);
        closeEditModal();
        return;
      }

      const { error } = await supabase
        .from('orders')
        .update({
          items: editingOrder.items,
          subtotal: editingOrder.subtotal,
          tax: editingOrder.tax,
          total: editingOrder.total,
          updated_at: new Date().toISOString(), // Add an updated_at timestamp
        })
        .eq('id', editingOrder.id);

      if (error) throw error;

      alert('Order updated successfully!');
      closeEditModal();
      fetchOrders(); // Refresh the list of orders
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Failed to save order changes.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      alert('Order cancelled successfully!');
      fetchOrders(); // Refresh the list of orders
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order.');
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    fetchOrders();
    fetchProductCategories(); // Fetch categories on component mount
  }, [fetchOrders, fetchProductCategories]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">My Orders</h1>
      <div className="mb-4 flex items-center space-x-2">
        <label htmlFor="dateFilter" className="font-medium text-gray-700">Filter by Date:</label>
        <input
          type="date"
          id="dateFilter"
          value={selectedDateFilter}
          onChange={(e) => setSelectedDateFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="bg-white shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th> {/* New column for actions */}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap">{order.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(order.created_at).toLocaleDateString()}</td>
                
                <td className="px-6 py-4 whitespace-nowrap">{order.status}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => {
                      console.log('Detail button clicked for order:', order);
                      openDetailModal(order);
                    }}
                    className="text-gray-600 hover:text-gray-900 mr-2"
                  >
                    Detail
                  </button>
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => openEditModal(order)}
                        className="text-blue-600 hover:text-blue-900 mr-2"
                      >
                        Modify
                      </button>
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      
      </div>
    </div> 

   
    {viewingOrder && (
      console.log('Rendering OrderDetailModal with order:', viewingOrder),
      <OrderDetailModal
        order={viewingOrder}
        onClose={closeDetailModal}
      />
    )}

    {isModalOpen && editingOrder && (
<div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold mb-4">Edit Order: {editingOrder.id}</h2>
          <p className="text-gray-600 mb-4">Status: {editingOrder.status}</p>

          <div className="space-y-4 mb-6">
            {editingOrder.items.map((item: any, index: number) => (
              <div key={item.id || index} className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-sm text-gray-500">{item.product_code}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(index, parseInt(e.target.value))}
                    className="w-20 px-2 py-1 border rounded-md text-center"
                  />
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Products Section */}
          <div className="mt-6 p-4 border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold mb-4">Add Products</h3>

            <div className="mb-4">
              <label htmlFor="productCategory" className="block text-sm font-medium text-gray-700">Filter by Category:</label>
              <select
                id="productCategory"
                value={selectedProductCategory}
                onChange={(e) => setSelectedProductCategory(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">All Categories</option>
                {productCategories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2">
              {availableProducts.length === 0 ? (
                <p className="text-gray-500">No products available or matching your filter.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {availableProducts
                    .filter(product => !editingOrder.items.some((item: any) => item.product_id === product.id))
                    .map((product) => (
                      <li key={product.id} className="py-2 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.code}</p>
                        </div>
                        <button
                          onClick={() => handleAddProduct(product)}
                          className="inline-flex items-center justify-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Add
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={closeEditModal}
              className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={saveEditedOrder}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    )
  }
  </>
);
}

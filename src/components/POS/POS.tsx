import  { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2,   Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { OrderItem } from '../../types';
import { useAuth } from '../../context/AuthContext';

export function POS() {
  const { state } = useApp();
  const { profile } = useAuth();
  console.log('POS component rendered. state.products:', state.products);
  console.log('POS component rendered. profile:', profile);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All'); // New state for category filter
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false); // New state for mobile cart visibility

  // Automatically validate client if logged in
  useEffect(() => {
    if (profile && profile.role === 'client') {
      // No need for clientValidated state, just use profile directly
    }
  }, [profile]);

  const uniqueCategories = ['All', ...new Set(state.products.map(product => product.category))];
  console.log('POS component rendered. uniqueCategories:', uniqueCategories);

  const filteredProducts = state.products.filter(product => {
    const matchesSearchTerm = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              product.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearchTerm && matchesCategory;
  });
  console.log('POS component rendered. filteredProducts:', filteredProducts);

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.product_id === product.id);
    
    if (existingItem) {
      updateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const newItem: OrderItem = {
        id: Date.now().toString(),
        product_id: product.id,
        product_name: product.name,
        product_code: product.code,
        quantity: 1,
        price_ht: product.sale_price_ht, // Keep price for backend calculation
        vat_rate: product.vat_rate,     // Keep VAT for backend calculation
        total_ht: product.sale_price_ht,
        total_ttc: product.sale_price_ttc
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart(cart.map(item => {
      if (item.id === itemId) {
        const total_ht = item.price_ht * newQuantity;
        const total_ttc = total_ht * (1 + item.vat_rate / 100);
        return { ...item, quantity: newQuantity, total_ht, total_ttc };
      }
      return item;
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.total_ht, 0);
    const tax = cart.reduce((sum, item) => sum + (item.total_ht * item.vat_rate / 100), 0);
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const submitOrder = async () => {
    if (!profile || profile.role !== 'client' || cart.length === 0) return; // Ensure client is logged in

    setLoading(true);
    try {
      const { subtotal, tax, total } = calculateTotals();
      
      console.log('POS - profile:', profile); // Debug log
      console.log('POS - profile.name:', profile.name); // Debug log

      const orderData = {
        id: `CMD${Date.now()}`,
        client_vat_number: profile.vat_intra, // Use VAT from profile
        client_name: profile.name || '', // Changed from full_name to name
        items: cart,
        subtotal,
        tax,
        total,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      console.log('Submitting order for VAT:', profile.vat_intra);
      const { error } = await supabase
        .from('orders')
        .insert([orderData]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Commande envoyée avec succès!' });
      setCart([]);
      setIsMobileCartOpen(false); // Close cart after successful submission
      
    } catch (error) {
      console.error('Error submitting order:', error);
      setMessage({ type: 'error', text: 'Erreur lors de l\'envoi de la commande' });
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = () => {
    setCart([]);
    setIsMobileCartOpen(false);
  };

// Remove unused destructured values

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-blue-600 text-white p-4 rounded-lg shadow-md transition-all duration-300 ease-in-out hover:bg-blue-700 mb-4">
        <div className="flex justify-between items-center"> {/* Added flex container */}
          <div>
            <h1 className="text-3xl font-bold">Point de Vente</h1>
            <p className="text-blue-100 mt-1">Système de commande pour les clients</p>
          </div>
          {/* Cart Icon for mobile */}
          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="relative lg:hidden p-2 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <ShoppingCart size={28} />
            {cart.length > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
                {cart.length}
              </span>
            )}
          </button>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-200" size={20} />
          <input
            type="text"
            id="product-search"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-300 w-full bg-blue-700 text-white placeholder-blue-200"
          />
        </div>
      </div>

      {/* Message d'alerte */}
      {/* {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${ 
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <AlertCircle size={20} />
          <span>{message.text}</span>
        </div>
      )} */}

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-50px)]"> {/* Changed to flexbox, adjusted height */}
        {/* Section Produits */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-y-auto"> {/* flex-1 to take remaining space */}
          <div className="sticky top-0 z-10 bg-white pb-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Produits</h2>
            <div className="flex flex-wrap gap-2 mt-2"> {/* Container for category buttons */}
              {uniqueCategories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis transition-colors duration-200 ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"> {/* Removed max-h, parent handles overflow */}
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between items-center text-center"
                onClick={() => addToCart(product)}
              >
                <div className="mb-2 max-w-full">
                  <h3 className="font-medium text-gray-900 text-xs whitespace-nowrap overflow-hidden text-ellipsis w-full">{product.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${ 
                    product.category === 'BOISSON' ? 'bg-blue-100 text-blue-800' :
                    product.category === 'SNACK' ? 'bg-green-100 text-green-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {product.category}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{product.code}</p>
                {/* Removed price and stock display */}
              </div>
            ))}
          </div>
        </div>

        {/* Panier */}
        <div className={`fixed inset-0 bg-white z-50 flex flex-col lg:static lg:w-2/5 lg:bg-white lg:rounded-xl lg:shadow-sm lg:border lg:border-gray-200 lg:p-6 lg:sticky lg:top-6 lg:h-[calc(100vh-104px)] lg:overflow-y-auto ${isMobileCartOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
          <div className="flex justify-between items-center p-6 lg:p-0 border-b lg:border-b-0">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <ShoppingCart className="mr-2" size={24} />
              Panier ({cart.length})
            </h2>
            <button
              onClick={() => setIsMobileCartOpen(false)}
              className="lg:hidden p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              <Minus size={24} />
            </button>
          </div>

          <div className="flex-1 p-6 lg:p-0 overflow-y-auto">
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Panier vide</p>
            ) : (
              <>
                <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.product_name}</h4>
                        <p className="text-xs text-gray-600">{item.product_code}</p>
                        {/* Removed item total price */}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 text-gray-500 hover:text-red-600"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 text-gray-500 hover:text-green-600"
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 text-gray-500 hover:text-red-600 ml-2"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Removed total calculations */}

                <button
                  onClick={submitOrder}
                  disabled={cart.length === 0 || loading}
                  className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {loading ? 'Envoi...' : 'Valider la Commande'}
                </button>
                <button
                  onClick={cancelOrder}
                  disabled={cart.length === 0 || loading}
                  className="w-full mt-2 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold hidden lg:block"
                >
                  Annuler
                </button>
              </>
            )}
          </div>
          <div className="p-6 lg:p-0 border-t lg:border-t-0">
            <button
              onClick={cancelOrder}
              className="w-full mt-4 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold lg:hidden"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { createContext, useContext, useReducer, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Client, Product, Category, Invoice, CompanySettings, ClientRegistrationData } from '../types';

// State interface
interface AppState {
  loading: boolean;
  activeView: string;
  clients: Client[];
  products: Product[];
  categories: Category[];
  invoices: Invoice[];
  sales: any[];
  alerts: any[];
  companySettings: CompanySettings;
  pendingOrdersCount: number; // New state for pending orders count
}

// Action types
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ACTIVE_VIEW'; payload: string }
  | { type: 'SET_CLIENTS'; payload: Client[] }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_INVOICES'; payload: Invoice[] }
  | { type: 'SET_SALES'; payload: any[] }
  | { type: 'SET_ALERTS'; payload: any[] }
  | { type: 'SET_COMPANY_SETTINGS'; payload: CompanySettings }
  | { type: 'ADD_CLIENT'; payload: Client }
  | { type: 'UPDATE_CLIENT'; payload: { id: string; data: Partial<Client> } }
  | { type: 'DELETE_CLIENT'; payload: string }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: { id: string; data: Partial<Product> } }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: { id: string; data: Partial<Category> } }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'ADD_INVOICE'; payload: Invoice }
  | { type: 'UPDATE_INVOICE'; payload: { id: string; data: Partial<Invoice> } }
  | { type: 'DELETE_INVOICE'; payload: string }
  | { type: 'SET_PENDING_ORDERS_COUNT'; payload: number }
  | { type: 'CLEAR_PENDING_ORDERS' };

// Context type
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  refreshData: () => Promise<void>;
  playNotificationSound: () => void;
  clearPendingOrders: () => Promise<void>;
  createNewClient: (clientData: ClientRegistrationData) => Promise<void>; // New function
}

// Default company settings
const defaultCompanySettings: CompanySettings = {
  id: '1',
  company_name: 'LIA FOOD SRL',
  address: 'RUE DE FIERLANT 120', // Mapped to address
  postal_code: '1190',
  city: 'FOREST',
  country: 'BRUXELLES',
  phone: 'N/A', // Phone not provided, using N/A
  email: 'N/A', // Email not provided, using N/A
  website: '',
  siret: 'N/A', // Siret not provided, using N/A
  ape_code: 'N/A', // APE not provided, using N/A
  vat_number: 'BE10 1540 8965', // Mapped to vat_number
  iban: 'BE31 0689 5398 8155', // Added IBAN
  logo_url: '',
  primary_color: '#3B82F6', // Default blue
  secondary_color: '#10B981', // Default green
  created_at: new Date(),
  updated_at: new Date()
};

// Default categories
const defaultCategories: Category[] = [
  { 
    id: '1', 
    name: 'Boisson', 
    description: 'Boisson généraux',
    color: '#3B82F6', // Default blue color
    created_at: new Date()
  },
  { 
    id: '2', 
    name: 'Emballage', 
    description: 'Emballage proposés',
    color: '#10B981', // Default green color
    created_at: new Date()
  },
  { 
    id: '3', 
    name: 'Snack', 
    description: 'Snack et Sauces',
    color: '#F59E0B', // Default amber color
    created_at: new Date()
  }
];

// Initial state
const initialState: AppState = {
  loading: true,
  activeView: 'dashboard',
  clients: [],
  products: [],
  categories: defaultCategories,
  invoices: [],
  sales: [],
  alerts: [],
  companySettings: defaultCompanySettings,
  pendingOrdersCount: 0, // Initialize pending orders count
};

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ACTIVE_VIEW':
      return { ...state, activeView: action.payload };
    case 'SET_CLIENTS':
      return { ...state, clients: action.payload };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_INVOICES':
      return { ...state, invoices: action.payload };
    case 'SET_SALES':
      return { ...state, sales: action.payload };
    case 'SET_ALERTS':
      return { ...state, alerts: action.payload };
    case 'SET_COMPANY_SETTINGS':
      return { ...state, companySettings: action.payload };
    case 'ADD_CLIENT':
      return { ...state, clients: [...state.clients, action.payload] };
    case 'UPDATE_CLIENT':
      return {
        ...state,
        clients: state.clients.map(client =>
          client.id === action.payload.id
            ? { ...client, ...action.payload.data }
            : client
        )
      };
    case 'DELETE_CLIENT':
      return {
        ...state,
        clients: state.clients.filter(client => client.id !== action.payload)
      };
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload] };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(product =>
          product.id === action.payload.id
            ? { ...product, ...action.payload.data }
            : product
        )
      };
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(product => product.id !== action.payload)
      };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(category =>
          category.id === action.payload.id
            ? { ...category, ...action.payload.data }
            : category
        )
      };
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(category => category.id !== action.payload)
      };
    case 'ADD_INVOICE':
      return { ...state, invoices: [action.payload, ...state.invoices] };
    case 'UPDATE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.map(invoice =>
          invoice.id === action.payload.id
            ? { ...invoice, ...action.payload.data }
            : invoice
        )
      };
    case 'DELETE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.filter(invoice => invoice.id !== action.payload)
      };
    case 'SET_PENDING_ORDERS_COUNT': // New case for pending orders count
      return { ...state, pendingOrdersCount: action.payload };
    default:
      return state;
  }
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const audioRef = useRef<HTMLAudioElement>(null); // Audio ref

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(error => {
        // Optionally, show a toast notification to the user
        // For example, if you have a toast utility:
        // showErrorToast("Impossible de jouer la notification sonore. Veuillez interagir avec la page.");
      });
    }
  };

  const isSupabaseConfigured = () => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!url || !key || url === 'your-project-url' || key === 'your-anon-key') {
      return false;
    }
    
    return true;
  };

  const fetchPendingOrdersCount = async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) throw error;
      dispatch({ type: 'SET_PENDING_ORDERS_COUNT', payload: count || 0 });
    } catch (error) {
    }
  };

  const loadData = async () => {
    if (!isSupabaseConfigured()) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Load company settings
      try {
        const { data: settingsData, error: settingsError } = await supabase
          .from('company_settings')
          .select('*')
          .maybeSingle();

        if (!settingsError && settingsData) {
          dispatch({ type: 'SET_COMPANY_SETTINGS', payload: settingsData });
        }
      } catch (error) {
        console.warn('Company settings table not found, using defaults');
      }

      // Load categories
      try {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name', { ascending: true });

        if (!categoriesError && categoriesData) {
          dispatch({ type: 'SET_CATEGORIES', payload: categoriesData });
        }
      } catch (error) {
        console.warn('Categories table not found, using defaults');
      }

      // Load clients
      try {
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .order('name', { ascending: true });

        if (!clientsError && clientsData) {
          dispatch({ type: 'SET_CLIENTS', payload: clientsData });
        }
      } catch (error) {
        console.warn('Clients table not found, using empty array');
      }

      // Load products
      try {
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .order('name', { ascending: true });

        if (!productsError && productsData) {
          dispatch({ type: 'SET_PRODUCTS', payload: productsData });
        }
      } catch (error) {
        console.warn('Products table not found, using empty array');
      }

      // Load invoices
      try {
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('invoices')
          .select('*, client:clients(*)')
          .order('created_at', { ascending: false });

        if (!invoicesError && invoicesData) {
          dispatch({ type: 'SET_INVOICES', payload: invoicesData });
        }
      } catch (error) {
        console.warn('Invoices table not found, using empty array');
        dispatch({ type: 'SET_INVOICES', payload: [] });
      }

      // Load sales (orders)
      try {
        const { data: salesData, error: salesError } = await supabase
          .from('orders') // Assuming 'orders' table stores sales data
          .select('*')
          .order('created_at', { ascending: false });

        if (!salesError && salesData) {
          dispatch({ type: 'SET_SALES', payload: salesData });
        }
      } catch (error) {
        console.warn('Orders table not found, using empty array for sales');
        dispatch({ type: 'SET_SALES', payload: [] });
      }

      await fetchPendingOrdersCount(); // Fetch count on initial load

    } catch (error) {
      console.error('loadData: Network error loading data:', error);
    } finally {
      console.log('loadData: finally block, setting loading to false');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const refreshData = async () => {
    await loadData();
  };

  useEffect(() => {
    loadData();

    // Real-time subscription for new orders
    const ordersChannel = supabase
      .channel('app_orders_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload: { new: any }) => {
        console.log('New order received in AppContext:', payload.new);
        // Add the new order to the sales state
        dispatch({
          type: 'SET_SALES',
          payload: [payload.new, ...state.sales],
        });
        playNotificationSound(); // Play sound on new order
        fetchPendingOrdersCount(); // Update count on new order
      })
      ?.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload: { old: { status: string }, new: { status: string } }) => {
        // If an order status changes, re-fetch pending count
        if (payload.old.status === 'pending' && payload.new.status !== 'pending') {
          fetchPendingOrdersCount();
        } else if (payload.old.status !== 'pending' && payload.new.status === 'pending') {
          fetchPendingOrdersCount();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  const clearPendingOrders = async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'prepared' }) // Update status to 'prepared'
        .eq('status', 'pending'); // Only update pending orders

      if (error) throw error;
      await fetchPendingOrdersCount(); // Re-fetch count after clearing
    } catch (error) {
      console.error('Error clearing pending orders:', error);
    }
  };

  const createNewClient = async (clientData: Omit<Client, 'id'>) => {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured.');
    try {
      // Generate a simple code for the client (e.g., first 3 letters of name + random number)
      const clientCode = `${(clientData.name || 'XXX').substring(0, 3).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;

      const { data, error } = await supabase
        .from('clients')
        .insert([
          {
            code: clientCode,
            name: clientData.name,
            address: clientData.address,
            postal_code: clientData.postal_code,
            city: clientData.city,
            country: clientData.country,
            mobile: clientData.mobile,
            vat_intra: clientData.vat_intra,
          }
        ])
        .select();

      if (error) {
        // Check for unique constraint violation (e.g., VAT number already exists)
        if (error.code === '23505') { // PostgreSQL unique_violation error code
          throw new Error('Un client avec ce numéro de TVA ou cet email existe déjà.');
        }
        throw error;
      }

      if (data && data.length > 0) {
        dispatch({ type: 'ADD_CLIENT', payload: data[0] });
      }
    } catch (error) {
      console.error('Error creating new client:', error);
      throw error;
    }
  };

  const value: AppContextType = {
    state,
    dispatch,
    refreshData,
    playNotificationSound, // Expose the function
    clearPendingOrders, // Expose the function
    createNewClient: (clientData: ClientRegistrationData) => createNewClient(clientData as Omit<Client, 'id'>), // Expose the function with correct type
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      <audio ref={audioRef} src="/notification.mp3" preload="auto" /> {/* Audio element */}
    </AppContext.Provider>
  );
}

// Hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}


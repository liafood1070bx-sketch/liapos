import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase: any;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Using mock client.')
  console.warn('Please create a .env file with:')
  console.warn('VITE_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"')
  console.warn('VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"')
  
  // Create a comprehensive mock client that prevents fetch errors
  const mockResponse = { data: [], error: null };
  const mockSingleResponse = { data: null, error: null };
  
  supabase = {
    from: () => ({
      select: () => Promise.resolve(mockResponse),
      insert: () => Promise.resolve(mockResponse),
      update: () => Promise.resolve(mockResponse),
      delete: () => Promise.resolve(mockResponse),
      single: () => Promise.resolve(mockSingleResponse),
      maybeSingle: () => Promise.resolve(mockSingleResponse),
      order: function() { return this; },
      eq: function() { return this; },
      limit: function() { return this; }
    }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signIn: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null })
    }
  };
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    // Fallback to mock client if creation fails
    const mockResponse = { data: [], error: null };
    const mockSingleResponse = { data: null, error: null };
    
    supabase = {
      from: () => ({
        select: () => Promise.resolve(mockResponse),
        insert: () => Promise.resolve(mockResponse),
        update: () => Promise.resolve(mockResponse),
        delete: () => Promise.resolve(mockResponse),
        single: () => Promise.resolve(mockSingleResponse),
        maybeSingle: () => Promise.resolve(mockSingleResponse),
        order: function() { return this; },
        eq: function() { return this; },
        limit: function() { return this; }
      }),
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signIn: () => Promise.resolve({ data: null, error: null }),
        signOut: () => Promise.resolve({ error: null })
      }
    };
  }
}

export { supabase }
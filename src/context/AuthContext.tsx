
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null;
  loading: boolean;
  loginWithPassword: (email: string, password: string) => Promise<any>;
  loginWithVat: (vatNumber: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSessionAndProfile = async (currentSession: Session | null) => {
      if (currentSession?.user) {
        // Check if profile is already set and is a client profile (from VAT login)
        // If so, don't try to fetch from 'profiles' table
        if (profile && profile.role === 'client') {
          setLoading(false);
          return;
        }

        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentSession.user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setProfile(null);
        } else {
          setProfile(profileData);
        }
      } else {
        // If no session user, clear profile unless it's a client profile
        if (profile?.role !== 'client') {
          setProfile(null);
        }
      }
      setLoading(false);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(true); // Set loading true while fetching profile
      getSessionAndProfile(session);
    });

    // Initial session and profile fetch
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      getSessionAndProfile(session);
    });

    // Client session expiration check
    const checkClientSession = () => {
      const clientLoginTime = localStorage.getItem('client_login_time');
      if (clientLoginTime && profile?.role === 'client') {
        const twoHours = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
        if (Date.now() - parseInt(clientLoginTime) > twoHours) {
          setProfile(null); // Clear client profile
          localStorage.removeItem('client_login_time'); // Clear login time
        }
      }
    };

    // Run check on initial load and periodically
    checkClientSession();
    const interval = setInterval(checkClientSession, 5 * 60 * 1000); // Check every 5 minutes

    return () => {
      authListener.subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []); // Depend only on session, not profile

  const loginWithPassword = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const loginWithVat = async (vatNumber: string) => {
    // This is a "pretend" login for clients. It does not create a real session.
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('vat_intra', vatNumber)
      .single();

    if (error) {
      console.error('Supabase client login error:', error);
      throw new Error('Numéro de TVA incorrect ou client non trouvé. Veuillez vérifier votre saisie ou vous inscrire.');
    }
    if (client) {
      setProfile({ role: 'client', ...client });
      localStorage.setItem('client_login_time', Date.now().toString()); // Store login time
    }
    return { client };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        loginWithPassword,
        loginWithVat,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

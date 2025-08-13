
import React, { createContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthContextType } from '@/types/auth';
import { sessionManager } from '@/utils/sessionManager';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'moderator' | 'user'>('user');

  useEffect(() => {
    console.log('🔵 AuthProvider useEffect started');
    let isMounted = true;

    // Initialize session manager for anonymous users
    const initializeApp = async () => {
      try {
        console.log('🔵 Initializing session manager...');
        await sessionManager.initializeSession();
        console.log('✅ Session manager initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize session manager:', error);
        console.error('Error details:', {
          name: error?.name,
          message: error?.message,
          stack: error?.stack
        });
      }
    };

    initializeApp();

    // Set up auth state listener
    console.log('🔵 Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) {
          console.log('⚠️ Auth state change ignored - component unmounted');
          return;
        }
        
        console.log('🔵 Auth state change:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Clear temp session when user logs in
          try {
            sessionManager.clearSession();
          } catch (error) {
            console.error('Error clearing session:', error);
          }
          
          // Fetch user role with proper error handling
          const fetchUserRole = async () => {
            if (!isMounted) return;
            try {
              const { data: roleData, error } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user.id)
                .single();
              
              if (error) {
                console.warn('No user role found, defaulting to user:', error.message);
                if (isMounted) setUserRole('user');
                return;
              }
              
              if (roleData && isMounted) {
                setUserRole(roleData.role);
              }
            } catch (error) {
              console.error('Error fetching user role:', error);
              if (isMounted) setUserRole('user');
            }
          };
          
          fetchUserRole();
        } else {
          setUserRole('user');
          // Re-initialize temp session when user logs out with error handling
          const reinitializeSession = async () => {
            if (!isMounted) return;
            try {
              await sessionManager.initializeSession();
            } catch (error) {
              console.error('Error reinitializing session:', error);
            }
          };
          
          reinitializeSession();
        }
        
        console.log('🔵 Setting loading to false');
        setLoading(false);
      }
    );
    console.log('✅ Auth state listener set up successfully');

    // Check for existing session
    console.log('🔵 Checking for existing session...');
    const getInitialSession = async () => {
      try {
        console.log('🔵 Getting initial session from Supabase...');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('❌ Error getting initial session:', error);
        } else {
          console.log('✅ Initial session retrieved successfully');
        }
        
        if (isMounted) {
          console.log('🔵 Setting initial session state...');
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          
          if (session?.user) {
            console.log('✅ Initial session found for user:', session.user.id);
          } else {
            console.log('ℹ️ No initial session found');
          }
        }
      } catch (error) {
        console.error('❌ Failed to get initial session:', error);
        console.error('Error details:', {
          name: error?.name,
          message: error?.message,
          stack: error?.stack
        });
        if (isMounted) {
          console.log('🔵 Setting loading to false after error');
          setLoading(false);
        }
      }
    };

    console.log('🔵 Calling getInitialSession...');
    getInitialSession();

    return () => {
      console.log('🔵 AuthProvider cleanup - unmounting...');
      isMounted = false;
      subscription.unsubscribe();
      console.log('✅ AuthProvider cleanup completed');
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    setLoading(true);
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username: username
        }
      }
    });
    
    if (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const isAdmin = userRole === 'admin';
  const isModerator = userRole === 'moderator' || isAdmin;

  const contextUser = user ? {
    id: user.id,
    email: user.email || '',
    username: user.user_metadata?.username || user.email?.split('@')[0] || '',
    role: userRole,
    joinDate: user.created_at?.split('T')[0] || '',
    reputation: 0,
    isActive: true
  } : null;

  return (
    <AuthContext.Provider value={{ 
      user: contextUser, 
      signIn, 
      signUp, 
      signOut, 
      loading, 
      isAdmin, 
      isModerator 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

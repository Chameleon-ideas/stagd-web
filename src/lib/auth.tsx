'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';

interface User {
  id: string;
  full_name: string;
  username: string;
  email: string;
  avatar_url?: string;
  role: 'creative' | 'general' | 'both';
  city?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  signup: (data: { fullName: string; email: string; password: string; role: 'creative' | 'visitor' }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  patchUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadProfile = async (userId: string): Promise<User | null> => {
    const [{ data }, { data: { user: authUser } }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, username, role, avatar_url, city, phone').eq('id', userId).single(),
      supabase.auth.getUser(),
    ]);
    if (!data) return null;
    return {
      id: data.id,
      full_name: data.full_name,
      username: data.username,
      email: authUser?.email ?? '',
      avatar_url: data.avatar_url,
      role: data.role,
      city: data.city ?? undefined,
      phone: data.phone ?? undefined,
    };
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await loadProfile(session.user.id);
        setUser(profile);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await loadProfile(session.user.id);
        setUser(profile);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setIsLoading(false);
      throw error;
    }
    if (data.user) {
      const profile = await loadProfile(data.user.id);
      setUser(profile);
    }
    setIsLoading(false);
    router.push('/explore?tab=artists');
  };

  const sendMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/magic`,
      },
    });
    if (error) throw error;
  };

  const signup = async (data: { fullName: string; email: string; password: string; role: 'creative' | 'visitor' }) => {
    setIsLoading(true);
    const username = data.fullName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const { error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback${new URLSearchParams(window.location.search).get('next') ? `?next=${new URLSearchParams(window.location.search).get('next')}` : ''}`,
        data: {
          full_name: data.fullName,
          username,
          role: data.role === 'creative' ? 'creative' : 'general',
        },
      },
    });
    setIsLoading(false);
    if (signUpError) throw signUpError;
    router.push('/auth/confirm-email');
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await loadProfile(session.user.id);
      setUser(profile);
    }
  };

  const patchUser = (updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : prev);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, sendMagicLink, signup, logout, refreshUser, patchUser }}>
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

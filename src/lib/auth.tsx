'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/*
OLD IMPLEMENTATION (kept intentionally):

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  full_name: string;
  username: string;
  email: string;
  avatar_url?: string;
  role: 'creative' | 'visitor';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('stagd_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    const mockUser: User = {
      id: 'mock_user_1',
      full_name: 'Zia Ahmed',
      username: 'zia_ahmed',
      email: email,
      role: 'visitor',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'
    };
    setUser(mockUser);
    localStorage.setItem('stagd_user', JSON.stringify(mockUser));
    setIsLoading(false);
    router.push('/profile');
  };

  const signup = async (data: any) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const mockUser: User = {
      id: 'mock_user_new',
      full_name: data.fullName,
      username: data.fullName.toLowerCase().replace(' ', '_'),
      email: data.email,
      role: data.role || 'creative',
    };
    setUser(mockUser);
    localStorage.setItem('stagd_user', JSON.stringify(mockUser));
    setIsLoading(false);
    router.push('/onboarding');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('stagd_user');
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
*/

interface User {
  id: string;
  full_name: string;
  username: string;
  email: string;
  avatar_url?: string;
  role: 'creative' | 'visitor' | 'general' | 'both';
}

interface SignupData {
  fullName: string;
  email: string;
  password: string;
  role: 'creative' | 'visitor';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toUsername(fullName: string) {
  return fullName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 20) || `user_${Date.now().toString().slice(-6)}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function loadProfileUser(authUser: { id: string; email?: string; user_metadata?: any }) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, username, role, avatar_url')
        .eq('id', authUser.id)
        .single();

      if (!mounted) return;

      setUser({
        id: authUser.id,
        email: authUser.email || '',
        full_name: profile?.full_name || authUser.user_metadata?.full_name || '',
        username: profile?.username || authUser.user_metadata?.username || '',
        avatar_url: profile?.avatar_url || authUser.user_metadata?.avatar_url,
        role: (profile?.role as User['role']) || 'general',
      });
    }

    async function hydrateAuth() {
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData.user;

      if (authUser) {
        await loadProfileUser(authUser as any);
      } else if (mounted) {
        setUser(null);
      }

      if (mounted) setIsLoading(false);
    }

    hydrateAuth();

    // NOTE: Do not run awaited Supabase calls directly inside this callback.
    // It can cause deadlocks in some supabase-js versions.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
        return;
      }

      // Defer async work outside callback execution context.
      setTimeout(() => {
        void loadProfileUser(session.user as any);
      }, 0);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);

    if (error) throw error;
    router.push('/explore');
    router.refresh();
  };

  const signup = async (data: SignupData) => {
    setIsLoading(true);
    const username = toUsername(data.fullName);

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          username,
          role: data.role === 'visitor' ? 'general' : 'creative',
        },
      },
    });

    setIsLoading(false);
    if (error) throw error;

    router.push('/auth/login');
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    router.refresh();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
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

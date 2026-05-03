'use client';

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
    // Simulated persistence
    const savedUser = localStorage.getItem('stagd_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string) => {
    setIsLoading(true);
    // Simulated login delay
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


"use client";

import type { User, UserRole } from '@/types';
import React, { createContext, useContext, type ReactNode, useState, useEffect } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (username: string, password?: string) => boolean; // Password optional for initial login, required for others
  logout: () => void;
  registerUser: (userData: Omit<User, 'id'>) => User | null; // For admin to add cashiers
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCashier: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default admin user (IMPORTANT: For simulation only. Use a secure backend in production)
const DEFAULT_ADMIN_USER: User = {
  id: 'admin-001',
  username: 'admin',
  password: 'password', // Simulate password for login
  role: 'admin',
  name: 'Administrator',
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useLocalStorage<User[]>('users', [DEFAULT_ADMIN_USER]);
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Check if currentUser in localStorage is still valid (exists in users list)
    if (currentUser && !users.find(u => u.id === currentUser.id)) {
      setCurrentUser(null); // Invalidate if user was deleted
    }
    setLoading(false);
  }, [users, currentUser, setCurrentUser]);


  const login = (username: string, password?: string): boolean => {
    const user = users.find((u) => u.username === username);
    
    if (user) {
      // Simulate password check (IMPORTANT: DO NOT use this in production)
      if (user.password && password && user.password === password) {
        setCurrentUser(user);
        toast({ title: "Login Successful", description: `Welcome back, ${user.name}!`});
        router.push('/'); // Redirect to home or dashboard
        return true;
      } else if (!user.password && !password) { // For initial "guest" or simplified login if no password set
        setCurrentUser(user);
        toast({ title: "Login Successful", description: `Welcome back, ${user.name}!`});
        router.push('/');
        return true;
      }
      toast({ title: "Login Failed", description: "Invalid username or password.", variant: "destructive" });
      return false;
    }
    toast({ title: "Login Failed", description: "User not found.", variant: "destructive" });
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    toast({ title: "Logged Out", description: "You have been successfully logged out."});
    router.push('/login');
  };

  const registerUser = (userData: Omit<User, 'id'>): User | null => {
    if (!currentUser || currentUser.role !== 'admin') {
      toast({ title: "Access Denied", description: "Only admins can register new users.", variant: "destructive"});
      return null;
    }
    if (users.find(u => u.username === userData.username)) {
      toast({ title: "Registration Failed", description: `Username "${userData.username}" already exists.`, variant: "destructive"});
      return null;
    }
    const newUser: User = {
      ...userData,
      id: new Date().toISOString() + Math.random().toString(36).substring(2,9),
    };
    setUsers((prevUsers) => [...prevUsers, newUser]);
    toast({ title: "User Registered", description: `${newUser.role === 'cashier' ? 'Cashier' : 'User'} ${newUser.name} created successfully.`});
    return newUser;
  };

  const isAuthenticated = !!currentUser;
  const isAdmin = currentUser?.role === 'admin';
  const isCashier = currentUser?.role === 'cashier';

  if (loading && typeof window !== 'undefined' && window.location.pathname !== '/login') {
     // Show a simple loading state or null to prevent flashing content if not on login page
     // and authentication is still loading
     return null; 
  }

  return (
    <AuthContext.Provider value={{ currentUser, users, login, logout, registerUser, isAuthenticated, isAdmin, isCashier, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

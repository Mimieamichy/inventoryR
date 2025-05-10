
"use client";

import type { User, UserRole } from '@/types';
import React, { createContext, useContext, type ReactNode, useState, useEffect, useCallback, useMemo } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (username: string, password?: string) => boolean; 
  logout: () => void;
  registerUser: (userData: Omit<User, 'id'>) => User | null;
  deleteUser: (userId: string) => Promise<boolean>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCashier: boolean;
  loading: boolean; // Auth loading state
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEFAULT_ADMIN_USER: User = {
  id: 'admin-001',
  username: 'admin',
  password: 'password', 
  role: 'admin',
  name: 'Administrator',
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useLocalStorage<User[]>('users', [DEFAULT_ADMIN_USER]);
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  const [authLoading, setAuthLoading] = useState(true); // Renamed to authLoading for clarity
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Ensure users array always contains the default admin user
    setUsers(prevUsers => {
      const adminExists = prevUsers.some(u => u.id === DEFAULT_ADMIN_USER.id);
      if (!adminExists) {
        return [DEFAULT_ADMIN_USER, ...prevUsers.filter(u => u.id !== DEFAULT_ADMIN_USER.id)];
      }
      return prevUsers;
    });

    if (currentUser && !users.find(u => u.id === currentUser.id)) {
      setCurrentUser(null); 
    }
    setAuthLoading(false);
  }, [users, currentUser, setCurrentUser, setUsers]);

  const login = useCallback((username: string, password?: string): boolean => {
    const user = users.find((u) => u.username === username);
    
    if (user) {
      if (user.password && password && user.password === password) {
        setCurrentUser(user);
        toast({ title: "Login Successful", description: `Welcome back, ${user.name}!`});
        router.push('/'); 
        return true;
      } else if (!user.password && !password) { 
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
  }, [users, setCurrentUser, router, toast]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    toast({ title: "Logged Out", description: "You have been successfully logged out."});
    router.push('/login');
  }, [setCurrentUser, router, toast]);

  const registerUser = useCallback((userData: Omit<User, 'id'>): User | null => {
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
  }, [currentUser, users, setUsers, toast]);

  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin') {
      toast({ title: "Access Denied", description: "Only admins can delete users.", variant: "destructive" });
      return false;
    }
    if (userId === DEFAULT_ADMIN_USER.id) {
      toast({ title: "Deletion Failed", description: "Default admin user cannot be deleted.", variant: "destructive" });
      return false;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${currentUser.id}`, // Send token for authentication
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast({ title: "Deletion Failed", description: errorData.message || "Could not delete the user.", variant: "destructive" });
        return false;
      }
      
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
      toast({ title: "User Deleted", description: "The user has been successfully deleted." });
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({ title: "Deletion Error", description: "An unexpected error occurred while deleting the user.", variant: "destructive" });
      return false;
    }
  }, [currentUser, setUsers, toast]);


  const isAuthenticated = useMemo(() => !!currentUser, [currentUser]);
  const isAdmin = useMemo(() => currentUser?.role === 'admin', [currentUser]);
  const isCashier = useMemo(() => currentUser?.role === 'cashier', [currentUser]);

  const contextValue = useMemo(() => ({
    currentUser,
    users,
    login,
    logout,
    registerUser,
    deleteUser,
    isAuthenticated,
    isAdmin,
    isCashier,
    loading: authLoading 
  }), [currentUser, users, login, logout, registerUser, deleteUser, isAuthenticated, isAdmin, isCashier, authLoading]);

  return (
    <AuthContext.Provider value={contextValue}>
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

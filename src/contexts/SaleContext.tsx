"use client";

import type { Sale, CartItem } from '@/types';
import React, { createContext, useContext, type ReactNode, useCallback, useMemo } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

export const TAX_RATE = 0.10; 

interface SaleContextType {
  sales: Sale[]; 
  addSale: (cartItems: CartItem[]) => Promise<Sale | null>; 
  getSaleById: (saleId: string) => Promise<Sale | null>;
  fetchUserSales: () => Promise<Sale[]>;
}

const SaleContext = createContext<SaleContextType | undefined>(undefined);

export const SaleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const memoizedEmptySales = useMemo(() => [], []);
  const [localStorageSales, setLocalStorageSales] = useLocalStorage<Sale[]>('sales', memoizedEmptySales);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const addSale = useCallback(async (cartItems: CartItem[]): Promise<Sale | null> => {
    if (cartItems.length === 0) {
        toast({ title: "Empty Cart", description: "Cannot process an empty cart.", variant: "destructive"});
        return null;
    }
    if (!currentUser) {
        toast({ title: "Not Authenticated", description: "User must be logged in to make a sale.", variant: "destructive"});
        return null;
    }

    const salePayload = {
      cartItems: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        price: item.price,
        cartQuantity: item.cartQuantity,
        quantity: item.quantity, 
        imageUrl: item.imageUrl,
      })),
    };

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.id}`,
        },
        body: JSON.stringify(salePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast({ title: "Sale Failed", description: errorData.message || "Could not process the sale.", variant: "destructive" });
        console.error('Failed to create sale:', errorData.message);
        return null;
      }
      const newSale: Sale = await response.json();
      setLocalStorageSales((prevSales) => [...prevSales, newSale]); 
      return newSale;
    } catch (error) {
      console.error('Error creating sale:', error);
      toast({ title: "Sale Error", description: "An unexpected error occurred.", variant: "destructive" });
      return null;
    }
  }, [currentUser, toast, setLocalStorageSales]);

  const getSaleById = useCallback(async (saleId: string): Promise<Sale | null> => {
    if (!currentUser) {
        toast({ title: "Not Authenticated", description: "User must be logged in to view sales.", variant: "destructive"});
        return null;
    }
    try {
      const response = await fetch(`/api/sales/${saleId}`, {
        headers: {
          'Authorization': `Bearer ${currentUser.id}`,
        },
      });
      if (!response.ok) {
        if (response.status === 404) {
          return null; 
        }
        const errorData = await response.json();
        toast({ title: "Error", description: errorData.message || `Failed to fetch sale ${saleId}.`, variant: "destructive"});
        console.error(`Failed to fetch sale ${saleId}:`, errorData.message);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching sale ${saleId}:`, error);
      toast({ title: "Fetch Error", description: "An unexpected error occurred while fetching the sale.", variant: "destructive" });
      return null;
    }
  }, [currentUser, toast]);

  const fetchUserSales = useCallback(async (): Promise<Sale[]> => {
    if (!currentUser) {
        toast({ title: "Not Authenticated", description: "User must be logged in to view sales history.", variant: "destructive"});
        return [];
    }
    try {
      const response = await fetch('/api/sales', {
        headers: { 'Authorization': `Bearer ${currentUser.id}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        toast({ title: "Error", description: errorData.message || "Failed to fetch sales history.", variant: "destructive"});
        console.error('Failed to fetch user sales:', errorData.message);
        return [];
      }
      const fetchedSales: Sale[] = await response.json();
      setLocalStorageSales(fetchedSales); 
      return fetchedSales;
    } catch (error) {
      console.error('Error fetching user sales:', error);
      toast({ title: "Fetch Error", description: "An unexpected error occurred while fetching sales history.", variant: "destructive" });
      return [];
    }
  }, [currentUser, toast, setLocalStorageSales]);

  const contextValue = useMemo(() => ({
    sales: localStorageSales,
    addSale,
    getSaleById,
    fetchUserSales
  }), [localStorageSales, addSale, getSaleById, fetchUserSales]);

  return (
    <SaleContext.Provider value={contextValue}>
      {children}
    </SaleContext.Provider>
  );
};

export const useSales = (): SaleContextType => {
  const context = useContext(SaleContext);
  if (!context) {
    throw new Error('useSales must be used within a SaleProvider');
  }
  return context;
};

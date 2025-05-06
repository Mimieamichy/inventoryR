"use client";

import type { Sale, CartItem } from '@/types';
import React, { createContext, useContext, type ReactNode } from 'react';
import { useProducts } from './ProductContext';
import useLocalStorage from '@/hooks/useLocalStorage';

export const TAX_RATE = 0.10; // 10% Tax Rate

interface SaleContextType {
  sales: Sale[];
  addSale: (cartItems: CartItem[], cashierId: string) => Sale | null;
  getSaleById: (saleId: string) => Sale | undefined;
}

const SaleContext = createContext<SaleContextType | undefined>(undefined);

export const SaleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sales, setSales] = useLocalStorage<Sale[]>('sales', []);
  const { updateProductQuantity: updateCatalogQuantity } = useProducts();

  const addSale = (cartItems: CartItem[], cashierId: string): Sale | null => {
    if (cartItems.length === 0) return null;

    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.cartQuantity, 0);
    const taxAmount = subtotal * TAX_RATE;
    const total = subtotal + taxAmount;

    const newSale: Sale = {
      id: new Date().toISOString() + Math.random().toString(36).substring(2,9), // Simple unique ID
      items: cartItems.map(item => ({
        productId: item.id,
        name: item.name,
        sku: item.sku,
        price: item.price,
        quantity: item.cartQuantity,
      })),
      subtotal,
      taxRate: TAX_RATE,
      taxAmount,
      total,
      timestamp: new Date().toISOString(),
      cashierId,
    };

    // Update product quantities in catalog
    // This simulates the transactional update
    let canProcessSale = true;
    for (const item of cartItems) {
        const productInCatalog = updateCatalogQuantity // this is actually getProductById
        // For now, we assume product exists and quantity is sufficient as CartContext should handle this.
        // A more robust solution would re-check here.
        updateCatalogQuantity(item.id, -item.cartQuantity); // Decrease quantity
    }
    
    setSales((prevSales) => [...prevSales, newSale]);
    return newSale;
  };

  const getSaleById = (saleId: string): Sale | undefined => {
    return sales.find(s => s.id === saleId);
  }

  return (
    <SaleContext.Provider value={{ sales, addSale, getSaleById }}>
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

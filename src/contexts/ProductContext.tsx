"use client";

import type { Product } from '@/types';
import React, { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import initialProductsData from '@/data/products.json';
import useLocalStorage from '@/hooks/useLocalStorage';

interface ProductContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProductQuantity: (productId: string, newQuantity: number) => void;
  getProductById: (productId: string) => Product | undefined;
  loading: boolean;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useLocalStorage<Product[]>('products', []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only load initial data if localStorage is empty
    if (products.length === 0 && initialProductsData.length > 0) {
        const productsWithImageHints = initialProductsData.map(p => ({
            ...p,
            // ensure data-ai-hint is set if imageUrl is picsum
            ...(p.imageUrl && p.imageUrl.includes('picsum.photos') && { 'data-ai-hint': p.name.split(' ')[0].toLowerCase() })
        }))
      setProducts(productsWithImageHints as Product[]);
    }
    setLoading(false);
  }, []); // Removed setProducts from dependency array to avoid loop

  const addProduct = (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...productData,
      id: new Date().toISOString() + Math.random().toString(36).substring(2,9), // Simple unique ID
      'data-ai-hint': productData.name.split(' ')[0].toLowerCase()
    };
    setProducts((prevProducts) => [...prevProducts, newProduct]);
  };

  const updateProductQuantity = (productId: string, quantityChange: number) => {
    setProducts((prevProducts) =>
      prevProducts.map((p) =>
        p.id === productId ? { ...p, quantity: p.quantity + quantityChange } : p
      )
    );
  };

  const getProductById = (productId: string): Product | undefined => {
    return products.find(p => p.id === productId);
  };

  return (
    <ProductContext.Provider value={{ products, addProduct, updateProductQuantity, getProductById, loading }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = (): ProductContextType => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

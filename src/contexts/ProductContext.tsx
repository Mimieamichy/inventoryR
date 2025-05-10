"use client";

import type { Product } from '@/types';
import React, { createContext, useContext, useState, type ReactNode, useEffect, useMemo, useCallback } from 'react';
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
  const memoizedEmptyProducts = useMemo(() => [], []);
  const [products, setProducts] = useLocalStorage<Product[]>('products', memoizedEmptyProducts);
  const [loading, setLoading] = useState(true);

  const memoizedInitialProductsData = useMemo(() => {
    return initialProductsData.map(p => ({
        ...p,
        ...(p.imageUrl && p.imageUrl.includes('picsum.photos') && { 'data-ai-hint': p.name.split(' ')[0].toLowerCase() })
    })) as Product[];
  }, []);


  useEffect(() => {
    if (products.length === 0 && memoizedInitialProductsData.length > 0) {
      setProducts(memoizedInitialProductsData);
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // products, setProducts, memoizedInitialProductsData are omitted to run once for initial load logic

  const addProduct = useCallback((productData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...productData,
      id: new Date().toISOString() + Math.random().toString(36).substring(2,9), 
      'data-ai-hint': productData.name.split(' ')[0].toLowerCase()
    };
    setProducts((prevProducts) => [...prevProducts, newProduct]);
  }, [setProducts]);

  const updateProductQuantity = useCallback((productId: string, quantityChange: number) => {
    setProducts((prevProducts) =>
      prevProducts.map((p) =>
        p.id === productId ? { ...p, quantity: p.quantity + quantityChange } : p
      )
    );
  }, [setProducts]);

  const getProductById = useCallback((productId: string): Product | undefined => {
    return products.find(p => p.id === productId);
  }, [products]);

  const contextValue = useMemo(() => ({
    products,
    addProduct,
    updateProductQuantity,
    getProductById,
    loading
  }), [products, addProduct, updateProductQuantity, getProductById, loading]);

  return (
    <ProductContext.Provider value={contextValue}>
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

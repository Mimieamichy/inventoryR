"use client";

import type { Product, CartItem } from '@/types';
import React, { createContext, useContext, type ReactNode, useCallback, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
import useLocalStorage from '@/hooks/useLocalStorage';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, newQuantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useLocalStorage<CartItem[]>('cart', []);
  const { toast } = useToast();

  const addToCart = useCallback((product: Product, quantity: number) => {
    if (product.quantity < quantity) {
      toast({ title: "Not enough stock", description: `Only ${product.quantity} of ${product.name} available.`, variant: "destructive" });
      return;
    }

    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      if (existingItem) {
        const updatedQuantity = existingItem.cartQuantity + quantity;
        if (product.quantity < updatedQuantity) {
          toast({ title: "Not enough stock", description: `Cannot add ${quantity} more. Only ${product.quantity - existingItem.cartQuantity} additional ${product.name} available.`, variant: "destructive" });
          return prevItems;
        }
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, cartQuantity: updatedQuantity } : item
        );
      }
      toast({ title: "Item added", description: `${product.name} added to cart.` });
      return [...prevItems, { ...product, cartQuantity: quantity }];
    });
  }, [setCartItems, toast]);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
    toast({ title: "Item removed", description: "Item removed from cart." });
  }, [setCartItems, toast]);

  const updateCartQuantity = useCallback((productId: string, newQuantity: number) => {
    setCartItems((prevItems) => {
      const itemToUpdate = prevItems.find(item => item.id === productId);
      if (!itemToUpdate) return prevItems;

      if (newQuantity <= 0) {
        toast({ title: "Item removed", description: `${itemToUpdate.name} removed from cart.`})
        return prevItems.filter((item) => item.id !== productId);
      }
      if (itemToUpdate.quantity < newQuantity) { // itemToUpdate.quantity is the original product stock
        toast({ title: "Not enough stock", description: `Only ${itemToUpdate.quantity} of ${itemToUpdate.name} available.`, variant: "destructive" });
        return prevItems.map((item) =>
          item.id === productId ? { ...item, cartQuantity: itemToUpdate.quantity } : item // Cap at available stock
        );
      }
      return prevItems.map((item) =>
        item.id === productId ? { ...item, cartQuantity: newQuantity } : item
      );
    });
  }, [setCartItems, toast]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, [setCartItems]);

  const getCartTotal = useCallback((): number => {
    return cartItems.reduce((total, item) => total + item.price * item.cartQuantity, 0);
  }, [cartItems]);

  const getCartItemCount = useCallback((): number => {
    return cartItems.reduce((count, item) => count + item.cartQuantity, 0);
  }, [cartItems]);

  const contextValue = useMemo(() => ({
    cartItems,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    getCartTotal,
    getCartItemCount
  }), [cartItems, addToCart, removeFromCart, updateCartQuantity, clearCart, getCartTotal, getCartItemCount]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

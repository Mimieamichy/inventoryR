"use client";

import Link from 'next/link';
import { ShoppingCart, PackagePlus, Home, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';

export function Header() {
  const { getCartItemCount } = useCart();
  const [itemCount, setItemCount] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      setItemCount(getCartItemCount());
    }
  }, [getCartItemCount, isClient, useCart().cartItems]); // Listen to cartItems change

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <ShoppingCart className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            RetailFlow
          </h1>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              Catalog
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/stock" className="flex items-center gap-1">
              <PackagePlus className="h-4 w-4" />
              Admin Stock
            </Link>
          </Button>
           <Button variant="ghost" size="sm" asChild>
            <Link href="/cashier/sales-history" className="flex items-center gap-1">
              <List className="h-4 w-4" />
              Sales History
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/cashier/sale" className="relative flex items-center gap-1">
              <ShoppingCart className="h-4 w-4" />
              Cart
              {isClient && itemCount > 0 && (
                <Badge variant="destructive" className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full p-0.5 text-xs">
                  {itemCount}
                </Badge>
              )}
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}


"use client";

import Link from 'next/link';
import { ShoppingCart, PackagePlus, Home, List, Users, LogOut, UserCircle, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { getCartItemCount } = useCart();
  const { currentUser, logout, isAdmin, isCashier, isAuthenticated } = useAuth();
  const [itemCount, setItemCount] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      setItemCount(getCartItemCount());
    }
  }, [getCartItemCount, isClient, useCart().cartItems]);

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
          {isAuthenticated && (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/" className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  Catalog
                </Link>
              </Button>

              {isAdmin && (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/stock" className="flex items-center gap-1">
                      <PackagePlus className="h-4 w-4" />
                      Manage Stock
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/users" className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Manage Users
                    </Link>
                  </Button>
                   <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/all-sales" className="flex items-center gap-1">
                      <BarChart3 className="h-4 w-4" />
                      All Sales
                    </Link>
                  </Button>
                </>
              )}

              {isCashier && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/cashier/my-sales" className="flex items-center gap-1">
                    <List className="h-4 w-4" />
                    My Sales
                  </Link>
                </Button>
              )}

              {(isAdmin || isCashier) && (
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
              )}
            </>
          )}

          {isClient && isAuthenticated && currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                   <UserCircle className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser.username} ({currentUser.role})
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            isClient && !isAuthenticated && (
                <Button variant="outline" size="sm" asChild>
                    <Link href="/login">Login</Link>
                </Button>
            )
          )}
        </nav>
      </div>
    </header>
  );
}

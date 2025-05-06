"use client";

import { useState, useMemo } from 'react';
import { ProductCard } from '@/components/product/ProductCard';
import { useProducts } from '@/contexts/ProductContext';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ShoppingBag } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CatalogPage() {
  const { products, loading } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-card rounded-lg shadow">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <ShoppingBag className="mr-3 h-8 w-8 text-primary" /> Product Catalog
        </h1>
        <Input
          type="search"
          placeholder="Search products by name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <Alert variant="default" className="bg-secondary">
          <AlertTriangle className="h-5 w-5 text-secondary-foreground" />
          <AlertTitle className="font-semibold text-secondary-foreground">No Products Found</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            {searchTerm ? `Your search for "${searchTerm}" did not match any products.` : "There are no products available in the catalog currently."}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

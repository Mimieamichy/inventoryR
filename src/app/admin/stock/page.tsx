"use client";

import { ProductForm } from '@/components/product/ProductForm';
import { useProducts } from '@/contexts/ProductContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ListOrdered } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function StockInitializationPage() {
  const { products, loading } = useProducts();

  return (
    <div className="space-y-8">
      <ProductForm />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center">
            <ListOrdered className="mr-2 h-6 w-6 text-primary" /> Current Stock Overview
          </CardTitle>
          <CardDescription>A quick glance at the products currently in your catalog.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <p className="text-muted-foreground">Loading stock data...</p>
          ) : products.length > 0 ? (
            <ul className="space-y-3">
              {products.slice(0, 5).map((product) => ( // Show first 5 products as an overview
                <li key={product.id} className="flex justify-between items-center p-3 bg-secondary/50 rounded-md">
                  <div>
                    <p className="font-semibold text-secondary-foreground">{product.name} <span className="text-xs text-muted-foreground">(SKU: {product.sku})</span></p>
                    <p className="text-sm text-muted-foreground">Price: ${product.price.toFixed(2)}</p>
                  </div>
                  <p className={`font-medium ${product.quantity > 10 ? 'text-green-600' : 'text-amber-600'}`}>
                    Qty: {product.quantity}
                  </p>
                </li>
              ))}
              {products.length > 5 && (
                <li className="text-center mt-4">
                  <Button variant="link" asChild>
                    <Link href="/">View All Products ({products.length})</Link>
                  </Button>
                </li>
              )}
            </ul>
          ) : (
            <Alert variant="default">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle className="font-semibold">No Products Yet</AlertTitle>
              <AlertDescription>
                Your product catalog is empty. Add some products using the form above to get started.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

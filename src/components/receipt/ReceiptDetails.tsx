"use client";

import type { Sale } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { PrinterIcon, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ReceiptDetailsProps {
  sale: Sale;
}

export function ReceiptDetails({ sale }: ReceiptDetailsProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const handlePrint = () => {
    if (isClient) {
      window.print();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl print:shadow-none print:border-none">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-2">
            <ShoppingCart className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-3xl font-bold">RetailFlow</CardTitle>
        <CardDescription className="text-lg">Sale Receipt</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><span className="font-semibold">Sale ID:</span> {sale.id}</p>
            <p><span className="font-semibold">Date:</span> {isClient ? new Date(sale.timestamp).toLocaleString() : 'Loading...'}</p>
          </div>
          <div className="text-right">
            <p><span className="font-semibold">Cashier ID:</span> {sale.cashierId}</p>
          </div>
        </div>
        <Separator />
        <div>
          <h4 className="font-semibold mb-2 text-lg">Items Purchased:</h4>
          <ul className="space-y-2">
            {sale.items.map((item) => (
              <li key={item.productId} className="flex justify-between items-center text-sm py-1 border-b border-dashed last:border-none">
                <div>
                  <p className="font-medium">{item.name} <span className="text-xs text-muted-foreground">(SKU: {item.sku})</span></p>
                  <p className="text-muted-foreground">{item.quantity} x ${item.price.toFixed(2)}</p>
                </div>
                <p className="font-medium">${(item.quantity * item.price).toFixed(2)}</p>
              </li>
            ))}
          </ul>
        </div>
        <Separator />
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="font-medium">${sale.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax ({ (sale.taxRate * 100).toFixed(0) }%):</span>
            <span className="font-medium">${sale.taxAmount.toFixed(2)}</span>
          </div>
          <Separator className="my-2"/>
          <div className="flex justify-between text-xl font-bold text-foreground">
            <span>Total:</span>
            <span>${sale.total.toFixed(2)}</span>
          </div>
        </div>
        <Separator />
        <p className="text-center text-xs text-muted-foreground pt-4">
          Thank you for your purchase!
        </p>
      </CardContent>
      <CardFooter className="print:hidden flex justify-center p-6">
        <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90">
          <PrinterIcon className="mr-2 h-4 w-4" /> Print Receipt
        </Button>
      </CardFooter>
    </Card>
  );
}

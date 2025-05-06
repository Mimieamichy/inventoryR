"use client";

import { useSales } from '@/contexts/SaleContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Eye, History, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useEffect, useState } from 'react';

export default function SalesHistoryPage() {
  const { sales } = useSales();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const sortedSales = [...sales].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
        <History className="mr-3 h-8 w-8 text-primary" /> Sales History
      </h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Recorded Sales</CardTitle>
          <CardDescription>Browse through all completed transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedSales.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-center">Cashier</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium truncate max-w-xs">
                        <Badge variant="secondary" className="text-xs">{sale.id.substring(0,12)}...</Badge>
                    </TableCell>
                    <TableCell>{isClient ? new Date(sale.timestamp).toLocaleDateString() : '...'}</TableCell>
                    <TableCell className="text-right">{sale.items.reduce((acc, item) => acc + item.quantity, 0)}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">${sale.total.toFixed(2)}</TableCell>
                    <TableCell className="text-center">{sale.cashierId}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/receipt/${sale.id}`}>
                          <Eye className="mr-1 h-4 w-4" /> View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
             <Alert variant="default" className="bg-secondary">
                <AlertTriangle className="h-5 w-5 text-secondary-foreground" />
                <AlertTitle className="font-semibold text-secondary-foreground">No Sales Recorded</AlertTitle>
                <AlertDescription className="text-muted-foreground">
                  There are no sales transactions recorded yet. Completed sales will appear here.
                </AlertDescription>
              </Alert>
          )}
        </CardContent>
        {sortedSales.length > 0 && (
            <CardFooter className="text-sm text-muted-foreground">
                Showing {sortedSales.length} sale(s).
            </CardFooter>
        )}
      </Card>
    </div>
  );
}

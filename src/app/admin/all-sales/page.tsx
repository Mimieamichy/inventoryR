"use client";

import { useSales } from '@/contexts/SaleContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Eye, History, AlertTriangle, BarChart3, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Sale } from '@/types';

export default function AllSalesHistoryPage() {
  const { fetchUserSales } = useSales();
  const { isAdmin, isAuthenticated, loading: authLoading } = useAuth(); // authLoading is from AuthContext
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  const [allSalesData, setAllSalesData] = useState<Sale[]>([]);
  const [loadingSales, setLoadingSales] = useState(true); // Specific to this page's data fetching

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      // Toast is shown once, then redirect. Avoid repeated toasts if component lingers.
      // Consider if toast is necessary if redirect is immediate.
      // toast({ title: "Access Denied", description: "You must be an admin to view all sales history.", variant: "destructive"});
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, isAdmin, router, toast]);

  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated && isAdmin) {
      setLoadingSales(true);
      fetchUserSales()
        .then(data => {
          if (isMounted) {
            setAllSalesData(data);
          }
        })
        .catch(err => {
          if (isMounted) {
            console.error("Failed to fetch all sales:", err);
            // Toast is handled by fetchUserSales in context now
            // toast({ title: "Error", description: "Could not load sales history.", variant: "destructive" });
          }
        })
        .finally(() => {
          if (isMounted) {
            setLoadingSales(false);
          }
        });
    } else if (!authLoading) { // If not authenticated/admin and auth check is complete
        if (isMounted) {
            setAllSalesData([]); // Clear data if not authorized
            setLoadingSales(false); // Not loading if not authorized to fetch
        }
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isAdmin, fetchUserSales, authLoading, toast]); // Added authLoading


  const sortedSales = useMemo(() => {
    return [...allSalesData].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [allSalesData]);

  // Primary loading state for auth check
  if (authLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">Checking permissions...</div>;
  }

  // If auth check done, but not authenticated/admin (should be caught by redirect effect, but as a fallback)
  if (!isAuthenticated || !isAdmin) {
     // This state should ideally lead to a quick redirect via the other useEffect.
     // Showing a generic message or null.
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">Access Denied. Redirecting...</div>;
  }
  
  // Sales data specific loading state
  if (loadingSales) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" /> Loading sales data...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
        <BarChart3 className="mr-3 h-8 w-8 text-primary" /> All Sales History
      </h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Recorded Sales</CardTitle>
          <CardDescription>Browse through all completed transactions in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedSales.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Cashier</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
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
                    <TableCell>{sale.cashierId}</TableCell>
                    <TableCell className="text-right">{sale.items.reduce((acc, item) => acc + item.quantity, 0)}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">${sale.total.toFixed(2)}</TableCell>
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
                  There are no sales transactions recorded in the system yet.
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
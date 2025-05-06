
"use client";

import { useSales } from '@/contexts/SaleContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Eye, History, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function MySalesHistoryPage() {
  const { sales } = useSales();
  const { currentUser, isCashier, isAuthenticated, loading: authLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isCashier)) {
      toast({ title: "Access Denied", description: "You must be a cashier to view your sales history.", variant: "destructive"});
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, isCashier, router, toast]);

  const mySales = useMemo(() => {
    if (!currentUser || !isCashier) return [];
    return sales
      .filter(sale => sale.cashierId === currentUser.username)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [sales, currentUser, isCashier]);

  if (authLoading || !isCashier) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">Checking permissions...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
        <History className="mr-3 h-8 w-8 text-primary" /> My Sales History
      </h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Your Recorded Sales</CardTitle>
          <CardDescription>Browse through all transactions you've completed.</CardDescription>
        </CardHeader>
        <CardContent>
          {mySales.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mySales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium truncate max-w-xs">
                        <Badge variant="secondary" className="text-xs">{sale.id.substring(0,12)}...</Badge>
                    </TableCell>
                    <TableCell>{isClient ? new Date(sale.timestamp).toLocaleDateString() : '...'}</TableCell>
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
                  You have not recorded any sales transactions yet. Completed sales will appear here.
                </AlertDescription>
              </Alert>
          )}
        </CardContent>
        {mySales.length > 0 && (
            <CardFooter className="text-sm text-muted-foreground">
                Showing {mySales.length} sale(s).
            </CardFooter>
        )}
      </Card>
    </div>
  );
}

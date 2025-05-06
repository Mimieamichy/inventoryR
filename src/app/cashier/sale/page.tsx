
"use client";

import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useSales, TAX_RATE } from '@/contexts/SaleContext';
import { useAuth } from '@/contexts/AuthContext';
import { CartItemCard } from '@/components/sale/CartItemCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CheckCircle2, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { useEffect } from 'react';

export default function SalePage() {
  const { cartItems, getCartTotal, clearCart, getCartItemCount } = useCart();
  const { addSale } = useSales();
  const { currentUser, isAuthenticated, isAdmin, isCashier, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (!isAdmin && !isCashier))) {
      toast({ title: "Access Denied", description: "You must be logged in as admin or cashier to access this page.", variant: "destructive"});
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, isAdmin, isCashier, router, toast]);

  const subtotal = getCartTotal();
  const taxAmount = subtotal * TAX_RATE;
  const total = subtotal + taxAmount;

  const handleCompleteSale = () => {
    if (cartItems.length === 0) {
      toast({ title: "Empty Cart", description: "Cannot complete sale with an empty cart.", variant: "destructive" });
      return;
    }
    if (!currentUser) {
      toast({ title: "Authentication Error", description: "No user logged in. Please login to complete the sale.", variant: "destructive"});
      router.push('/login');
      return;
    }
    
    const cashierId = currentUser.username; // Use logged-in user's username
    const sale = addSale(cartItems, cashierId);

    if (sale) {
      clearCart();
      toast({
        title: "Sale Completed!",
        description: `Sale ID: ${sale.id.substring(0,12)}... Total: $${sale.total.toFixed(2)}`,
        action: (
            <Button variant="outline" size="sm" onClick={() => router.push(`/receipt/${sale.id}`)}>
                View Receipt
            </Button>
        ),
      });
      router.push(`/receipt/${sale.id}`);
    } else {
      toast({ title: "Sale Failed", description: "Could not process the sale. Please try again.", variant: "destructive" });
    }
  };
  
  if (authLoading || (!isAuthenticated || (!isAdmin && !isCashier))) {
     return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">Checking permissions...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <ShoppingCart className="mr-3 h-8 w-8 text-primary" /> Current Sale
        </h1>
        {cartItems.length > 0 ? (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <CartItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6">
              <Alert variant="default" className="bg-secondary">
                <AlertTriangle className="h-5 w-5 text-secondary-foreground" />
                <AlertTitle className="font-semibold text-secondary-foreground">Your Cart is Empty</AlertTitle>
                <AlertDescription className="text-muted-foreground">
                  Add some products from the <Link href="/" className="underline hover:text-primary">catalog</Link> to get started.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="lg:col-span-1">
        <Card className="sticky top-24 shadow-lg"> 
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Order Summary</CardTitle>
            <CardDescription>Review your items and complete the sale.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Items ({getCartItemCount()})</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax ({ (TAX_RATE * 100).toFixed(0) }%)</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold text-foreground">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleCompleteSale}
              disabled={cartItems.length === 0}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              size="lg"
            >
              <CheckCircle2 className="mr-2 h-5 w-5" /> Complete Sale
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

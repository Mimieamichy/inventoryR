
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSales } from '@/contexts/SaleContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Sale } from '@/types';
import { ReceiptDetails } from '@/components/receipt/ReceiptDetails';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Frown, ShieldAlert } from "lucide-react"
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';


export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const {toast} = useToast();
  const saleId = params.saleId as string;
  const { getSaleById } = useSales();
  const { currentUser, isAuthenticated, isAdmin, isCashier, loading: authLoading } = useAuth();
  const [sale, setSale] = useState<Sale | undefined | null>(undefined); // undefined for loading, null for not found/disallowed

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      toast({ title: "Authentication Required", description: "Please login to view receipts.", variant: "default"});
      router.push('/login');
      return;
    }

    if (saleId) {
      const foundSale = getSaleById(saleId);
      if (foundSale) {
        if (isAdmin || (isCashier && currentUser && foundSale.cashierId === currentUser.username)) {
          setSale(foundSale);
        } else {
          setSale(null); // Access denied
          toast({ title: "Access Denied", description: "You do not have permission to view this receipt.", variant: "destructive"});
        }
      } else {
        setSale(null); // Not found
      }
    }
  }, [saleId, getSaleById, authLoading, isAuthenticated, isAdmin, isCashier, currentUser, router, toast]);

  if (authLoading || sale === undefined) { // Loading state
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6 py-8">
        <Skeleton className="h-12 w-1/2 mx-auto" />
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-1/3 mx-auto" />
      </div>
    );
  }

  if (sale === null) { // Not found or access denied state
    const isAccessDenied = getSaleById(saleId) !== undefined; // Check if sale exists but was denied
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            {isAccessDenied ? <ShieldAlert className="w-16 h-16 text-destructive mb-4" /> : <Frown className="w-16 h-16 text-destructive mb-4" />}
            <Alert variant="destructive" className="max-w-md">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{isAccessDenied ? "Access Denied" : "Receipt Not Found"}</AlertTitle>
                <AlertDescription>
                {isAccessDenied 
                  ? "You do not have permission to view this receipt." 
                  : `The sale receipt with ID "${saleId}" could not be found or you don't have permission to view it.`}
                </AlertDescription>
            </Alert>
            <Button asChild variant="outline" className="mt-6">
                <Link href={isAdmin ? "/admin/all-sales" : isCashier ? "/cashier/my-sales" : "/"}>
                    {isAdmin ? "Go to All Sales" : isCashier ? "Go to My Sales" : "Go to Catalog"}
                </Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="py-8">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-receipt, .printable-receipt * {
            visibility: visible;
          }
          .printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0; /* Reset padding for print */
            margin: 0;  /* Reset margin for print */
          }
          header, footer, nav, button.print\\:hidden { /* Hide elements not part of receipt */
            display: none !important;
          }
          .no-print {
             display: none !important;
          }
        }
      `}</style>
      <div className="printable-receipt">
        <ReceiptDetails sale={sale} />
      </div>
    </div>
  );
}

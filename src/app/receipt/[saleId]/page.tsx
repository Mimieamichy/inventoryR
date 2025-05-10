
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSales } from '@/contexts/SaleContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Sale } from '@/types';
import { ReceiptDetails } from '@/components/receipt/ReceiptDetails';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Frown, ShieldAlert, Loader2 } from "lucide-react"
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
  
  // Updated sale state: undefined (initial), "loading", Sale object, or "not_found", "access_denied"
  const [saleFetchState, setSaleFetchState] = useState<Sale | "loading" | "not_found" | "access_denied" | undefined>(undefined);


  useEffect(() => {
    if (authLoading) {
        setSaleFetchState(undefined); // Wait for auth to resolve
        return;
    }

    if (!isAuthenticated) {
      toast({ title: "Authentication Required", description: "Please login to view receipts.", variant: "default"});
      router.push('/login');
      return;
    }

    if (saleId && currentUser) {
      setSaleFetchState("loading");
      getSaleById(saleId)
        .then(foundSale => {
          if (foundSale) {
            // API should handle permission checks, but double check client-side for UI clarity
            if (isAdmin || (isCashier && currentUser && foundSale.cashierId === currentUser.username)) {
              setSaleFetchState(foundSale);
            } else {
              setSaleFetchState("access_denied");
              toast({ title: "Access Denied", description: "You do not have permission to view this receipt.", variant: "destructive"});
            }
          } else {
            setSaleFetchState("not_found");
            // Toast for not found is handled by the getSaleById in context if API returns 404
          }
        })
        .catch(err => {
          console.error("Error fetching receipt:", err);
          setSaleFetchState("not_found"); // Generic error state, API might have toasted already
          toast({ title: "Error", description: "Could not load receipt details.", variant: "destructive" });
        });
    } else if (!currentUser && isAuthenticated) {
        setSaleFetchState("not_found"); // Or some other error state
        toast({ title: "User data incomplete", description: "Cannot fetch receipt without user details.", variant: "destructive" });
    }

  }, [saleId, getSaleById, authLoading, isAuthenticated, isAdmin, isCashier, currentUser, router, toast]);

  if (authLoading || saleFetchState === undefined || saleFetchState === "loading") {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6 py-8">
        <div className="flex justify-center items-center p-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        <Skeleton className="h-12 w-1/2 mx-auto" />
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-1/3 mx-auto" />
      </div>
    );
  }

  if (saleFetchState === "not_found" || saleFetchState === "access_denied") {
    const isAccessDenied = saleFetchState === "access_denied";
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            {isAccessDenied ? <ShieldAlert className="w-16 h-16 text-destructive mb-4" /> : <Frown className="w-16 h-16 text-destructive mb-4" />}
            <Alert variant="destructive" className="max-w-md">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{isAccessDenied ? "Access Denied" : "Receipt Not Found"}</AlertTitle>
                <AlertDescription>
                {isAccessDenied 
                  ? "You do not have permission to view this receipt." 
                  : `The sale receipt with ID "${saleId}" could not be found.`}
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
  // At this point, saleFetchState is a Sale object
  const sale = saleFetchState as Sale;

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

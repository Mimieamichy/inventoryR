"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSales } from '@/contexts/SaleContext';
import type { Sale } from '@/types';
import { ReceiptDetails } from '@/components/receipt/ReceiptDetails';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Frown } from "lucide-react"
import { Button } from '@/components/ui/button';
import Link from 'next/link';


export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const saleId = params.saleId as string;
  const { getSaleById } = useSales();
  const [sale, setSale] = useState<Sale | undefined | null>(undefined); // undefined for loading, null for not found

  useEffect(() => {
    if (saleId) {
      const foundSale = getSaleById(saleId);
      setSale(foundSale || null); // Set to null if not found after attempting to fetch
    }
  }, [saleId, getSaleById]);

  if (sale === undefined) { // Loading state
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

  if (sale === null) { // Not found state
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
             <Frown className="w-16 h-16 text-destructive mb-4" />
            <Alert variant="destructive" className="max-w-md">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Receipt Not Found</AlertTitle>
                <AlertDescription>
                The sale receipt with ID "{saleId}" could not be found. It might have been deleted or the ID is incorrect.
                </AlertDescription>
            </Alert>
            <Button asChild variant="outline" className="mt-6">
                <Link href="/cashier/sales-history">Go to Sales History</Link>
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
          }
          header, footer, button { 
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

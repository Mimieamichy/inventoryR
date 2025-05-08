// src/app/api/sales/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { readJsonFile, SALES_FILE_PATH, getAuthenticatedUser } from '@/lib/apiUtils';
import type { Sale } from '@/types';

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const saleId = params.id;
    const sales = await readJsonFile<Sale[]>(SALES_FILE_PATH);
    const sale = sales.find(s => s.id === saleId);

    if (!sale) {
      return NextResponse.json({ message: 'Sale not found' }, { status: 404 });
    }

    // Admin can view any sale, cashier can only view their own sales
    if (user.role === 'admin' || (user.role === 'cashier' && sale.cashierId === user.username)) {
      return NextResponse.json(sale, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Forbidden: You do not have permission to view this sale.' }, { status: 403 });
    }
  } catch (error) {
    console.error(`Get sale ${params.id} error:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

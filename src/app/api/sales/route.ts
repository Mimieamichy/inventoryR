// src/app/api/sales/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  readJsonFile,
  writeJsonFile,
  SALES_FILE_PATH,
  PRODUCTS_FILE_PATH,
  getAuthenticatedUser
} from '@/lib/apiUtils';
import type { Sale, SaleItem, Product, CartItem } from '@/types';
import { z } from 'zod';

const TAX_RATE = 0.10; // Define TAX_RATE if not imported

const saleItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  sku: z.string(),
  price: z.number(),
  quantity: z.number().int().positive(),
});

const createSaleSchema = z.object({
  cartItems: z.array(
    z.object({
      id: z.string(), // product ID
      name: z.string(),
      sku: z.string(),
      price: z.number().positive(),
      cartQuantity: z.number().int().positive(),
      quantity: z.number().int().min(0), // Available stock, not used for sale creation logic here, but part of CartItem type
      imageUrl: z.string().url().optional().or(z.literal('')),
    })
  ).min(1),
  // cashierId is derived from authenticated user
});

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const sales = await readJsonFile<Sale[]>(SALES_FILE_PATH);

    if (user.role === 'admin') {
      return NextResponse.json(sales, { status: 200 });
    } else if (user.role === 'cashier') {
      const cashierSales = sales.filter(s => s.cashierId === user.username);
      return NextResponse.json(cashierSales, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
  } catch (error) {
    console.error('Get sales error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || (user.role !== 'cashier' && user.role !== 'admin')) {
      return NextResponse.json({ message: 'Forbidden: Only cashiers or admins can create sales.' }, { status: 403 });
    }

    const body = await req.json();
    const validation = createSaleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input', errors: validation.error.errors }, { status: 400 });
    }

    const { cartItems } = validation.data;

    let products = await readJsonFile<Product[]>(PRODUCTS_FILE_PATH);
    const saleItems: SaleItem[] = [];
    let subtotal = 0;

    // Validate stock and prepare sale items
    for (const cartItem of cartItems) {
      const productIndex = products.findIndex(p => p.id === cartItem.id);
      if (productIndex === -1) {
        return NextResponse.json({ message: `Product with ID ${cartItem.id} not found.` }, { status: 400 });
      }
      const product = products[productIndex];
      if (product.quantity < cartItem.cartQuantity) {
        return NextResponse.json({ message: `Not enough stock for ${product.name}. Available: ${product.quantity}, Requested: ${cartItem.cartQuantity}` }, { status: 409 });
      }
      
      products[productIndex].quantity -= cartItem.cartQuantity; // Decrease stock

      saleItems.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        quantity: cartItem.cartQuantity,
      });
      subtotal += product.price * cartItem.cartQuantity;
    }

    const taxAmount = subtotal * TAX_RATE;
    const total = subtotal + taxAmount;

    const newSale: Sale = {
      id: new Date().toISOString() + Math.random().toString(36).substring(2,9),
      items: saleItems,
      subtotal,
      taxRate: TAX_RATE,
      taxAmount,
      total,
      timestamp: new Date().toISOString(),
      cashierId: user.username,
    };

    const sales = await readJsonFile<Sale[]>(SALES_FILE_PATH);
    sales.push(newSale);

    // Atomically write both files (or use a transaction if DB) - simplified here
    await writeJsonFile(PRODUCTS_FILE_PATH, products);
    await writeJsonFile(SALES_FILE_PATH, sales);

    return NextResponse.json(newSale, { status: 201 });
  } catch (error) {
    console.error('Create sale error:', error);
    // Potentially revert product quantity changes if error occurs after stock update but before sale save
    return NextResponse.json({ message: 'Internal server error during sale creation' }, { status: 500 });
  }
}

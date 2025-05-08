// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile, PRODUCTS_FILE_PATH, getAuthenticatedUser } from '@/lib/apiUtils';
import type { Product } from '@/types';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(3),
  sku: z.string().min(3),
  price: z.number().positive(),
  quantity: z.number().int().min(0),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

export async function GET(req: NextRequest) {
  try {
    // Publicly accessible or add auth check if needed
    // const user = await getAuthenticatedUser(req);
    // if (!user) {
    //   return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }
    const products = await readJsonFile<Product[]>(PRODUCTS_FILE_PATH);
    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Only admins can add products.' }, { status: 403 });
    }

    const body = await req.json();
    const validation = productSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input', errors: validation.error.errors }, { status: 400 });
    }

    const { name, sku, price, quantity, imageUrl } = validation.data;
    const products = await readJsonFile<Product[]>(PRODUCTS_FILE_PATH);

    if (products.find(p => p.sku === sku)) {
      return NextResponse.json({ message: 'Product with this SKU already exists' }, { status: 409 });
    }

    const newProduct: Product = {
      id: new Date().toISOString() + Math.random().toString(36).substring(2,9),
      name,
      sku,
      price,
      quantity,
      imageUrl: imageUrl || undefined,
      'data-ai-hint': name.split(' ')[0].toLowerCase(),
    };

    products.push(newProduct);
    await writeJsonFile(PRODUCTS_FILE_PATH, products);

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Add product error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

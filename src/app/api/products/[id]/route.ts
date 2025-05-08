// src/app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile, PRODUCTS_FILE_PATH, getAuthenticatedUser } from '@/lib/apiUtils';
import type { Product } from '@/types';
import { z } from 'zod';

const productUpdateSchema = z.object({
  name: z.string().min(3).optional(),
  sku: z.string().min(3).optional(), // SKU generally shouldn't change, but allowed here
  price: z.number().positive().optional(),
  quantity: z.number().int().min(0).optional(),
  imageUrl: z.string().url().optional().nullable(),
});

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const productId = params.id;
    const products = await readJsonFile<Product[]>(PRODUCTS_FILE_PATH);
    const product = products.find(p => p.id === productId);

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error(`Get product ${params.id} error:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Only admins can update products.' }, { status: 403 });
    }

    const productId = params.id;
    const body = await req.json();
    const validation = productUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input', errors: validation.error.errors }, { status: 400 });
    }

    let products = await readJsonFile<Product[]>(PRODUCTS_FILE_PATH);
    const productIndex = products.findIndex(p => p.id === productId);

    if (productIndex === -1) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    const updatedProduct = { ...products[productIndex], ...validation.data };
    if (validation.data.name) { // Update ai-hint if name changes
        updatedProduct['data-ai-hint'] = validation.data.name.split(" ")[0].toLowerCase();
    }

    products[productIndex] = updatedProduct;
    await writeJsonFile(PRODUCTS_FILE_PATH, products);

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    console.error(`Update product ${params.id} error:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Only admins can delete products.' }, { status: 403 });
    }

    const productId = params.id;
    let products = await readJsonFile<Product[]>(PRODUCTS_FILE_PATH);
    const initialLength = products.length;
    products = products.filter(p => p.id !== productId);

    if (products.length === initialLength) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    await writeJsonFile(PRODUCTS_FILE_PATH, products);
    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Delete product ${params.id} error:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

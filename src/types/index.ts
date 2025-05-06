
export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  'data-ai-hint'?: string; // For picsum image generation hints
}

export interface CartItem extends Product {
  cartQuantity: number;
}

export interface SaleItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
}

export interface Sale {
  id:string;
  items: SaleItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  timestamp: string;
  cashierId: string; // Will correspond to User.username
}

export type UserRole = 'admin' | 'cashier';

export interface User {
  id: string;
  username: string;
  password?: string; // IMPORTANT: Only for simulation. DO NOT store plain text passwords in production.
  role: UserRole;
  name: string;
}

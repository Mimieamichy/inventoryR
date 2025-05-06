export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  imageUrl?: string;
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
  id: string;
  items: SaleItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  timestamp: string;
  cashierId: string;
}

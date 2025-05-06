"use client";

import Image from 'next/image';
import type { CartItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/contexts/CartContext';
import { MinusCircle, PlusCircle, XCircle } from 'lucide-react';

interface CartItemCardProps {
  item: CartItem;
}

export function CartItemCard({ item }: CartItemCardProps) {
  const { updateCartQuantity, removeFromCart } = useCart();

  const handleQuantityChange = (newQuantity: number) => {
    updateCartQuantity(item.id, newQuantity);
  };

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg shadow-sm bg-card hover:shadow-md transition-shadow">
      <Image
        src={item.imageUrl || `https://picsum.photos/seed/${item.id}/100/100`}
        alt={item.name}
        width={80}
        height={80}
        className="rounded-md object-cover aspect-square"
        data-ai-hint={item.name.split(" ")[0].toLowerCase() + (item.name.split(" ")[1] ? " " + item.name.split(" ")[1].toLowerCase() : "")}
      />
      <div className="flex-grow">
        <h3 className="font-semibold text-card-foreground">{item.name}</h3>
        <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
        <p className="text-sm text-primary font-medium">${item.price.toFixed(2)} each</p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleQuantityChange(item.cartQuantity - 1)}
          disabled={item.cartQuantity <= 1}
          aria-label="Decrease quantity"
        >
          <MinusCircle className="h-5 w-5" />
        </Button>
        <Input
          type="number"
          value={item.cartQuantity}
          onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
          min="1"
          max={item.quantity} // Max available stock
          className="w-16 h-9 text-center"
          aria-label="Item quantity"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleQuantityChange(item.cartQuantity + 1)}
          disabled={item.cartQuantity >= item.quantity}
          aria-label="Increase quantity"
        >
          <PlusCircle className="h-5 w-5" />
        </Button>
      </div>
      <div className="font-semibold text-card-foreground w-20 text-right">
        ${(item.price * item.cartQuantity).toFixed(2)}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive hover:text-destructive/80"
        onClick={() => removeFromCart(item.id)}
        aria-label="Remove item"
      >
        <XCircle className="h-5 w-5" />
      </Button>
    </div>
  );
}

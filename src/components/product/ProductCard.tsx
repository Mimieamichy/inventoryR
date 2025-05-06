"use client";

import Image from 'next/image';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();

  const handleAddToCart = () => {
    if (quantity <= 0) {
      toast({ title: "Invalid quantity", description: "Please enter a quantity greater than 0.", variant: "destructive"});
      return;
    }
    if (product.quantity < quantity) {
      toast({ title: "Not enough stock", description: `Only ${product.quantity} of ${product.name} available.`, variant: "destructive"});
      return;
    }
    addToCart(product, quantity);
    setQuantity(1); // Reset quantity after adding
  };

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-0 relative">
        <div className="aspect-[4/3] w-full overflow-hidden">
         <Image
            src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/300`}
            alt={product.name}
            width={400}
            height={300}
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={product.name.split(" ")[0].toLowerCase() + (product.name.split(" ")[1] ? " " + product.name.split(" ")[1].toLowerCase() : "")}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-semibold mb-1">{product.name}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground mb-1">SKU: {product.sku}</CardDescription>
        <p className="text-xs text-muted-foreground mb-2">Stock: {product.quantity > 0 ? product.quantity : <span className="text-destructive font-semibold">Out of stock</span>}</p>
        <p className="text-lg font-bold text-primary">${product.price.toFixed(2)}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center gap-2">
        <Input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          min="1"
          max={product.quantity}
          className="w-20 h-9 text-center"
          disabled={product.quantity === 0}
        />
        <Button 
          onClick={handleAddToCart} 
          className="flex-1 bg-primary hover:bg-primary/90"
          disabled={product.quantity === 0}
          aria-label={`Add ${product.name} to cart`}
        >
          <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}

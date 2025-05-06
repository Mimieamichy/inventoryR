"use client";

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useProducts } from '@/contexts/ProductContext';
import { useToast } from '@/hooks/use-toast';
import { PackagePlus } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(3, { message: "Product name must be at least 3 characters." }),
  sku: z.string().min(3, { message: "SKU must be at least 3 characters." }),
  price: z.coerce.number().positive({ message: "Price must be a positive number." }),
  quantity: z.coerce.number().int().min(0, { message: "Quantity must be a non-negative integer." }),
  imageUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});

type ProductFormData = z.infer<typeof productSchema>;

export function ProductForm() {
  const { addProduct } = useProducts();
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  const onSubmit: SubmitHandler<ProductFormData> = (data) => {
    addProduct(data);
    toast({
      title: "Product Added",
      description: `${data.name} has been successfully added to the catalog.`,
    });
    reset();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center">
          <PackagePlus className="mr-2 h-6 w-6 text-primary" /> Add New Product
        </CardTitle>
        <CardDescription>Fill in the details below to add a new product to the inventory.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input id="name" {...register("name")} placeholder="e.g., Organic Bananas" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
            <Input id="sku" {...register("sku")} placeholder="e.g., FRU-BAN-001" />
            {errors.sku && <p className="text-sm text-destructive">{errors.sku.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input id="price" type="number" step="0.01" {...register("price")} placeholder="e.g., 0.99" />
              {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Initial Quantity</Label>
              <Input id="quantity" type="number" {...register("quantity")} placeholder="e.g., 100" />
              {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL (Optional)</Label>
            <Input id="imageUrl" {...register("imageUrl")} placeholder="e.g., https://example.com/image.jpg" />
            {errors.imageUrl && <p className="text-sm text-destructive">{errors.imageUrl.message}</p>}
          </div>

          <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            <PackagePlus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

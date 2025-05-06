
"use client";

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Users, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { User, UserRole } from '@/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const userSchema = z.object({
  name: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  role: z.enum(['cashier'], { message: "Role must be 'cashier'." }), // Admin can only add cashiers
});

type UserFormData = z.infer<typeof userSchema>;

export default function ManageUsersPage() {
  const { registerUser, users, isAdmin, loading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'cashier',
    }
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      toast({ title: "Access Denied", description: "You must be an admin to access this page.", variant: "destructive"});
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, isAdmin, router, toast]);

  const onSubmit: SubmitHandler<UserFormData> = (data) => {
    const newUser = registerUser(data as Omit<User, 'id'>); // Role is fixed to cashier, so this cast is safe.
    if (newUser) {
      reset();
    }
  };

  if (authLoading || !isAdmin) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">Checking permissions...</div>;
  }

  const cashiers = users.filter(user => user.role === 'cashier');

  return (
    <div className="space-y-8">
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center">
            <UserPlus className="mr-2 h-6 w-6 text-primary" /> Add New Cashier
          </CardTitle>
          <CardDescription>Fill in the details to create a new cashier account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...register("name")} placeholder="e.g., Jane Doe" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" {...register("username")} placeholder="e.g., janedoe" />
              {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} placeholder="Min. 6 characters" />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            
            {/* Role is fixed to cashier, so no input field is needed, but it's part of the schema */}
             <input type="hidden" {...register("role")} value="cashier" />


            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              <UserPlus className="mr-2 h-4 w-4" /> Add Cashier
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center">
            <Users className="mr-2 h-6 w-6 text-primary" /> Existing Cashiers
          </CardTitle>
          <CardDescription>List of all registered cashier accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          {cashiers.length > 0 ? (
            <ul className="space-y-3">
              {cashiers.map((cashier) => (
                <li key={cashier.id} className="flex justify-between items-center p-3 bg-secondary/50 rounded-md">
                  <div>
                    <p className="font-semibold text-secondary-foreground">{cashier.name}</p>
                    <p className="text-sm text-muted-foreground">Username: {cashier.username}</p>
                  </div>
                   <p className="text-xs text-muted-foreground">ID: {cashier.id.substring(0,10)}...</p>
                </li>
              ))}
            </ul>
          ) : (
             <Alert variant="default">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle className="font-semibold">No Cashiers Yet</AlertTitle>
                <AlertDescription>
                  There are no cashier accounts registered. Use the form above to add a new cashier.
                </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

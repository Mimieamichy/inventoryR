
"use client";

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth, DEFAULT_ADMIN_USER } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Users, AlertTriangle, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { User } from '@/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const userSchema = z.object({
  name: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  role: z.enum(['cashier'], { message: "Role must be 'cashier'." }),
});

type UserFormData = z.infer<typeof userSchema>;

export default function ManageUsersPage() {
  const { registerUser, users, isAdmin, loading: authLoading, isAuthenticated, deleteUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);


  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'cashier',
    }
  });
  
  useEffect(() => {
    setIsClient(true);
  }, []);


  useEffect(() => {
    if (isClient && !authLoading && (!isAuthenticated || !isAdmin)) {
      toast({ title: "Access Denied", description: "You must be an admin to access this page.", variant: "destructive"});
      router.push('/login');
    }
  }, [isClient, authLoading, isAuthenticated, isAdmin, router, toast]);

  const onSubmit: SubmitHandler<UserFormData> = async (data) => {
    const newUser = registerUser(data as Omit<User, 'id'>);
    if (newUser) {
      reset();
    }
  };

  const handleDeleteClick = (user: User) => {
    if (user.id === DEFAULT_ADMIN_USER.id) {
        toast({ title: "Action Denied", description: "The default admin user cannot be deleted.", variant: "destructive"});
        return;
    }
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      const success = await deleteUser(userToDelete.id);
      if (success) {
        // Optionally, you can trigger a re-fetch or rely on the context's state update
      }
      setUserToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };
  
  if (!isClient || authLoading || (isClient && !isAdmin && isAuthenticated) ) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">Checking permissions...</div>;
  }
   if (isClient && !isAuthenticated) {
     // This case should ideally be handled by the redirect effect,
     // but as a fallback or if routing is slow.
     return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">Redirecting to login...</div>;
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
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">ID: {cashier.id.substring(0,10)}...</p>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(cashier)}
                        disabled={cashier.id === DEFAULT_ADMIN_USER.id}
                      >
                        <Trash2 className="mr-1 h-4 w-4" /> Delete
                      </Button>
                  </div>
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

      {userToDelete && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the user account 
                for <span className="font-semibold">{userToDelete.name} ({userToDelete.username})</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
                Yes, delete user
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

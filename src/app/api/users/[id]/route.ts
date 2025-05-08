// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile, USERS_FILE_PATH, getAuthenticatedUser, defaultAdminUser } from '@/lib/apiUtils';
import type { User } from '@/types';
import { z } from 'zod';

const userUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  // username: z.string().min(3).optional(), // Username change can be complex, omit for now
  password: z.string().min(6).optional(), // For password updates
  role: z.enum(['admin', 'cashier']).optional(),
});

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const requestingUser = await getAuthenticatedUser(req);
    if (!requestingUser || requestingUser.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Only admins can view user details.' }, { status: 403 });
    }

    const userId = params.id;
    const users = await readJsonFile<User[]>(USERS_FILE_PATH);
    const user = users.find(u => u.id === userId);

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword, { status: 200 });
  } catch (error) {
    console.error(`Get user ${params.id} error:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const requestingUser = await getAuthenticatedUser(req);
    if (!requestingUser || requestingUser.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Only admins can update users.' }, { status: 403 });
    }

    const userId = params.id;
    if (userId === defaultAdminUser.id && requestingUser.id !== defaultAdminUser.id) {
        return NextResponse.json({ message: 'Forbidden: Default admin user cannot be modified by other admins.' }, { status: 403 });
    }
     if (userId === defaultAdminUser.id && body.role && body.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden: Default admin user role cannot be changed.' }, { status: 403 });
    }


    const body = await req.json();
    const validation = userUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input', errors: validation.error.errors }, { status: 400 });
    }
    
    let users = await readJsonFile<User[]>(USERS_FILE_PATH);
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const updatedUserData = { ...users[userIndex], ...validation.data };
    // If password is in body, it will overwrite. In a real app, hash new password.
    // If role is updated for the default admin, prevent it if it's not 'admin'
    if (users[userIndex].id === defaultAdminUser.id && updatedUserData.role && updatedUserData.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden: Default admin user role cannot be changed from admin.' }, { status: 403 });
    }


    users[userIndex] = updatedUserData;
    await writeJsonFile(USERS_FILE_PATH, users);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = updatedUserData;
    return NextResponse.json(userWithoutPassword, { status: 200 });
  } catch (error) {
    console.error(`Update user ${params.id} error:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const requestingUser = await getAuthenticatedUser(req);
    if (!requestingUser || requestingUser.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Only admins can delete users.' }, { status: 403 });
    }

    const userId = params.id;
    if (userId === defaultAdminUser.id) {
      return NextResponse.json({ message: 'Forbidden: Default admin user cannot be deleted.' }, { status: 403 });
    }

    let users = await readJsonFile<User[]>(USERS_FILE_PATH);
    const initialLength = users.length;
    users = users.filter(u => u.id !== userId);

    if (users.length === initialLength) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    await writeJsonFile(USERS_FILE_PATH, users);
    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Delete user ${params.id} error:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

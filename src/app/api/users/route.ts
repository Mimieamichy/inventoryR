// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile, USERS_FILE_PATH, getAuthenticatedUser } from '@/lib/apiUtils';
import type { User } from '@/types';
import { z } from 'zod';

// This schema is same as /api/auth/register, but this endpoint is admin-only for user management
const userCreationSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(['cashier']), // Admin creates cashiers
});

export async function GET(req: NextRequest) {
  try {
    const requestingUser = await getAuthenticatedUser(req);
    if (!requestingUser || requestingUser.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Only admins can view users.' }, { status: 403 });
    }

    const users = await readJsonFile<User[]>(USERS_FILE_PATH);
    // Exclude passwords from the response
    const usersWithoutPasswords = users.map(u => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...user } = u;
      return user;
    });
    return NextResponse.json(usersWithoutPasswords, { status: 200 });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const requestingUser = await getAuthenticatedUser(req);
    if (!requestingUser || requestingUser.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Only admins can create users.' }, { status: 403 });
    }

    const body = await req.json();
    const validation = userCreationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input', errors: validation.error.errors }, { status: 400 });
    }
    
    const { name, username, password, role } = validation.data;
    const users = await readJsonFile<User[]>(USERS_FILE_PATH);

    if (users.find(user => user.username === username)) {
      return NextResponse.json({ message: 'Username already exists' }, { status: 409 });
    }

    const newUser: User = {
      id: new Date().toISOString() + Math.random().toString(36).substring(2,9),
      name,
      username,
      password, // Store password (hash in real app)
      role,
    };

    users.push(newUser);
    await writeJsonFile(USERS_FILE_PATH, users);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile, USERS_FILE_PATH, getAuthenticatedUser } from '@/lib/apiUtils';
import type { User } from '@/types';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(['cashier']), // Admins can only register cashiers via this endpoint
});

export async function POST(req: NextRequest) {
  try {
    const requestingUser = await getAuthenticatedUser(req);
    if (!requestingUser || requestingUser.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized: Only admins can register users.' }, { status: 403 });
    }

    const body = await req.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input', errors: validation.error.errors }, { status: 400 });
    }

    const { name, username, password, role } = validation.data;

    const users = await readJsonFile<User[]>(USERS_FILE_PATH);

    if (users.find(user => user.username === username)) {
      return NextResponse.json({ message: 'Username already exists' }, { status: 409 });
    }

    const newUser: User = {
      id: new Date().toISOString() + Math.random().toString(36).substring(2, 9),
      name,
      username,
      password, // In a real app, hash this password
      role,
    };

    users.push(newUser);
    await writeJsonFile(USERS_FILE_PATH, users);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

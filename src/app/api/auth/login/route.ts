// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { readJsonFile, USERS_FILE_PATH } from '@/lib/apiUtils';
import type { User } from '@/types';
import { z } from 'zod';

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input', errors: validation.error.errors }, { status: 400 });
    }

    const { username, password } = validation.data;
    const users = await readJsonFile<User[]>(USERS_FILE_PATH);
    const user = users.find(u => u.username === username);

    if (!user || user.password !== password) { // Plain text password check (simulation only)
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 });
    }

    // In a real app, generate a session token (e.g., JWT)
    // For this simulation, we return the user object (excluding password) as a "token"
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
    
    // The "token" here is just the user's ID for simplicity in this simulated environment
    return NextResponse.json({ user: userWithoutPassword, token: user.id }, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

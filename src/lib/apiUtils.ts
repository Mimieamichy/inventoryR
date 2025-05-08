import { promises as fs } from 'fs';
import path from 'path';
import type { NextRequest } from 'next/server';
import type { User, Product, Sale } from '@/types';

const DATA_DIR = path.resolve(process.cwd(), 'src/data');
export const USERS_FILE_PATH = path.join(DATA_DIR, 'users.json');
export const PRODUCTS_FILE_PATH = path.join(DATA_DIR, 'products.json');
export const SALES_FILE_PATH = path.join(DATA_DIR, 'sales.json');

// Helper to read JSON file
export async function readJsonFile<T>(filePath: string): Promise<T> {
  try {
    const fileData = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileData) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // If file not found, return default based on type (e.g. empty array for lists)
      if (filePath.includes('users.json') || filePath.includes('products.json') || filePath.includes('sales.json')) {
        return [] as T;
      }
    }
    console.error(`Error reading JSON file ${filePath}:`, error);
    throw new Error(`Could not read data from ${filePath}`);
  }
}

// Helper to write JSON file
export async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing JSON file ${filePath}:`, error);
    throw new Error(`Could not write data to ${filePath}`);
  }
}

// Simulated authentication: extracts user from a hypothetical Authorization header
// For production, use a proper auth mechanism (e.g., JWT, next-auth)
export async function getAuthenticatedUser(req: NextRequest): Promise<User | null> {
  const authHeader = req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const userId = authHeader.substring(7); // Extract "token" (userId in this simulation)
    if (!userId) return null;

    try {
      const users = await readJsonFile<User[]>(USERS_FILE_PATH);
      const user = users.find(u => u.id === userId);
      return user || null;
    } catch (error) {
      console.error('Error fetching user for auth:', error);
      return null;
    }
  }
  return null;
}

export const defaultAdminUser: User = {
  id: 'admin-001',
  username: 'admin',
  password: 'password',
  role: 'admin',
  name: 'Administrator',
};

// Ensure users.json exists and has the admin user if empty
export async function initializeUsersFile() {
  try {
    let users = await readJsonFile<User[]>(USERS_FILE_PATH);
    if (!users || users.length === 0) {
      await writeJsonFile<User[]>(USERS_FILE_PATH, [defaultAdminUser]);
    } else {
      const adminExists = users.some(user => user.id === defaultAdminUser.id);
      if (!adminExists) {
        users.push(defaultAdminUser);
        await writeJsonFile<User[]>(USERS_FILE_PATH, users);
      }
    }
  } catch (error) {
     // If file doesn't exist, ENOENT error from readJsonFile would be caught earlier.
     // This specific catch is for if read is ok, but write fails or some other logic error.
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        await writeJsonFile<User[]>(USERS_FILE_PATH, [defaultAdminUser]);
    } else {
        console.error('Failed to initialize users.json:', error);
    }
  }
}

// Initialize data files on server start (conceptual)
// In Next.js, this might run when API routes are first hit or during build.
// For this example, we can call initializeUsersFile where needed or assume it's handled.
initializeUsersFile();

// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // In a stateless API (like this one with simulated auth), logout is typically handled client-side
  // by clearing the token/session info.
  // A stateful backend might invalidate a session token here.
  return NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
}

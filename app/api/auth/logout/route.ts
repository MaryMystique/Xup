import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTokenFromCookies, verifyToken } from '@/lib/auth';

/**
 * POST /api/auth/logout
 * Logout user
 * 
 * FLOW:
 * 1. Get token from cookies
 * 2. Mark user as offline in database
 * 3. Delete token cookie
 */
export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const token = getTokenFromCookies(cookieHeader);

    if (token) {
      const decoded = verifyToken(token);
      
      if (decoded) {
        // Mark user as offline
        await prisma.user.update({
          where: { id: decoded.userId },
          data: { status: 'offline' },
        });
      }
    }

    // Delete token cookie by setting Max-Age to 0
    return NextResponse.json(
      { message: 'Logged out successfully' },
      {
        status: 200,
        headers: {
          'Set-Cookie': 'token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
        },
      }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
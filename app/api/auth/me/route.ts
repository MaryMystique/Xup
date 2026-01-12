import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTokenFromCookies, verifyToken } from '@/lib/auth';

/**
 * GET /api/auth/me
 * Get currently logged-in user info
 * 
 * FLOW:
 * 1. Extract token from cookies
 * 2. Verify token is valid
 * 3. Fetch user from database
 * 4. Return user info (without password!)
 * 
 * USE CASE:
 * - When dashboard loads, call this to check who's logged in
 * - If token invalid, redirect to login
 */
export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const token = getTokenFromCookies(cookieHeader);

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Fetch fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        // IMPORTANT: Don't select password!
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
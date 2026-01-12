import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, createToken } from '@/lib/auth';

/**
 * POST /api/auth/login
 * Login existing user
 * 
 * FLOW:
 * 1. Receive email + password
 * 2. Find user in database by email
 * 3. Compare password with stored hash
 * 4. If match → create token
 * 5. Return token + user info
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // VALIDATION: Check required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // FIND USER: Look up by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Check if user exists
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 } // 401 = Unauthorized
      );
    }

    // VERIFY PASSWORD: Compare with hashed version
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // UPDATE STATUS: Mark user as online
    await prisma.user.update({
      where: { id: user.id },
      data: { status: 'online' },
    });

    // CREATE TOKEN: Generate JWT
    const token = createToken(user.id, user.email, user.role);

    // SUCCESS RESPONSE
    return NextResponse.json(
      {
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: 'online',
        },
      },
      {
        status: 200,
        headers: {
          'Set-Cookie': `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`,
        },
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
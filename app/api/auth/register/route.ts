import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, createToken } from '@/lib/auth';

/**
 * POST /api/auth/register
 * Create a new agent/admin account
 * 
 * FLOW:
 * 1. Receive email, password, name from frontend form
 * 2. Check if email already exists (can't have duplicates)
 * 3. Hash the password (encrypt it)
 * 4. Save user to database
 * 5. Create JWT token for auto-login
 * 6. Return token + user info
 */
export async function POST(request: Request) {
  try {
    // Parse JSON body from request
    const body = await request.json();
    const { email, password, name, role = 'agent' } = body;

    // VALIDATION: Check all required fields are present
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 } // 400 = Bad Request
      );
    }

    // VALIDATION: Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 } // 409 = Conflict (duplicate)
      );
    }

    // SECURITY: Hash password before storing
    const hashedPassword = await hashPassword(password);

    // CREATE USER: Save to database
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword, // Store encrypted version only!
        name,
        role, // "agent" or "admin"
        status: 'offline',
      },
    });

    // CREATE TOKEN: Auto-login after registration
    const token = createToken(user.id, user.email, user.role);

    // SUCCESS RESPONSE
    return NextResponse.json(
      {
        message: 'User created successfully',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { 
        status: 201, // 201 = Created
        headers: {
          // Set token as HTTP-only cookie (more secure than localStorage)
          'Set-Cookie': `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`, // 7 days
        },
      }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 } // 500 = Server Error
    );
  }
}
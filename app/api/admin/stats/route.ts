import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTokenFromCookies, verifyToken } from '@/lib/auth';

/**
 * GET /api/admin/stats
 * Get platform statistics (admin only)
 */
export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const token = getTokenFromCookies(cookieHeader);

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get stats
    const [totalChats, activeChats, resolvedChats, totalAgents] = await Promise.all([
      prisma.chat.count(),
      prisma.chat.count({ where: { status: 'active' } }),
      prisma.chat.count({ where: { status: 'resolved' } }),
      prisma.user.count(),
    ]);

    return NextResponse.json(
      {
        stats: {
          totalChats,
          activeChats,
          resolvedChats,
          totalAgents,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
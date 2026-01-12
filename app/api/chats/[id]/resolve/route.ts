import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTokenFromCookies, verifyToken } from '@/lib/auth';

/**
 * POST /api/chats/[id]/resolve
 * Mark a chat as resolved/closed
 * 
 * EXPLANATION:
 * - Agent clicks "Resolve Chat"
 * - Updates status to "resolved"
 * - Sets endedAt timestamp
 * - Creates system message
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const token = getTokenFromCookies(cookieHeader);

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const chatId = params.id;

    // Update chat status
    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: {
        status: 'resolved',
        endedAt: new Date(),
      },
      include: {
        customer: true,
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create system message
    await prisma.message.create({
      data: {
        chatId: chatId,
        senderType: 'system',
        senderId: 'system',
        content: 'Chat has been resolved',
      },
    });

    return NextResponse.json(
      {
        message: 'Chat resolved successfully',
        chat: updatedChat,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Resolve chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
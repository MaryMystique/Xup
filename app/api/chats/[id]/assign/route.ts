import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTokenFromCookies, verifyToken } from '@/lib/auth';

/**
 * POST /api/chats/[id]/assign
 * Assign a chat to an agent (or agent claims it)
 * 
 * EXPLANATION:
 * - Agent clicks "Accept Chat" in queue
 * - Updates chat status to "active"
 * - Assigns agent to the chat
 * - Creates system message "Agent X joined the chat"
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

    // Check if chat exists and is waiting
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { customer: true },
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (chat.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Chat is not available' },
        { status: 400 }
      );
    }

    // Assign chat to agent
    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: {
        agentId: decoded.userId,
        status: 'active',
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
        chatId: chat.id,
        senderType: 'system',
        senderId: 'system',
        content: `Agent ${decoded.email} joined the chat`,
      },
    });

    return NextResponse.json(
      {
        message: 'Chat assigned successfully',
        chat: updatedChat,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Assign chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
/**
 * Custom Next.js Server with Socket.io
 * 
 * EXPLANATION:
 * - Next.js doesn't support WebSockets by default
 * - We create a custom Node.js server
 * - Attach Socket.io to it
 * - Next.js handles pages, Socket.io handles real-time
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const prisma = new PrismaClient();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Initialize Socket.io
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_APP_URL
      : '*',
      methods: ['GET', 'POST'],
    },
  });

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);

    // Join a chat room
    socket.on('join-chat', (chatId) => {
      socket.join(`chat-${chatId}`);
      console.log(`📥 Socket ${socket.id} joined chat-${chatId}`);
    });

    // Leave chat room
    socket.on('leave-chat', (chatId) => {
      socket.leave(`chat-${chatId}`);
      console.log(`📤 Socket ${socket.id} left chat-${chatId}`);
    });

    // Handle new message
    socket.on('send-message', async (data) => {
      try {
        const { chatId, content, senderType, senderId, senderName } = data;

        // Save message to database
        const message = await prisma.message.create({
          data: {
            chatId,
            content,
            senderType,
            senderId,
          },
        });

        // Broadcast to all users in chat room
        io.to(`chat-${chatId}`).emit('new-message', {
          ...message,
          senderName,
        });

        console.log(`💬 Message sent in chat-${chatId}`);
      } catch (error) {
        console.error('Error saving message:', error);
        socket.emit('message-error', { error: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      socket.to(`chat-${data.chatId}`).emit('user-typing', {
        chatId: data.chatId,
        userName: data.userName,
      });
    });

    // Stop typing
    socket.on('stop-typing', (data) => {
      socket.to(`chat-${data.chatId}`).emit('user-stop-typing', {
        chatId: data.chatId,
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log('> Socket.io server is running');
  });
});
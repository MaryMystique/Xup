import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { verifyToken } from './auth';

/**
 * Socket.io Server Setup
 * 
 * EXPLANATION:
 * - WebSockets = Two-way real-time communication
 * - HTTP = Request → Response (one direction)
 * - WebSocket = Persistent connection, messages flow both ways instantly
 * 
 * EVENTS WE'LL HANDLE:
 * - "join-chat" - User joins a specific chat room
 * - "send-message" - User sends a message
 * - "typing" - User is typing indicator
 * - "stop-typing" - User stopped typing
 */

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Authenticate user (for agents)
    socket.on('authenticate', (token: string) => {
      const decoded = verifyToken(token);
      if (decoded) {
        socket.data.userId = decoded.userId;
        socket.data.role = decoded.role;
        console.log('User authenticated:', decoded.email);
      }
    });

    // Join a specific chat room
    socket.on('join-chat', (chatId: string) => {
      socket.join(`chat-${chatId}`);
      console.log(`Socket ${socket.id} joined chat-${chatId}`);
    });

    // Leave a chat room
    socket.on('leave-chat', (chatId: string) => {
      socket.leave(`chat-${chatId}`);
      console.log(`Socket ${socket.id} left chat-${chatId}`);
    });

    // Send message
    socket.on('send-message', (data: {
      chatId: string;
      content: string;
      senderType: string;
      senderId: string;
    }) => {
      // Broadcast to all users in this chat room
      io?.to(`chat-${data.chatId}`).emit('new-message', data);
    });

    // Typing indicator
    socket.on('typing', (data: { chatId: string; userName: string }) => {
      socket.to(`chat-${data.chatId}`).emit('user-typing', data);
    });

    // Stop typing indicator
    socket.on('stop-typing', (data: { chatId: string }) => {
      socket.to(`chat-${data.chatId}`).emit('user-stop-typing', data);
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getSocketServer() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}
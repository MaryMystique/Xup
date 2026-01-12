'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useSocket } from '@/app/hooks/useSocket';

/**
 * Individual Chat Page
 * Real-time messaging between agent and customer
 */

interface Message {
  id: string;
  content: string;
  senderType: string;
  timestamp: string;
  senderName?: string;
}

interface Chat {
  id: string;
  customer: {
    name: string;
    email: string;
    totalChats: number;
  };
  status: string;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  
  const chatId = params.id as string;
  
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch chat details
  useEffect(() => {
    fetchChatDetails();
    fetchMessages();
  }, [chatId]);

  // Join socket room
  useEffect(() => {
    if (socket && chatId) {
      socket.emit('join-chat', chatId);

      // Listen for new messages
      socket.on('new-message', (message: Message) => {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      });

      // Listen for typing indicators
      socket.on('user-typing', (data: { userName: string }) => {
        setTypingUser(data.userName);
      });

      socket.on('user-stop-typing', () => {
        setTypingUser(null);
      });

      return () => {
        socket.emit('leave-chat', chatId);
        socket.off('new-message');
        socket.off('user-typing');
        socket.off('user-stop-typing');
      };
    }
  }, [socket, chatId]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatDetails = async () => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setChat(data.chat);
      }
    } catch (error) {
      console.error('Error fetching chat:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages?chatId=${chatId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        scrollToBottom();
      }
    } catch (error) {
         console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !socket || !user) return;

    // Stop typing indicator
    socket.emit('stop-typing', { chatId });

    // Send message via socket
    socket.emit('send-message', {
      chatId,
      content: newMessage,
      senderType: 'agent',
      senderId: user.id,
      senderName: user.name,
    });

    setNewMessage('');
  };

  const handleTyping = () => {
    if (!socket || !user) return;

    // Emit typing indicator
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { chatId, userName: user.name });
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of no activity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('stop-typing', { chatId });
    }, 2000);
  };

  const handleResolveChat = async () => {
    try {
      const response = await fetch(`/api/chats/${chatId}/resolve`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error resolving chat:', error);
    }
  };

  if (!chat) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* HEADER */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">{chat.customer.name}</h1>
            <p className="text-sm text-gray-600">{chat.customer.email}</p>
            <p className="text-xs text-gray-500">
              Previous chats: {chat.customer.totalChats}
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md"
            >
              Back
            </button>
            {chat.status === 'active' && (
              <button
                onClick={handleResolveChat}
                className="px-4 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-md"
              >
                Resolve Chat
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="max-w-4xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderType === 'agent' ? 'justify-end' : 'justify-start'
              } mb-4`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderType === 'agent'
                    ? 'bg-blue-600 text-white'
                    : message.senderType === 'system'
                    ? 'bg-gray-200 text-gray-600 text-center'
                    : 'bg-gray-300 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-75 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {/* TYPING INDICATOR */}
          {typingUser && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-200 px-4 py-2 rounded-lg">
                <p className="text-sm text-gray-600">{typingUser} is typing...</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* INPUT AREA */}
      <div className="bg-white border-t p-4">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!isConnected || chat.status === 'resolved'}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || !isConnected || chat.status === 'resolved'}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
          {!isConnected && (
            <p className="text-sm text-red-600 mt-2">Connecting to server...</p>
          )}
        </form>
      </div>
    </div>
  );
}
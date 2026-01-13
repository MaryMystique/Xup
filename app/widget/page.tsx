'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

/**
 * Customer Chat Widget
 * Embeddable chat interface for customers
 */

interface Message {
  id?: string;
  content: string;
  senderType: string;
  timestamp: string;
  senderName?: string;
}

export default function WidgetPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const [isOpen, setIsOpen] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  
  // Customer info form
  const [showForm, setShowForm] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [error, setError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('✅ Widget socket connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Widget socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Join socket room when chat is created
  useEffect(() => {
    if (socket && chatId) {
      socket.emit('join-chat', chatId);

      socket.on('new-message', (message: Message) => {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      });

      socket.on('user-typing', () => {
        setAgentTyping(true);
      });

      socket.on('user-stop-typing', () => {
        setAgentTyping(false);
      });

      return () => {
        socket.emit('leave-chat', chatId);
        socket.off('new-message');
        socket.off('user-typing');
        socket.off('user-stop-typing');
      };
    }
  }, [socket, chatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!customerName.trim() || !customerEmail.trim() || !initialMessage.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          initialMessage: initialMessage.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setChatId(data.chat.id);
        setMessages([
          {
            id: '1',
            content: initialMessage,
            senderType: 'customer',
            timestamp: new Date().toISOString(),
          },
          {
            id: '2',
            content: 'An agent will be with you shortly...',
            senderType: 'system',
            timestamp: new Date().toISOString(),
          },
        ]);
        setShowForm(false);
        setIsOpen(true);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to start chat');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      setError('Something went wrong. Please try again.');
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !socket || !chatId) return;

    // Stop typing
    if (isTyping) {
      socket.emit('stop-typing', { chatId });
      setIsTyping(false);
    }

    const messageData = {
      chatId,
      content: newMessage.trim(),
      senderType: 'customer',
      senderId: customerEmail,
      senderName: customerName,
    };

    // Send message via socket
    socket.emit('send-message', messageData);

    // Optimistically add message to UI
    setMessages(prev => [...prev, {
      content: newMessage.trim(),
      senderType: 'customer',
      timestamp: new Date().toISOString(),
    }]);

    setNewMessage('');
    scrollToBottom();
  };

  const handleTyping = () => {
    if (!socket || !chatId) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { chatId, userName: customerName });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('stop-typing', { chatId });
    }, 2000);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* CHAT BUBBLE */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110"
          aria-label="Open chat"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
      )}

      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl w-96 h-125 flex flex-col border border-gray-200">
          {/* HEADER */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">Xup Support</h3>
              <p className="text-sm opacity-90">
                {isConnected ? '● Online' : '○ Connecting...'}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-blue-700 rounded p-1 transition"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* FORM OR CHAT */}
          {showForm ? (
            // INITIAL FORM
            <div className="flex-1 p-4 overflow-y-auto">
              <form onSubmit={handleStartChat} className="space-y-4">
                <div>
                  <p className="text-gray-700 mb-4">
                    Hi! Fill in the details below to start chatting with our support team.
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900 bg-white"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900 bg-white"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    How can we help? *
                  </label>
                  <textarea
                    value={initialMessage}
                    onChange={(e) => setInitialMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900 bg-white"
                    rows={4}
                    placeholder="Describe your issue..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition"
                >
                  Start Chat
                </button>
              </form>
            </div>
          ) : (
            // CHAT INTERFACE
            <>
              {/* MESSAGES */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.map((message, index) => (
                  <div
                    key={message.id || index}
                    className={`flex ${
                      message.senderType === 'customer' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-2 rounded-lg ${
                        message.senderType === 'customer'
                          ? 'bg-blue-600 text-white'
                          : message.senderType === 'system'
                          ? 'bg-gray-200 text-gray-700 text-xs text-center w-full'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm wrap-break-words">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.senderType === 'customer' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {agentTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg">
                      <p className="text-sm text-gray-600">Agent is typing...</p>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* INPUT */}
              <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900 bg-white"
                    disabled={!isConnected}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || !isConnected}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-medium"
                  >
                    Send
                  </button>
                </form>
                {!isConnected && (
                  <p className="text-xs text-red-600 mt-2">Connecting to server...</p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
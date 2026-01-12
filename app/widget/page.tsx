'use client';

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';

/**
 * Customer Chat Widget
 * Embeddable chat interface for customers
 * 
 * FEATURES:
 * - Chat bubble (bottom right)
 * - Opens chat window
 * - Real-time messaging
 * - No login required (just name + email)
 */

interface Message {
  id: string;
  content: string;
  senderType: string;
  timestamp: string;
  senderName?: string;
}

export default function WidgetPage() {
  const { socket, isConnected } = useSocket();
  
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    if (!customerName || !customerEmail || !initialMessage) return;

    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerEmail,
          initialMessage,
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
        ]);
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !socket || !chatId) return;

    // Stop typing
    socket.emit('stop-typing', { chatId });

    // Send message
    socket.emit('send-message', {
      chatId,
      content: newMessage,
      senderType: 'customer',
      senderId: customerEmail,
      senderName: customerName,
    });

    setNewMessage('');
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
        <div className="bg-white rounded-lg shadow-2xl w-96 h-125 flex flex-col">
          {/* HEADER */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div>
              <h3 className="font-bold">Xup Support</h3>
              <p className="text-sm opacity-90">
                {isConnected ? 'Online' : 'Connecting...'}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-blue-700 rounded p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* FORM OR CHAT */}
          {showForm ? (
            // INITIAL FORM
            <form onSubmit={handleStartChat} className="flex-1 p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Your Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">How can we help?</label>
                <textarea
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  rows={3}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Start Chat
              </button>
            </form>
          ) : (
            // CHAT INTERFACE
            <>
              {/* MESSAGES */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={message.id || index}
                    className={`flex ${
                      message.senderType === 'customer' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] px-3 py-2 rounded-lg ${
                        message.senderType === 'customer'
                          ? 'bg-blue-600 text-white'
                          : message.senderType === 'system'
                          ? 'bg-gray-100 text-gray-600 text-xs text-center'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}

                {agentTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 px-3 py-2 rounded-lg">
                      <p className="text-sm text-gray-600">Agent is typing...</p>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* INPUT */}
              <div className="border-t p-4">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    Send
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
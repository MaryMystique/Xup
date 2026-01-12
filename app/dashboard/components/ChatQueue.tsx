'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Chat Queue Component
 * Shows waiting chats that agents can accept
 * 
 * EXPLANATION:
 * - Fetches chats with status="waiting"
 * - Displays customer name, message preview, wait time
 * - Agent clicks "Accept" to claim the chat
 */

interface Chat {
  id: string;
  customer: {
    name: string;
    email: string;
  };
  startedAt: string;
  messages: Array<{
    content: string;
  }>;
}

export default function ChatQueue() {
  const [waitingChats, setWaitingChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Fetch waiting chats
  useEffect(() => {
    fetchWaitingChats();
    
    // Poll every 5 seconds for new chats
    const interval = setInterval(fetchWaitingChats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchWaitingChats = async () => {
    try {
      const response = await fetch('/api/chats?status=waiting', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setWaitingChats(data.chats);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}/assign`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        // Redirect to chat page
        router.push(`/dashboard/chat/${chatId}`);
      }
    } catch (error) {
      console.error('Error accepting chat:', error);
    }
  };

  // Calculate wait time
  const getWaitTime = (startedAt: string) => {
    const start = new Date(startedAt);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
  };

  if (isLoading) {
    return <div className="p-4">Loading queue...</div>;
  }

  if (waitingChats.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="text-lg">No chats in queue</p>
        <p className="text-sm mt-2">New chats will appear here automatically</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">Chat Queue ({waitingChats.length})</h2>
      
      {waitingChats.map((chat) => (
        <div
          key={chat.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-lg">{chat.customer.name}</h3>
              <p className="text-sm text-gray-600">{chat.customer.email}</p>
            </div>
            <span className="text-xs text-gray-500">
              {getWaitTime(chat.startedAt)}
            </span>
          </div>

          <p className="text-gray-700 mb-3 line-clamp-2">
            {chat.messages[0]?.content || 'No message'}
          </p>

          <button
            onClick={() => handleAcceptChat(chat.id)}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Accept Chat
          </button>
        </div>
      ))}
    </div>
  );
}
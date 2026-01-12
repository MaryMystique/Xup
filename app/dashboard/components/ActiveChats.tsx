'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * Active Chats Component
 * Shows chats currently assigned to the agent
 */

interface Chat {
  id: string;
  customer: {
    name: string;
  };
  messages: Array<{
    content: string;
    timestamp: string;
  }>;
}

export default function ActiveChats() {
  const [activeChats, setActiveChats] = useState<Chat[]>([]);

  useEffect(() => {
    fetchActiveChats();
    
    const interval = setInterval(fetchActiveChats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveChats = async () => {
    try {
      const response = await fetch('/api/chats?status=active', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setActiveChats(data.chats);
      }
    } catch (error) {
      console.error('Error fetching active chats:', error);
    }
  };

  if (activeChats.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No active chats</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      <h2 className="text-xl font-bold mb-4">Active Chats ({activeChats.length})</h2>
      
      {activeChats.map((chat) => (
        <Link
          key={chat.id}
          href={`/dashboard/chat/${chat.id}`}
          className="block bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition"
        >
          <h3 className="font-semibold">{chat.customer.name}</h3>
          <p className="text-sm text-gray-600 truncate">
            {chat.messages[0]?.content || 'No messages yet'}
          </p>
        </Link>
      ))}
    </div>
  );
}
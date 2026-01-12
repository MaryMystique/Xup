'use client';

import { useAuth } from '../contexts/AuthContext';
import ChatQueue from './components/ChatQueue';
import ActiveChats from './components/ActiveChats';

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
     

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CHAT QUEUE */}
          <div className="bg-white rounded-lg shadow">
            <ChatQueue />
          </div>

          {/* ACTIVE CHATS */}
          <div className="bg-white rounded-lg shadow">
            <ActiveChats />
          </div>
        </div>
      </main>
    </div>
  );
}
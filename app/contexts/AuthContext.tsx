'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Auth Context - Global Authentication State
 * 
 * WHAT IT DOES:
 * - Stores current user info globally
 * - Checks if user is logged in on page load
 * - Provides login/logout functions to all components
 * - Automatically redirects if not authenticated
 * 
 * WHY WE NEED THIS:
 * - Without context, every component would need to fetch user separately
 * - Context = Share data across entire app without prop drilling
 */

// TYPE DEFINITIONS
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

// CREATE CONTEXT
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Provider Component
 * Wrap your app with this to provide auth to all components
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Check authentication on component mount
   * EXPLANATION:
   * - useEffect runs when component loads
   * - Calls /api/auth/me to check if user is logged in
   * - If yes, store user data
   * - If no, redirect to login (unless already on login/register page)
   */
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Include cookies in request
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Not authenticated
        setUser(null);
        
        // Redirect to login if trying to access protected page
        const publicPaths = ['/login', '/register', '/'];
        if (!publicPaths.includes(pathname)) {
          router.push('/login');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout function
   * EXPLANATION:
   * - Call /api/auth/logout to clear cookie
   * - Clear user from state
   * - Redirect to login page
   */
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to use auth context
 * USAGE: const { user, logout } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
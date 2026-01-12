'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../contexts/AuthContext';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Don't show navbar on widget page
  if (pathname === '/widget') return null;

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* LOGO */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center">
              <Image
                src="/l4.jpg" 
                alt="Xup Logo"
                width={60}
                height={60}
                className="object-contain" />
              <span className="text-2xl font-bold text-blue-600 ml-2">
                Xup
              </span>
            </div>
          </Link>

          {/* NAVIGATION LINKS */}
          <div className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className={`text-sm font-medium ${
                    pathname === '/dashboard'
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}  >
                  Dashboard
                </Link>
                
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className={`text-sm font-medium ${
                      pathname === '/admin'
                        ? 'text-blue-600'
                        : 'text-gray-700 hover:text-blue-600'
                    }`}  >
                    Admin
                  </Link>
                )}

                <Link
                  href="/dashboard/settings"
                  className={`text-sm font-medium ${
                    pathname === '/dashboard/settings'
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`} >
                  Settings
                </Link>
                </>
             ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600">
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* USER MENU */}
          {user && (
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
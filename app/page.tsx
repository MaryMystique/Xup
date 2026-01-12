import Link from 'next/link';

/**
 * Home Page / Landing Page
 * 
 * Simple landing page with links to login/register
 */
export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full text-center space-y-8 p-8">
        <div>
          <h1 className="text-6xl font-bold text-blue-600 mb-4">Xup</h1>
          <p className="text-xl text-gray-700 mb-8">
            Customer support made simple
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/login"
            className="block w-full py-3 px-4 text-white bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition"
          >
            Sign In
          </Link>
          
          <Link
            href="/register"
            className="block w-full py-3 px-4 text-blue-600 bg-white hover:bg-gray-50 rounded-md font-medium border border-blue-600 transition"
          >
            Create Account
          </Link>
        </div>

        <p className="text-sm text-gray-600 mt-8">
          Real-time chat support for growing teams
        </p>
      </div>
    </div>
  );
}
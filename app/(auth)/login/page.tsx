'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaEye, FaEyeSlash } from "react-icons/fa";


/**
 * Login Page Component
 * 
 * WHAT IT DOES:
 * - Shows email and password form
 * - Sends credentials to /api/auth/login
 * - Redirects to dashboard on success
 * - Shows error if invalid credentials
 */
export default function LoginPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // SUCCESS - redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* HEADER */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-blue-600">
            Sign in to Xup
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your support dashboard
          </p>
        </div>

        {/* FORM */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* ERROR MESSAGE */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div className="rounded-lg shadow-sm space-y-4">
           {/* EMAIL INPUT */}
         <div>
         <label
         htmlFor="email"
         className="block text-sm font-medium text-gray-700 mb-2">
         Email address
         </label>
         <input
         id="email"
         name="email"
         type="email"
         required
         value={formData.email}
         onChange={handleChange}
         disabled={isLoading}
         className={`w-full px-4 py-3 border border-gray-300 text-gray-900 rounded-lg
         focus:ring-2 focus:ring-blue-500 focus:border-transparent
         outline-none transition
         ${isLoading ? "bg-gray-100 cursor-not-allowed" : ""} `}
         placeholder="you@example.com" />
         </div>

         {/* PASSWORD INPUT */}
   <div>
    <label
     htmlFor="password"
     className="block text-sm font-medium text-gray-700 mb-2" >
        Password
      </label>
        <div className="relative">
         <input
         id="password"
         name="password"
         type={showPassword ? "text" : "password"}
         required
         value={formData.password}
         onChange={handleChange}
         disabled={isLoading}
         className={`w-full px-4 py-3 border border-gray-300 text-gray-900 rounded-lg
         focus:ring-2 focus:ring-blue-500 focus:border-transparent
         outline-none transition
         ${isLoading ? "bg-gray-100 cursor-not-allowed" : ""} `}
         placeholder="Enter your password" />
         <button
         type="button"
         onClick={() => setShowPassword(!showPassword)}
         disabled={isLoading}
         className="absolute right-3 top-1/2 -translate-y-1/2
                 text-gray-500 hover:text-gray-700 transition" >
         {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
         </button>
         </div>
         </div>
     </div>

          {/* SUBMIT BUTTON */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          {/* REGISTER LINK */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
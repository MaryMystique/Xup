'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaEye, FaEyeSlash } from "react-icons/fa";

/**
 * Register Page Component
 * 
 * WHAT IT DOES:
 * - Shows a form with email, password, name fields
 * - When submitted, sends data to /api/auth/register
 * - If successful, redirects to dashboard
 * - If error, shows error message
 */
export default function RegisterPage() {
  const router = useRouter();
  
  // STATE: Form input values
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // STATE: Loading spinner when submitting
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);



  // STATE: Error message to display
  const [error, setError] = useState('');

  /**
   * Handle input changes
   * EXPLANATION:
   * - When user types, update the corresponding field in state
   * - e.target.name = which input field (email, password, etc.)
   * - e.target.value = what user typed
   * - Spread operator (...formData) keeps other fields unchanged
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  /**
   * Handle form submission
   * EXPLANATION:
   * - e.preventDefault() stops page refresh (default form behavior)
   * - Validate passwords match
   * - Send POST request to backend
   * - If success, redirect to dashboard
   * - If error, show message
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    // CLIENT-SIDE VALIDATION
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      // SEND REQUEST TO BACKEND
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Backend returned error (400, 409, 500, etc.)
        throw new Error(data.error || 'Registration failed');
      }

      // SUCCESS! Backend set cookie automatically
      // Now redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      // HANDLE ERRORS
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* HEADER */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-blue-600">
            Create your Xup account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join as a support agent
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
           {/* NAME INPUT */}
       <div>
       <label
       htmlFor="name"
       className="block text-sm font-medium text-gray-700 mb-2" >
       Full Name
       </label>
       <input
       id="name"
       name="name"
       type="text"
       required
       value={formData.name}
       onChange={handleChange}
       disabled={isLoading}
        className={`w-full px-4 py-3 border border-gray-300 text-gray-900 rounded-lg
       focus:ring-2 focus:ring-blue-500 focus:border-transparent
       outline-none transition
       ${isLoading ? "bg-gray-100 cursor-not-allowed" : ""} `}
       placeholder="May Pope" />
       </div>

        {/* EMAIL INPUT */}
       <div>
       <label
        htmlFor="email"
       className="block text-sm font-medium text-gray-700 mb-2" >
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
          type={showPassword ? "text" : "password"}
         id="password"
         name="password"
         required
         value={formData.password}
         onChange={handleChange}
         disabled={isLoading}
         className={`w-full px-4 py-3 border border-gray-300 text-gray-900 rounded-lg
         focus:ring-2 focus:ring-blue-500 focus:border-transparent
         outline-none transition
         ${isLoading ? "bg-gray-100 cursor-not-allowed" : ""} `}
         placeholder="Min. 6 characters"  />
         <button
         type="button"
         onClick={() => setShowPassword(!showPassword)}
         className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
          disabled={isLoading} >
         {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
         </button>
         </div>
         </div>

         {/* CONFIRM PASSWORD INPUT */}
         <div>
         <label
         htmlFor="confirmPassword"
         className="block text-sm font-medium text-gray-700 mb-2" >
         Confirm Password
         </label>
         <div className="relative">
         <input
         type={showConfirmPassword ? "text" : "password"}
         id="confirmPassword"
         name="confirmPassword"
         required
         value={formData.confirmPassword}
         onChange={handleChange}
         disabled={isLoading}
         className={`w-full px-4 py-3 border border-gray-300 text-gray-900 rounded-lg
         focus:ring-2 focus:ring-blue-500 focus:border-transparent
         outline-none transition
          ${isLoading ? "bg-gray-100 cursor-not-allowed" : ""} `}
         placeholder="Re-enter password"  />
         <button
         type="button"
         onClick={() => setShowConfirmPassword(!showConfirmPassword)}
         className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
         disabled={isLoading} >
         {showConfirmPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
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
              {isLoading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>

          {/* LOGIN LINK */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
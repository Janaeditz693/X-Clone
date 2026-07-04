import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage } from '../utils/errors';
import { FaXTwitter } from 'react-icons/fa6';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      return toast.error("Please enter your email address.");
    }
    try {
      setLoading(true);
      await resetPassword(email);
      toast.success("Password reset email sent! Check your inbox.");
      setEmail('');
    } catch (err) {
      toast.error(getAuthErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-brand-bg dark:bg-brand-darkBg px-4">
      <div className="w-full max-w-md p-8 bg-white dark:bg-brand-darkBgLight border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-xl transition-all animate-fade-in">
        <div className="flex flex-col items-center mb-6">
          <FaXTwitter className="text-5xl text-brand-text dark:text-brand-darkText mb-3" />
          <h2 className="text-2xl font-bold tracking-tight text-brand-text dark:text-brand-darkText">
            Reset password
          </h2>
          <p className="text-sm text-brand-muted dark:text-brand-darkMuted mt-1 text-center">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-brand-text dark:text-brand-darkText">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent text-brand-text dark:text-brand-darkText focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition"
              placeholder="name@example.com"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-brand-blue hover:bg-brand-blueHover text-white font-bold rounded-lg shadow-md hover:shadow-lg transition flex items-center justify-center disabled:opacity-50"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-brand-blue font-semibold hover:underline">
            <Link to="/login">Back to Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

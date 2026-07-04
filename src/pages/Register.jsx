import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage } from '../utils/errors';
import { FaXTwitter } from 'react-icons/fa6';
import { FcGoogle } from 'react-icons/fc';
import toast from 'react-hot-toast';

export default function Register() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUpWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!displayName || !email || !password || !confirmPassword) {
      return toast.error("All fields are required.");
    }
    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters long.");
    }
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match.");
    }
    try {
      setLoading(true);
      await signUpWithEmail(email, password, displayName);
      toast.success("Account created successfully!");
      navigate('/');
    } catch (err) {
      toast.error(getAuthErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
      toast.success("Successfully logged in with Google!");
      navigate('/');
    } catch (err) {
      console.error("Google Sign-In Error Details:", err);
      if (err.code !== 'auth/popup-closed-by-user') {
        const friendlyMessage = getAuthErrorMessage(err.code);
        toast.error(`${friendlyMessage} (Error: ${err.code || 'unknown'})`, { duration: 6000 });
      }
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
            Create your account
          </h2>
          <p className="text-sm text-brand-muted dark:text-brand-darkMuted mt-1">
            Join the conversation today
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-brand-text dark:text-brand-darkText">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent text-brand-text dark:text-brand-darkText focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition text-sm"
              placeholder="John Doe"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-brand-text dark:text-brand-darkText">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent text-brand-text dark:text-brand-darkText focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition text-sm"
              placeholder="john@example.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-brand-text dark:text-brand-darkText">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent text-brand-text dark:text-brand-darkText focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition text-sm"
              placeholder="At least 6 characters"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-brand-text dark:text-brand-darkText">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent text-brand-text dark:text-brand-darkText focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition text-sm"
              placeholder="Confirm your password"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-brand-blue hover:bg-brand-blueHover text-white font-bold rounded-lg shadow-md hover:shadow-lg transition flex items-center justify-center disabled:opacity-50 text-sm mt-2"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-zinc-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-brand-darkBgLight px-2 text-brand-muted dark:text-brand-darkMuted">
              Or sign up with
            </span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 px-4 bg-transparent border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-brand-text dark:text-brand-darkText font-bold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
        >
          <FcGoogle className="text-xl" />
          Sign up with Google
        </button>

        <div className="text-center mt-6">
          <p className="text-sm text-brand-muted dark:text-brand-darkMuted">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-blue font-semibold hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

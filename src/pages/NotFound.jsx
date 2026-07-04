import React from 'react';
import { Link } from 'react-router-dom';
import { FaXTwitter } from 'react-icons/fa6';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-brand-bg dark:bg-brand-darkBg text-brand-text dark:text-brand-darkText px-4 select-none">
      <FaXTwitter className="text-6xl mb-6 animate-pulse" />
      <h1 className="text-4xl font-extrabold mb-2 tracking-tight">404</h1>
      <h2 className="text-xl font-bold mb-4">Page Not Found</h2>
      <p className="text-sm text-brand-muted dark:text-brand-darkMuted text-center max-w-xs mb-8">
        Hmm... this page doesn’t exist. Try searching for something else or head back home.
      </p>
      <Link 
        to="/" 
        className="py-2.5 px-6 bg-brand-blue hover:bg-brand-blueHover text-white font-bold rounded-full text-sm shadow transition duration-200"
      >
        Go Home
      </Link>
    </div>
  );
}

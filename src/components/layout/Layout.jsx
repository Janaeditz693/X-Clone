import React, { useState } from 'react';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import BottomNav from './BottomNav';
import MobileHeader from './MobileHeader';
import { useNotifications } from '../../context/NotificationContext';
import TweetBox from '../post/TweetBox';
import { RiCloseLine } from 'react-icons/ri';

export default function Layout({ children, mobileTitle }) {
  const { unreadCount } = useNotifications();
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-brand-bg dark:bg-brand-darkBg text-brand-text dark:text-brand-darkText">
      <div className="flex w-full max-w-7xl mx-auto">
        {/* Left Sidebar - Desktop */}
        <Sidebar 
          onPostClick={() => setIsComposeOpen(true)} 
          unreadCount={unreadCount} 
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 border-r border-gray-150 dark:border-zinc-800 pb-16 lg:pb-0">
          <MobileHeader title={mobileTitle} />
          {children}
        </main>

        {/* Right Sidebar - Desktop */}
        <RightSidebar />
      </div>

      {/* Bottom Nav - Mobile */}
      <BottomNav unreadCount={unreadCount} />

      {/* Compose Post Modal Overlay */}
      {isComposeOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-start justify-center z-50 p-4 pt-12 md:pt-20">
          <div className="bg-white dark:bg-brand-darkBgLight w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 p-4 animate-fade-in">
            <div className="flex justify-between items-center mb-4 border-b border-gray-150 dark:border-zinc-800 pb-2 select-none">
              <span className="font-bold text-brand-text dark:text-brand-darkText text-base">Compose Post</span>
              <button 
                onClick={() => setIsComposeOpen(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-full text-brand-text dark:text-brand-darkText"
              >
                <RiCloseLine className="text-xl" />
              </button>
            </div>
            
            <TweetBox 
              onPostSuccess={() => setIsComposeOpen(false)} 
              placeholder="What's happening?!" 
            />
          </div>
        </div>
      )}
    </div>
  );
}

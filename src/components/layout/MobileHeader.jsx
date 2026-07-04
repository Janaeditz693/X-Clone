import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { FaXTwitter } from 'react-icons/fa6';
import { 
  RiMenuLine, RiCloseLine, 
  RiUser3Line, RiSettings4Line, 
  RiShieldUserLine, RiLogoutBoxRLine,
  RiSunLine, RiMoonLine
} from 'react-icons/ri';

export default function MobileHeader({ title }) {
  const { userData, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setIsDrawerOpen(false);
    navigate('/login');
  };

  return (
    <>
      <header className="lg:hidden sticky top-0 bg-white/95 dark:bg-brand-darkBg/95 backdrop-blur-md border-b border-gray-150 dark:border-zinc-800 h-14 flex items-center justify-between px-4 z-30 select-none">
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="focus:outline-none"
        >
          {userData ? (
            <img
              src={userData.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${userData.uid}`}
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <RiMenuLine className="text-2xl text-brand-text dark:text-brand-darkText" />
          )}
        </button>

        <span className="font-extrabold text-lg text-brand-text dark:text-brand-darkText">
          {title || <FaXTwitter className="text-2xl" />}
        </span>

        <button 
          onClick={toggleTheme} 
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-900 text-brand-text dark:text-brand-darkText"
        >
          {theme === 'dark' ? (
            <RiSunLine className="text-xl text-yellow-500" />
          ) : (
            <RiMoonLine className="text-xl text-indigo-500" />
          )}
        </button>
      </header>

      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Slide-out Drawer */}
      <div 
        className={`lg:hidden fixed top-0 bottom-0 left-0 w-72 bg-white dark:bg-brand-darkBg z-55 shadow-2xl p-5 flex flex-col justify-between transform transition-transform duration-300 ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Drawer Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-extrabold text-brand-text dark:text-brand-darkText text-lg">Account Info</h3>
            <button 
              onClick={() => setIsDrawerOpen(false)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-full text-brand-text dark:text-brand-darkText"
            >
              <RiCloseLine className="text-2xl" />
            </button>
          </div>

          {/* User Meta */}
          {userData && (
            <div className="mb-6">
              <Link to={`/profile/${userData.username}`} onClick={() => setIsDrawerOpen(false)}>
                <img
                  src={userData.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${userData.uid}`}
                  alt="Avatar"
                  className="w-14 h-14 rounded-full object-cover mb-3"
                />
                <h4 className="font-bold text-brand-text dark:text-brand-darkText leading-none truncate">
                  {userData.displayName}
                </h4>
                <p className="text-sm text-brand-muted dark:text-brand-darkMuted truncate mb-3">
                  @{userData.username}
                </p>
              </Link>
              
              <div className="flex items-center gap-4 text-sm text-brand-text dark:text-brand-darkText">
                <span>
                  <strong className="font-bold">{userData.followingCount || 0}</strong>{' '}
                  <span className="text-brand-muted dark:text-brand-darkMuted">Following</span>
                </span>
                <span>
                  <strong className="font-bold">{userData.followersCount || 0}</strong>{' '}
                  <span className="text-brand-muted dark:text-brand-darkMuted">Followers</span>
                </span>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1">
            <Link 
              to={`/profile/${userData?.username}`} 
              onClick={() => setIsDrawerOpen(false)}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-900 text-brand-text dark:text-brand-darkText font-semibold"
            >
              <RiUser3Line className="text-xl" />
              Profile
            </Link>
            <Link 
              to="/settings" 
              onClick={() => setIsDrawerOpen(false)}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-900 text-brand-text dark:text-brand-darkText font-semibold"
            >
              <RiSettings4Line className="text-xl" />
              Settings
            </Link>
            
            {userData?.role === 'admin' && (
              <Link 
                to="/admin" 
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 font-semibold"
              >
                <RiShieldUserLine className="text-xl" />
                Admin Panel
              </Link>
            )}
          </nav>
        </div>

        {/* Drawer Footer */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-4 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 font-semibold w-full mt-auto"
        >
          <RiLogoutBoxRLine className="text-xl" />
          Log Out
        </button>
      </div>
    </>
  );
}

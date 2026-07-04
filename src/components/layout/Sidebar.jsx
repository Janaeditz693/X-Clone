import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { FaXTwitter } from 'react-icons/fa6';
import { 
  RiHome7Fill, RiHome7Line, 
  RiSearch2Fill, RiSearch2Line,
  RiNotification4Fill, RiNotification4Line,
  RiBookmarkFill, RiBookmarkLine,
  RiUser3Fill, RiUser3Line,
  RiSettings4Fill, RiSettings4Line,
  RiShieldUserFill, RiShieldUserLine,
  RiSunLine, RiMoonLine,
  RiLogoutBoxRLine
} from 'react-icons/ri';

export default function Sidebar({ onPostClick, unreadCount }) {
  const { userData, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    {
      label: 'Home',
      path: '/',
      iconActive: <RiHome7Fill className="text-2xl" />,
      iconInactive: <RiHome7Line className="text-2xl" />
    },
    {
      label: 'Explore',
      path: '/explore',
      iconActive: <RiSearch2Fill className="text-2xl" />,
      iconInactive: <RiSearch2Line className="text-2xl" />
    },
    {
      label: 'Notifications',
      path: '/notifications',
      iconActive: <RiNotification4Fill className="text-2xl" />,
      iconInactive: (
        <div className="relative">
          <RiNotification4Line className="text-2xl" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-brand-blue text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </div>
      ),
      badge: unreadCount > 0
    },
    {
      label: 'Bookmarks',
      path: '/bookmarks',
      iconActive: <RiBookmarkFill className="text-2xl" />,
      iconInactive: <RiBookmarkLine className="text-2xl" />
    },
    {
      label: 'Profile',
      path: userData ? `/profile/${userData.username}` : '/login',
      iconActive: <RiUser3Fill className="text-2xl" />,
      iconInactive: <RiUser3Line className="text-2xl" />
    },
    {
      label: 'Settings',
      path: '/settings',
      iconActive: <RiSettings4Fill className="text-2xl" />,
      iconInactive: <RiSettings4Line className="text-2xl" />
    }
  ];

  // Insert Admin panel link for admin users
  if (userData?.role === 'admin') {
    navItems.push({
      label: 'Admin Panel',
      path: '/admin',
      iconActive: <RiShieldUserFill className="text-2xl text-red-500" />,
      iconInactive: <RiShieldUserLine className="text-2xl text-red-500" />
    });
  }

  return (
    <div className="hidden sm:flex flex-col h-screen sticky top-0 px-2 lg:px-4 py-4 border-r border-gray-150 dark:border-zinc-800 justify-between w-16 lg:w-64 select-none">
      <div className="flex flex-col items-center lg:items-start space-y-2">
        {/* Logo */}
        <Link to="/" className="p-3 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-full inline-block transition duration-200">
          <FaXTwitter className="text-3xl text-brand-text dark:text-brand-darkText" />
        </Link>

        {/* Navigation Items */}
        <nav className="w-full space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-4 p-3 rounded-full hover:bg-gray-150 dark:hover:bg-zinc-900 transition duration-200 w-fit lg:w-full
                ${isActive ? 'font-bold text-brand-text dark:text-brand-darkText' : 'text-brand-text dark:text-brand-darkText opacity-90'}
              `}
            >
              {({ isActive }) => (
                <>
                  {isActive ? item.iconActive : item.iconInactive}
                  <span className="hidden lg:inline text-lg">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Post Button */}
        <button
          onClick={onPostClick}
          className="w-12 h-12 lg:w-full lg:h-12 flex items-center justify-center bg-brand-blue hover:bg-brand-blueHover text-white font-bold rounded-full shadow transition duration-200 mt-4"
        >
          <span className="hidden lg:inline text-base">Post</span>
          <svg className="lg:hidden w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M23 3c-6.62-.1-10.38 2.421-13.05 6.03C7.29 12.61 6 17.331 6 22h2c0-1.007.07-2.012.19-3H12c4.1 0 7.48-3.082 7.94-7.054C22.79.011 23 0 23 0zm-8 11.007H9.255C10.5 9.006 13.5 6.006 18 5.005c-.5 3.998-2.5 8.001-3 9.002zM1.5 13H5c-.5-1-.75-2.007-.89-3H1.5C.67 10 0 9.33 0 8.5S.67 7 1.5 7h3.33c-.1-.993-.05-2 .18-3H1.5C.67 4 0 3.33 0 2.5S.67 1 1.5 1h4c.83 0 1.5.67 1.5 1.5v.328a6.974 6.974 0 0 0-2 2.657v-.485c0-.28-.22-.5-.5-.5h-2.5c-.28 0-.5.22-.5.5s.22.5.5.5h1.745c-.28.916-.48 1.933-.535 3H1.5c-.28 0-.5.22-.5.5s.22.5.5.5h1.21c-.01.328-.01.664.01 1H1.5c-.28 0-.5.22-.5.5s.22.5.5.5z"></path>
          </svg>
        </button>
      </div>

      {/* User Actions & Settings */}
      <div className="flex flex-col gap-2 items-center lg:items-stretch">
        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-4 p-3 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-900 transition duration-200 w-fit lg:w-full text-brand-text dark:text-brand-darkText"
        >
          {theme === 'dark' ? (
            <>
              <RiSunLine className="text-2xl text-yellow-500" />
              <span className="hidden lg:inline text-sm">Light Mode</span>
            </>
          ) : (
            <>
              <RiMoonLine className="text-2xl text-indigo-500" />
              <span className="hidden lg:inline text-sm">Dark Mode</span>
            </>
          )}
        </button>

        {/* User Card */}
        {userData && (
          <div className="flex items-center justify-between p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-900 transition duration-200 mt-2">
            <Link to={`/profile/${userData.username}`} className="flex items-center gap-2 select-none overflow-hidden">
              <img
                src={userData.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${userData.uid}`}
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover bg-gray-100 dark:bg-zinc-800"
              />
              <div className="hidden lg:flex flex-col text-left leading-tight text-xs overflow-hidden max-w-[120px]">
                <span className="font-bold text-brand-text dark:text-brand-darkText truncate">{userData.displayName}</span>
                <span className="text-brand-muted dark:text-brand-darkMuted truncate">@{userData.username}</span>
              </div>
            </Link>
            
            <button
              onClick={logout}
              className="hidden lg:block p-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-full transition"
              title="Logout"
            >
              <RiLogoutBoxRLine className="text-xl" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

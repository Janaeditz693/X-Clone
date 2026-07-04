import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  RiHome7Fill, RiHome7Line, 
  RiSearch2Fill, RiSearch2Line,
  RiNotification4Fill, RiNotification4Line,
  RiBookmarkFill, RiBookmarkLine
} from 'react-icons/ri';

export default function BottomNav({ unreadCount }) {
  const { userData } = useAuth();
  
  if (!userData) return null;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-brand-darkBg/95 backdrop-blur-md border-t border-gray-150 dark:border-zinc-800 flex justify-around items-center z-40 px-2 select-none shadow-lg">
      <NavLink to="/" className={({ isActive }) => `p-3 text-brand-text dark:text-brand-darkText transition ${isActive ? 'scale-110 font-bold' : 'opacity-70'}`}>
        {({ isActive }) => isActive ? <RiHome7Fill className="text-2xl" /> : <RiHome7Line className="text-2xl" />}
      </NavLink>
      <NavLink to="/explore" className={({ isActive }) => `p-3 text-brand-text dark:text-brand-darkText transition ${isActive ? 'scale-110 font-bold' : 'opacity-70'}`}>
        {({ isActive }) => isActive ? <RiSearch2Fill className="text-2xl" /> : <RiSearch2Line className="text-2xl" />}
      </NavLink>
      <NavLink to="/notifications" className={({ isActive }) => `p-3 text-brand-text dark:text-brand-darkText transition relative ${isActive ? 'scale-110 font-bold' : 'opacity-70'}`}>
        {({ isActive }) => (
          <>
            {isActive ? <RiNotification4Fill className="text-2xl" /> : <RiNotification4Line className="text-2xl" />}
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 bg-brand-blue text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </>
        )}
      </NavLink>
      <NavLink to="/bookmarks" className={({ isActive }) => `p-3 text-brand-text dark:text-brand-darkText transition ${isActive ? 'scale-110 font-bold' : 'opacity-70'}`}>
        {({ isActive }) => isActive ? <RiBookmarkFill className="text-2xl" /> : <RiBookmarkLine className="text-2xl" />}
      </NavLink>
    </div>
  );
}

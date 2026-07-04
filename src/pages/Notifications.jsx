import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useNotifications } from '../context/NotificationContext';
import { RiHeartFill, RiChat1Fill, RiUserFollowFill, RiCheckboxCircleLine, RiDeleteBin7Line } from 'react-icons/ri';

export default function Notifications() {
  const { notifications, unreadCount, loading, markAllAsRead, clearNotifications } = useNotifications();

  useEffect(() => {
    // Automatically mark all notifications as read when viewing this page
    if (unreadCount > 0) {
      markAllAsRead();
    }
  }, [unreadCount, markAllAsRead]);

  return (
    <Layout mobileTitle="Notifications">
      {/* Header */}
      <div className="sticky top-0 bg-white/90 dark:bg-brand-darkBg/90 backdrop-blur-md px-4 py-3 select-none border-b border-divider z-10 flex justify-between items-center">
        <div>
          <h2 className="font-extrabold text-brand-text dark:text-brand-darkText text-lg">Notifications</h2>
          <p className="text-xs text-brand-muted dark:text-brand-darkMuted">Activity updates</p>
        </div>
        
        {notifications.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={clearNotifications}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition"
              title="Clear all notifications"
            >
              <RiDeleteBin7Line className="text-lg" />
            </button>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-divider select-none">
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-800"></div>
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-40 bg-gray-200 dark:bg-zinc-800 rounded"></div>
                  <div className="h-3.5 w-20 bg-gray-200 dark:bg-zinc-800 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notif) => {
            let icon = null;
            let link = '/';
            let description = '';

            const senderSlug = notif.senderUsername || notif.senderName;
            if (notif.type === 'like') {
              icon = <RiHeartFill className="text-xl text-red-500" />;
              link = `/profile/${senderSlug}`;
              description = 'liked your post';
            } else if (notif.type === 'comment') {
              icon = <RiChat1Fill className="text-xl text-brand-blue" />;
              link = `/profile/${senderSlug}`;
              description = 'commented on your post';
            } else if (notif.type === 'follow') {
              icon = <RiUserFollowFill className="text-xl text-purple-500" />;
              link = `/profile/${senderSlug}`;
              description = 'followed you';
            }

            return (
              <div 
                key={notif.id} 
                className={`p-4 flex gap-4 transition hover:bg-gray-50/30 dark:hover:bg-zinc-950/10 ${
                  !notif.read ? 'bg-brand-blue/5 dark:bg-brand-blue/5 border-l-4 border-brand-blue' : ''
                }`}
              >
                <div className="mt-1">{icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link to={link}>
                      <img
                        src={notif.senderPhoto || `https://api.dicebear.com/7.x/adventurer/svg?seed=${notif.senderId}`}
                        alt="Sender Avatar"
                        className="w-8 h-8 rounded-full object-cover bg-gray-150"
                      />
                    </Link>
                  </div>
                  
                  <p className="text-sm text-brand-text dark:text-brand-darkText">
                    <Link to={link} className="font-bold hover:underline">
                      {notif.senderName}
                    </Link>{' '}
                    {description}
                  </p>
                  
                  {notif.createdAt?.toDate && (
                    <span className="text-[10px] text-brand-muted dark:text-brand-darkMuted">
                      {new Date(notif.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center max-w-sm mx-auto mt-8">
            <h3 className="font-extrabold text-xl mb-1 text-brand-text dark:text-brand-darkText">Join the conversation</h3>
            <p className="text-sm text-brand-muted dark:text-brand-darkMuted">
              When users follow you, comment, or like your posts, it will show up here.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

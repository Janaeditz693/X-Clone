import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('receiverId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      let unread = 0;
      snapshot.forEach((doc) => {
        const item = { id: doc.id, ...doc.data() };
        list.push(item);
        if (!item.read) unread++;
      });
      setNotifications(list);
      setUnreadCount(unread);
      setLoading(false);
    }, (error) => {
      console.error("Notifications snapshot error:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  const markAllAsRead = async () => {
    if (!currentUser || unreadCount === 0) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach((notif) => {
        if (!notif.read) {
          const ref = doc(db, 'notifications', notif.id);
          batch.update(ref, { read: true });
        }
      });
      await batch.commit();
    } catch (err) {
      console.error("Error marking notifications read:", err);
    }
  };

  const clearNotifications = async () => {
    if (!currentUser || notifications.length === 0) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach((notif) => {
        const ref = doc(db, 'notifications', notif.id);
        batch.delete(ref);
      });
      await batch.commit();
    } catch (err) {
      console.error("Error clearing notifications:", err);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading, markAllAsRead, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

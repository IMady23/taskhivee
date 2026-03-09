import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AuthContext } from './AuthContext';
import { toast } from 'react-hot-toast';
import { playSound } from '../utils/soundUtils';
import {
  subscribeToNotifications,
  markAsRead as markNotificationAsRead,
  markAllAsRead as markAllNotificationsAsRead,
} from '../services/notificationService';

const NotificationContext = createContext();

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const authContext = useContext(AuthContext);
  
  // CRITICAL FIX: Handle case where AuthContext is not yet available
  if (!authContext) {
    console.warn('[NotificationProvider] AuthContext not available yet');
    return <>{children}</>;
  }
  
  const { user } = authContext;
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFirstLoad = useRef(true);
  const prevIdsRef = useRef(new Set());

  const unreadCount = useMemo(() => {
    const isUnread = (n) => !(n?.read || n?.isRead || n?.is_read);
    return notifications.filter(isUnread).length;
  }, [notifications]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    // Reset first load on user change
    isFirstLoad.current = true;
    prevIdsRef.current = new Set();

    // Feature: Resume AudioContext on first user interaction to bypass autoplay blocks
    const resumeAudio = () => {
      try {
        playSound('MESSAGE'); // Subtle "unlock" sound
        console.log("[NotificationContext] AudioContext unlocked via user interaction.");
        window.removeEventListener('mousedown', resumeAudio);
        window.removeEventListener('keydown', resumeAudio);
      } catch (e) {
        console.warn("[NotificationContext] Audio resume failed:", e);
      }
    };
    window.addEventListener('mousedown', resumeAudio);
    window.addEventListener('keydown', resumeAudio);

    const unsubscribe = subscribeToNotifications(user.uid, (fetched) => {
      const isUnread = (n) => !(n?.read || n?.isRead || n?.is_read);

      // Toast only for new, unread notifications after initial hydration.
      if (!isFirstLoad.current) {
        for (const n of fetched) {
          if (!n?.id) continue;
          if (prevIdsRef.current.has(n.id)) continue;
          if (!isUnread(n)) continue;

          try {
            playSound('NOTIFICATION');
          } catch (e) {
            console.warn("[NotificationContext] Could not play sound:", e);
          }

          toast.success(n.title || n.message || 'New notification', {
            duration: 3000,
            id: n.id,
            data: { type: n.type }
          });
        }
      }

      prevIdsRef.current = new Set(fetched.map((n) => n?.id).filter(Boolean));
      setNotifications(fetched);
      setLoading(false);
      isFirstLoad.current = false;
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter((n) => !(n?.read || n?.isRead || n?.is_read))
        .map((n) => n.id)
        .filter(Boolean);

      if (unreadIds.length === 0) return;
      await markAllNotificationsAsRead(unreadIds);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    loading
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

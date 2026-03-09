/**
 * useEventReminders Hook
 * Checks for pending event reminders and shows notifications
 */

import { useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getPendingReminders, markReminderSent } from '../services/eventService';
import { toast } from 'react-hot-toast';
import { playSound } from '../utils/soundUtils';

export const useEventReminders = () => {
  const { user } = useContext(AuthContext);
  const intervalRef = useRef(null);
  const notifiedEvents = useRef(new Set());

  useEffect(() => {
    if (!user?.teamId) return;

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const checkReminders = async () => {
      try {
        const pendingReminders = await getPendingReminders(user.teamId);
        
        for (const event of pendingReminders) {
          // Skip if already notified in this session
          if (notifiedEvents.current.has(event.id)) continue;
          
          // Calculate time until event
          const now = new Date();
          const eventDate = new Date(event.date);
          const minutesUntil = Math.round((eventDate - now) / 60000);
          
          // Show browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification('📅 Event Reminder', {
              body: `${event.title} - ${minutesUntil > 0 ? `in ${minutesUntil} minutes` : 'now'}`,
              icon: '/vite.svg',
              badge: '/vite.svg',
              tag: event.id,
              requireInteraction: true,
              silent: false
            });

            notification.onclick = () => {
              window.focus();
              notification.close();
            };
          }
          
          // Show toast notification
          toast.custom((t) => (
            <div
              className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
            >
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-2xl">📅</span>
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-bold text-white">
                      Event Reminder
                    </p>
                    <p className="mt-1 text-sm text-white/90">
                      {event.title}
                    </p>
                    <p className="mt-1 text-xs text-white/70">
                      {minutesUntil > 0 
                        ? `Starting in ${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''}`
                        : 'Starting now!'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-white/20">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="w-full border border-transparent rounded-none rounded-r-xl p-4 flex items-center justify-center text-sm font-medium text-white hover:bg-white/10 focus:outline-none"
                >
                  Close
                </button>
              </div>
            </div>
          ), {
            duration: 10000,
            position: 'top-right'
          });
          
          // Play notification sound
          try {
            await playSound('notification');
          } catch (error) {
            console.warn('Could not play notification sound:', error);
          }
          
          // Mark as notified
          notifiedEvents.current.add(event.id);
          
          // Mark reminder as sent in database
          await markReminderSent(event.id);
        }
      } catch (error) {
        console.error('Error checking reminders:', error);
      }
    };

    // Check immediately
    checkReminders();
    
    // Check every 30 seconds
    intervalRef.current = setInterval(checkReminders, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user?.teamId]);

  return null;
};

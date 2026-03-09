import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  subscribeToNotifications, 
  markAsRead, 
  markAllAsRead,
  NOTIFICATION_CATEGORIES 
} from '../services/notificationService';
import { Bell, CheckCheck, CheckSquare, Bug, Calendar, MessageCircle, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function NotificationCenter() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(NOTIFICATION_CATEGORIES.TASKS);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeToNotifications(user.uid, (fetchedNotifications) => {
      setNotifications(fetchedNotifications);
    });

    return () => unsubscribe();
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredNotifications = notifications.filter(n => n.category === activeTab);
  const unreadCount = notifications.filter(n => !n.read).length;
  const unreadByCategory = {
    [NOTIFICATION_CATEGORIES.TASKS]: notifications.filter(n => n.category === NOTIFICATION_CATEGORIES.TASKS && !n.read).length,
    [NOTIFICATION_CATEGORIES.BUGS]: notifications.filter(n => n.category === NOTIFICATION_CATEGORIES.BUGS && !n.read).length,
    [NOTIFICATION_CATEGORIES.OTHERS]: notifications.filter(n => n.category === NOTIFICATION_CATEGORIES.OTHERS && !n.read).length,
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate if link exists
    if (notification.link) {
      navigate(notification.link);
    }

    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length > 0) {
      await markAllAsRead(unreadIds);
    }
  };

  const getNotificationIcon = (type) => {
    if (type.includes('task')) return <CheckSquare size={16} className="text-blue-400" />;
    if (type.includes('bug')) return <Bug size={16} className="text-red-400" />;
    if (type.includes('comment')) return <MessageCircle size={16} className="text-purple-400" />;
    if (type.includes('event')) return <Calendar size={16} className="text-emerald-400" />;
    if (type.includes('member')) return <UserPlus size={16} className="text-indigo-400" />;
    return <Bell size={16} className="text-gray-400" />;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-[420px] bg-[#151921] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-[#1e293b] bg-[#0B0F14]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black text-white text-lg uppercase tracking-tight">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-bold transition-colors"
                  >
                    <CheckCheck size={14} />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div className="flex gap-2">
                {[
                  { key: NOTIFICATION_CATEGORIES.TASKS, label: 'Tasks', icon: <CheckSquare size={14} /> },
                  { key: NOTIFICATION_CATEGORIES.BUGS, label: 'Bugs', icon: <Bug size={14} /> },
                  { key: NOTIFICATION_CATEGORIES.OTHERS, label: 'Others', icon: <Bell size={14} /> }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                      activeTab === tab.key
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                    {unreadByCategory[tab.key] > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-[9px] rounded-full">
                        {unreadByCategory[tab.key]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
              {filteredNotifications.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                    <Bell size={32} className="text-gray-600" />
                  </div>
                  <p className="text-gray-500 text-sm font-medium">No notifications yet</p>
                  <p className="text-gray-600 text-xs mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-[#1e293b]">
                  {filteredNotifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 cursor-pointer transition-all hover:bg-white/5 ${
                        !notification.read ? 'bg-blue-500/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`p-2 rounded-xl ${!notification.read ? 'bg-blue-500/10' : 'bg-white/5'}`}>
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className={`font-bold text-sm ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-gray-400 text-xs leading-relaxed mb-2">
                            {notification.message}
                          </p>
                          <span className="text-[10px] text-gray-600 uppercase tracking-wider font-bold">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {filteredNotifications.length > 0 && (
              <div className="p-3 border-t border-[#1e293b] bg-[#0B0F14] text-center">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                  {filteredNotifications.length} {filteredNotifications.length === 1 ? 'notification' : 'notifications'}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

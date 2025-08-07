import React, { useEffect, useRef } from 'react';
import { X, Bell, Check, AlertCircle, ShoppingBag, Tag, Info, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

// Notification icon based on type
const getNotificationIcon = (type) => {
  switch (type) {
    case 'order':
      return <ShoppingBag className="w-5 h-5 text-blue-500" />;
    case 'promotion':
      return <Tag className="w-5 h-5 text-green-500" />;
    case 'alert':
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    default:
      return <Info className="w-5 h-5 text-gray-500" />;
  }
};

const NotificationDrawer = () => {
  const { 
    notifications, 
    unreadCount, 
    isDrawerOpen, 
    toggleDrawer, 
    markAsRead, 
    removeNotification,
    loadNotifications
  } = useNotifications();
  
  const drawerRef = useRef(null);
  
  // Load notifications when drawer opens
  useEffect(() => {
    if (isDrawerOpen) {
      loadNotifications();
    }
  }, [isDrawerOpen, loadNotifications]);
  
  // Close drawer when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        // Check if the click is not on the notification bell
        const notificationBell = document.querySelector('.notification-bell');
        if (!notificationBell || !notificationBell.contains(event.target)) {
          toggleDrawer(false);
        }
      }
    };
    
    if (isDrawerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDrawerOpen, toggleDrawer]);
  
  // Animation variants
  const drawerVariants = {
    hidden: { 
      opacity: 0, 
      y: -20,
      scale: 0.95 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        type: 'spring',
        damping: 25,
        stiffness: 500 
      } 
    },
    exit: { 
      opacity: 0, 
      y: -20,
      scale: 0.95,
      transition: { 
        duration: 0.2 
      } 
    }
  };

  return (
    <div className="relative" ref={drawerRef}>
      {/* Notification Bell */}
      <button
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 notification-bell"
        onClick={() => toggleDrawer(!isDrawerOpen)}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {/* Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={drawerVariants}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white">
                Notifications {unreadCount > 0 && `(${unreadCount} new)`}
              </h3>
              <button
                onClick={() => toggleDrawer(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Close notifications"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <Bell className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No notifications yet
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => (
                    <li 
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <div className="flex justify-between">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {notification.title}
                            </p>
                            <div className="flex space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeNotification(notification.id);
                                }}
                                className="text-gray-400 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                                title="Dismiss"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <div className="mt-2 flex items-center text-xs text-gray-400">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <Link
                to="/account/notifications"
                className="block w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                onClick={() => toggleDrawer(false)}
              >
                View all notifications
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDrawer;

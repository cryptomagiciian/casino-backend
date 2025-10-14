import React, { useState, useEffect } from 'react';
import { notificationService, Notification } from './NotificationService';
import { NotificationCenter } from './NotificationCenter';

export const NotificationBell: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Subscribe to notification updates
    const unsubscribe = notificationService.subscribe((notifications) => {
      const unread = notifications.filter(n => !n.read).length;
      setUnreadCount(unread);
    });

    // Initial load
    const notifications = notificationService.getNotifications();
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);

    return unsubscribe;
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12.828 7H4.828zM4 12h16M4 16h16"
          />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationCenter isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

import React, { useState, useEffect } from 'react';
import { notificationService, Notification } from './NotificationService';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Subscribe to notification updates
    const unsubscribe = notificationService.subscribe((newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(notificationService.getUnreadNotifications().length);
    });

    // Initial load
    setNotifications(notificationService.getNotifications());
    setUnreadCount(notificationService.getUnreadNotifications().length);

    return unsubscribe;
  }, []);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'deposit':
        return '💰';
      case 'withdrawal':
        return '🚀';
      case 'bet_win':
        return '🎉';
      case 'bet_loss':
        return '💥';
      case 'system':
        return '🔔';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'deposit':
        return 'bg-green-50 border-green-200';
      case 'withdrawal':
        return 'bg-blue-50 border-blue-200';
      case 'bet_win':
        return 'bg-yellow-50 border-yellow-200';
      case 'bet_loss':
        return 'bg-red-50 border-red-200';
      case 'system':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const markAsRead = (notificationId: string) => {
    notificationService.markAsRead(notificationId);
  };

  const markAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const clearAll = () => {
    notificationService.clearAll();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={clearAll}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-4">🔔</div>
                  <p className="text-gray-500">No notifications yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    You'll see deposit, withdrawal, and game notifications here
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        {notification.amount && notification.currency && (
                          <p className="text-sm font-medium text-green-600 mt-1">
                            {notification.amount} {notification.currency}
                          </p>
                        )}
                        {!notification.read && (
                          <div className="mt-2">
                            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Auto-refresh every 10 seconds</span>
              <button
                onClick={() => notificationService.requestPermission()}
                className="text-blue-600 hover:text-blue-800"
              >
                Enable browser notifications
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

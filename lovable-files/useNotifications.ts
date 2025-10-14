import { useState, useEffect } from 'react';
import { notificationService, Notification } from './NotificationService';

export const useNotifications = () => {
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

  const markAsRead = (notificationId: string) => {
    notificationService.markAsRead(notificationId);
  };

  const markAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const clearAll = () => {
    notificationService.clearAll();
  };

  const addNotification = (type: Notification['type'], title: string, message: string, data?: any) => {
    notificationService.addManualNotification(type, title, message, data);
  };

  const requestPermission = async () => {
    return await notificationService.requestPermission();
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    addNotification,
    requestPermission,
  };
};

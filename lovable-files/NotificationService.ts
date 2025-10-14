import { apiService } from './api';

export interface Notification {
  id: string;
  type: 'deposit' | 'withdrawal' | 'bet_win' | 'bet_loss' | 'system';
  title: string;
  message: string;
  amount?: number;
  currency?: string;
  status?: string;
  timestamp: Date;
  read: boolean;
}

class NotificationService {
  private notifications: Notification[] = [];
  private listeners: ((notifications: Notification[]) => void)[] = [];
  private checkInterval: NodeJS.Timeout | null = null;
  private lastCheckTime: Date = new Date();

  constructor() {
    this.startPolling();
  }

  // Start polling for new notifications
  private startPolling() {
    // Check every 10 seconds for new notifications
    this.checkInterval = setInterval(async () => {
      await this.checkForNewNotifications();
    }, 10000);
  }

  // Stop polling
  public stopPolling() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Check for new notifications from backend
  private async checkForNewNotifications() {
    try {
      // Check for completed deposits
      const depositsResponse = await apiService.getDeposits(10, 0);
      console.log('🔔 NotificationService: depositsResponse:', depositsResponse);
      
      // Handle different response formats
      let deposits = [];
      if (Array.isArray(depositsResponse)) {
        deposits = depositsResponse;
      } else if (depositsResponse && Array.isArray(depositsResponse.data)) {
        deposits = depositsResponse.data;
      } else if (depositsResponse && Array.isArray(depositsResponse.deposits)) {
        deposits = depositsResponse.deposits;
      } else {
        console.warn('🔔 NotificationService: Unexpected deposits response format:', depositsResponse);
        deposits = [];
      }
      
      const recentDeposits = deposits.filter((deposit: any) => {
        const depositTime = new Date(deposit.createdAt);
        return depositTime > this.lastCheckTime && deposit.status === 'COMPLETED';
      });

      // Check for completed withdrawals
      const withdrawalsResponse = await apiService.getWithdrawals(10, 0);
      console.log('🔔 NotificationService: withdrawalsResponse:', withdrawalsResponse);
      
      // Handle different response formats
      let withdrawals = [];
      if (Array.isArray(withdrawalsResponse)) {
        withdrawals = withdrawalsResponse;
      } else if (withdrawalsResponse && Array.isArray(withdrawalsResponse.data)) {
        withdrawals = withdrawalsResponse.data;
      } else if (withdrawalsResponse && Array.isArray(withdrawalsResponse.withdrawals)) {
        withdrawals = withdrawalsResponse.withdrawals;
      } else {
        console.warn('🔔 NotificationService: Unexpected withdrawals response format:', withdrawalsResponse);
        withdrawals = [];
      }
      
      const recentWithdrawals = withdrawals.filter((withdrawal: any) => {
        const withdrawalTime = new Date(withdrawal.createdAt);
        return withdrawalTime > this.lastCheckTime && withdrawal.status === 'COMPLETED';
      });

      // Create notifications for completed transactions
      recentDeposits.forEach((deposit: any) => {
        this.addNotification({
          id: `deposit_${deposit.id}`,
          type: 'deposit',
          title: 'Deposit Completed! 💰',
          message: `Your deposit of ${deposit.amount} ${deposit.currency} has been credited to your account.`,
          amount: deposit.amount,
          currency: deposit.currency,
          status: deposit.status,
          timestamp: new Date(deposit.completedAt || deposit.createdAt),
          read: false,
        });
      });

      recentWithdrawals.forEach((withdrawal: any) => {
        this.addNotification({
          id: `withdrawal_${withdrawal.id}`,
          type: 'withdrawal',
          title: 'Withdrawal Completed! 🚀',
          message: `Your withdrawal of ${withdrawal.amount} ${withdrawal.currency} has been sent to your wallet.`,
          amount: withdrawal.amount,
          currency: withdrawal.currency,
          status: withdrawal.status,
          timestamp: new Date(withdrawal.completedAt || withdrawal.createdAt),
          read: false,
        });
      });

      // Update last check time
      this.lastCheckTime = new Date();
    } catch (error) {
      console.error('Error checking for notifications:', error);
    }
  }

  // Add a new notification
  public addNotification(notification: Notification) {
    // Check if notification already exists
    const exists = this.notifications.find(n => n.id === notification.id);
    if (exists) return;

    this.notifications.unshift(notification);
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.notifyListeners();

    // Show browser notification if permission granted
    this.showBrowserNotification(notification);
  }

  // Show browser notification
  private showBrowserNotification(notification: Notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
      });
    }
  }

  // Request notification permission
  public async requestPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Get all notifications
  public getNotifications(): Notification[] {
    return this.notifications;
  }

  // Get unread notifications
  public getUnreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.read);
  }

  // Mark notification as read
  public markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  // Mark all notifications as read
  public markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.notifyListeners();
  }

  // Clear all notifications
  public clearAll() {
    this.notifications = [];
    this.notifyListeners();
  }

  // Subscribe to notification changes
  public subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  // Add manual notification (for testing or other events)
  public addManualNotification(type: Notification['type'], title: string, message: string, data?: any) {
    const notification: Notification = {
      id: `manual_${Date.now()}_${Math.random()}`,
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
      ...data,
    };
    this.addNotification(notification);
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

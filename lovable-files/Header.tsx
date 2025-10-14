import React from 'react';
import { NotificationBell } from './NotificationBell';
import { useNotifications } from './useNotifications';

interface HeaderProps {
  title?: string;
  showNotifications?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  title = "Crypto Casino", 
  showNotifications = true 
}) => {
  const { unreadCount } = useNotifications();

  return (
    <header className="bg-gray-900 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Title */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-white">
              {title}
            </h1>
          </div>

          {/* Right side - Notifications and User menu */}
          <div className="flex items-center space-x-4">
            {showNotifications && (
              <div className="relative">
                <NotificationBell />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1">
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* User menu placeholder */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">U</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

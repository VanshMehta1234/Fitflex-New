import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Star, Award, ChevronUp } from 'lucide-react';
import { cn } from '../lib/utils';

interface XpNotificationProps {
  amount: number;
  message: string;
  onComplete?: () => void;
}

export const XpNotification: React.FC<XpNotificationProps> = ({ 
  amount,
  message,
  onComplete
}) => {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    // Automatically hide the notification after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      
      // Allow animation to complete before calling onComplete
      const completeTimer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 500);
      
      return () => clearTimeout(completeTimer);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={cn(
            "fixed bottom-6 right-6 z-50 flex items-center p-3 pr-4 rounded-lg shadow-lg",
            "bg-gradient-to-r from-primary-500 to-primary-600 text-white"
          )}
        >
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-white/20 mr-3">
            <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
          </div>
          <div>
            <div className="flex items-center">
              <span className="font-bold text-xl">+{amount} XP</span>
              <ChevronUp className="h-4 w-4 ml-1 text-green-300" />
            </div>
            <p className="text-sm text-white/90">{message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface XpNotificationManagerProps {
  children: React.ReactNode;
}

export type XpNotificationData = {
  id: string;
  amount: number;
  message: string;
};

export let showXpNotification: (amount: number, message: string) => void = () => {};
export let clearXpNotifications: () => void = () => {};

export const XpNotificationManager: React.FC<XpNotificationManagerProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<XpNotificationData[]>([]);
  
  // Initialize the global notification functions
  useEffect(() => {
    showXpNotification = (amount: number, message: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      setNotifications(prev => [...prev, { id, amount, message }]);
    };
    
    clearXpNotifications = () => {
      setNotifications([]);
    };
    
    return () => {
      showXpNotification = () => {};
      clearXpNotifications = () => {};
    };
  }, []);
  
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };
  
  return (
    <>
      {children}
      
      {/* Only show the most recent notification */}
      {notifications.length > 0 && (
        <XpNotification
          amount={notifications[0].amount}
          message={notifications[0].message}
          onComplete={() => removeNotification(notifications[0].id)}
        />
      )}
    </>
  );
}; 
import { useState, useEffect } from 'react';
import { Bell, Video, Phone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileNotificationProps {
  title: string;
  message: string;
  type?: 'call' | 'message' | 'info';
  icon?: 'video' | 'phone' | 'bell' | 'info';
  duration?: number;
  onAccept?: () => void;
  onReject?: () => void;
  onDismiss?: () => void;
}

export default function MobileNotification({
  title,
  message,
  type = 'info',
  icon,
  duration = 5000,
  onAccept,
  onReject,
  onDismiss
}: MobileNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after duration if there are no accept/reject actions
    if (!onAccept && !onReject) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onDismiss) onDismiss();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onAccept, onReject, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) onDismiss();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          className="fixed top-20 right-4 z-50 max-w-sm w-full"
        >
          <div className="bg-[#1A1F2C] border border-gray-700 rounded-lg shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#2A3042] border-b border-gray-700">
              <div className="flex items-center space-x-2">
                {type === 'call' ? (
                  <Video className="h-5 w-5 text-purple-400" />
                ) : type === 'message' ? (
                  <Phone className="h-5 w-5 text-blue-400" />
                ) : (
                  <Bell className="h-5 w-5 text-amber-400" />
                )}
                <span className="font-medium text-white">{title}</span>
              </div>
              <button 
                onClick={handleDismiss} 
                className="text-gray-400 hover:text-white"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Content */}
            <div className="px-4 py-3">
              <p className="text-gray-300">{message}</p>
              
              {/* Action buttons */}
              {(onAccept || onReject) && (
                <div className="flex justify-end space-x-2 mt-3">
                  {onReject && (
                    <button
                      onClick={() => {
                        onReject();
                        setIsVisible(false);
                      }}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
                    >
                      Decline
                    </button>
                  )}
                  {onAccept && (
                    <button
                      onClick={() => {
                        onAccept();
                        setIsVisible(false);
                      }}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded"
                    >
                      Accept
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* Animated progress bar */}
            {!onAccept && !onReject && (
              <div className="h-1 bg-gray-700">
                <div 
                  className="h-full bg-blue-500" 
                  style={{ 
                    width: '100%',
                    animation: `progress-shrink ${duration}ms linear forwards`
                  }}
                />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  title,
  description,
  variant = 'info',
  duration = 3000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300); // Allow animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  // Determine icon and colors based on variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          icon: <CheckCircle size={20} className="text-green-500" />,
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30',
          textColor: 'text-green-500'
        };
      case 'error':
        return {
          icon: <AlertCircle size={20} className="text-red-500" />,
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          textColor: 'text-red-500'
        };
      case 'warning':
        return {
          icon: <AlertCircle size={20} className="text-amber-500" />,
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/30',
          textColor: 'text-amber-500'
        };
      case 'info':
      default:
        return {
          icon: <Info size={20} className="text-blue-500" />,
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
          textColor: 'text-blue-500'
        };
    }
  };

  const { icon, bgColor, borderColor, textColor } = getVariantStyles();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`flex items-start p-4 rounded-lg shadow-lg border ${bgColor} ${borderColor} max-w-md w-full`}
        >
          <div className="flex-shrink-0 mr-3 mt-0.5">
            {icon}
          </div>
          <div className="flex-1 mr-2">
            <h4 className={`font-medium ${textColor}`}>{title}</h4>
            {description && (
              <p className="text-sm text-white/70 mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onClose(id), 300);
            }}
            className="flex-shrink-0 text-white/50 hover:text-white/80 transition-colors"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;

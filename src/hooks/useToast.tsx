import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast, { ToastVariant } from '../components/ui/Toast';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: string;
}

interface ToastContextType {
  toast: (options: ToastOptions) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, ...options }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Create a portal for the toasts
  const toastPortal = typeof document !== 'undefined' ? 
    createPortal(
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        <motion.div layout className="flex flex-col gap-2">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              id={toast.id}
              title={toast.title}
              description={toast.description}
              variant={toast.variant}
              duration={toast.duration}
              onClose={removeToast}
            />
          ))}
        </motion.div>
      </div>,
      document.body
    ) : null;

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      {toastPortal}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default useToast;

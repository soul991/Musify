import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { toastVariants } from '../utils/motion';

export interface ToastItem {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-dismiss after 3s as specified in Phase 3
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Notification Layer */}
      <div className="fixed bottom-24 md:bottom-28 inset-x-0 z-50 flex flex-col items-center gap-2 pointer-events-none px-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              variants={toastVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#1A1A1A]/95 text-white text-xs font-semibold shadow-2xl border border-white/15 backdrop-blur-xl max-w-md select-none"
            >
              {toast.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              ) : toast.type === 'error' ? (
                <AlertCircle size={16} className="text-rose-400 shrink-0" />
              ) : (
                <Info size={16} className="text-[var(--accent-color,#E5303D)] shrink-0" />
              )}
              <span className="truncate">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-full text-white/40 hover:text-white"
                aria-label="Dismiss toast"
              >
                <X size={12} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

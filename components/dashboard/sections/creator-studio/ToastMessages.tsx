'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';

interface ToastMessagesProps {
  showSuccess: boolean;
  successMessage?: string;
  showError: boolean;
  errorMessage: string | null;
}

export function ToastMessages({ showSuccess, successMessage = 'Post published!', showError, errorMessage }: ToastMessagesProps) {
  return (
    <AnimatePresence>
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-green-500 text-white px-5 py-3 rounded-2xl shadow-lg"
        >
          <Sparkles className="w-5 h-5" />
          {successMessage}
        </motion.div>
      )}
      {showError && errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-red-500 text-white px-5 py-3 rounded-2xl shadow-lg"
        >
          <X className="w-5 h-5" />
          {errorMessage}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

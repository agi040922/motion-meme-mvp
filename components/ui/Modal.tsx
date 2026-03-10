'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
}

export function Modal({ isOpen, onClose, children, className = '', title }: ModalProps) {
  // Prevent scrolling on body when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, type: 'spring', damping: 25, stiffness: 300 }}
              className={`bg-white rounded-3xl shadow-xl overflow-hidden pointer-events-auto w-full max-w-lg ${className}`}
              onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside
            >
              {title && (
                <div className="flex items-center justify-between p-4 border-b border-zinc-100">
                  <h2 className="text-lg font-bold text-zinc-900">{title}</h2>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500 transition-colors focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                    </svg>
                  </button>
                </div>
              )}
              {children}
            </motion.div>
          </div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
}

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { useDisplayPreferences } from '@/lib/displayPreferences';

interface ProfileMenuLayerProps {
  isOpen: boolean;
  onClose: () => void;
  profileName?: string;
  onAccountClick?: () => void;
  onSavedMemesClick?: () => void;
}

export function ProfileMenuLayer({
  isOpen,
  onClose,
  profileName,
  onAccountClick,
  onSavedMemesClick,
}: ProfileMenuLayerProps) {
  const [isDisplayOpen, setIsDisplayOpen] = useState(false);
  const { preferences, setPreferences } = useDisplayPreferences();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-50 h-full w-[300px] max-w-full bg-white shadow-2xl flex flex-col"
          >
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg">Settings and activity</h2>
                {profileName && (
                  <p className="mt-1 text-sm text-zinc-500">{profileName}</p>
                )}
              </div>
              <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-zinc-100">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <div className="flex flex-col p-2 flex-grow overflow-y-auto">
              <button
                type="button"
                onClick={onAccountClick}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-zinc-100 text-left font-medium text-zinc-900 transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Account
              </button>
              <button
                type="button"
                onClick={onSavedMemesClick}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-zinc-100 text-left font-medium text-zinc-900 transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M7 11h10"/><path d="M7 15h10"/><path d="M7 7h10"/></svg>
                Saved Memes
              </button>
              <button
                type="button"
                disabled
                onClick={() => setIsDisplayOpen((current) => !current)}
                className="flex items-center gap-4 p-4 rounded-xl text-left font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 Z"/></svg>
                Display
              </button>
              {isDisplayOpen ? (
                <div className="mx-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                  <button
                    type="button"
                    onClick={() =>
                      setPreferences((current) => ({
                        ...current,
                        compactFeed: !current.compactFeed,
                      }))
                    }
                    className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-colors hover:bg-white"
                  >
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">Compact feed</p>
                      <p className="text-xs text-zinc-500">Reduce post spacing in feed and profile lists</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${preferences.compactFeed ? 'bg-black text-white' : 'bg-zinc-200 text-zinc-600'}`}>
                      {preferences.compactFeed ? 'On' : 'Off'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPreferences((current) => ({
                        ...current,
                        autoplayVideos: !current.autoplayVideos,
                      }))
                    }
                    className="mt-2 flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-colors hover:bg-white"
                  >
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">Autoplay videos</p>
                      <p className="text-xs text-zinc-500">Start feed videos muted when they render</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${preferences.autoplayVideos ? 'bg-black text-white' : 'bg-zinc-200 text-zinc-600'}`}>
                      {preferences.autoplayVideos ? 'On' : 'Off'}
                    </span>
                  </button>
                </div>
              ) : null}
              
              <div className="mt-auto mb-4 border-t border-zinc-100 pt-4">
                <SignOutButton className="w-full justify-between rounded-xl text-red-500 hover:bg-red-50" />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

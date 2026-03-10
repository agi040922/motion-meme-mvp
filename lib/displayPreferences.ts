'use client';

import { useEffect, useState } from 'react';

export type DisplayPreferences = {
  autoplayVideos: boolean;
  compactFeed: boolean;
};

const STORAGE_KEY = 'motion-meme-display-preferences';
const EVENT_NAME = 'motion-meme-display-preferences';

export const defaultDisplayPreferences: DisplayPreferences = {
  autoplayVideos: false,
  compactFeed: false,
};

const isPreferences = (value: unknown): value is DisplayPreferences => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<DisplayPreferences>;
  return (
    typeof candidate.autoplayVideos === 'boolean' &&
    typeof candidate.compactFeed === 'boolean'
  );
};

export const readDisplayPreferences = (): DisplayPreferences => {
  if (typeof window === 'undefined') {
    return defaultDisplayPreferences;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultDisplayPreferences;
    }

    const parsed = JSON.parse(raw);
    return isPreferences(parsed) ? parsed : defaultDisplayPreferences;
  } catch {
    return defaultDisplayPreferences;
  }
};

export const writeDisplayPreferences = (nextPreferences: DisplayPreferences) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPreferences));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: nextPreferences }));
};

export const useDisplayPreferences = () => {
  const [preferences, setPreferences] = useState<DisplayPreferences>(
    defaultDisplayPreferences,
  );

  useEffect(() => {
    setPreferences(readDisplayPreferences());

    const handlePreferenceChange = (event: Event) => {
      const customEvent = event as CustomEvent<DisplayPreferences>;
      if (isPreferences(customEvent.detail)) {
        setPreferences(customEvent.detail);
        return;
      }

      setPreferences(readDisplayPreferences());
    };

    window.addEventListener(EVENT_NAME, handlePreferenceChange);
    window.addEventListener('storage', handlePreferenceChange);

    return () => {
      window.removeEventListener(EVENT_NAME, handlePreferenceChange);
      window.removeEventListener('storage', handlePreferenceChange);
    };
  }, []);

  return {
    preferences,
    setPreferences: (updater: DisplayPreferences | ((current: DisplayPreferences) => DisplayPreferences)) => {
      const nextPreferences =
        typeof updater === 'function'
          ? updater(readDisplayPreferences())
          : updater;

      setPreferences(nextPreferences);
      writeDisplayPreferences(nextPreferences);
    },
  };
};

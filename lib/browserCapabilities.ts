'use client';

import { useEffect, useState } from 'react';

export type BrowserCapabilities = {
  isMobile: boolean;
  isSafari: boolean;
  supportsShare: boolean;
  supportsClipboardImagePaste: boolean;
  supportsMediaRecorder: boolean;
  supportsPermissionsApi: boolean;
};

const defaultCapabilities: BrowserCapabilities = {
  isMobile: false,
  isSafari: false,
  supportsShare: false,
  supportsClipboardImagePaste: false,
  supportsMediaRecorder: false,
  supportsPermissionsApi: false,
};

export const detectBrowserCapabilities = (): BrowserCapabilities => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return defaultCapabilities;
  }

  const userAgent = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(userAgent);
  const isSafari =
    /Safari/i.test(userAgent) &&
    !/Chrome|CriOS|Chromium|Edg|OPR|SamsungBrowser/i.test(userAgent);

  return {
    isMobile,
    isSafari,
    supportsShare: typeof navigator.share === 'function',
    supportsClipboardImagePaste:
      typeof ClipboardEvent !== 'undefined' &&
      typeof DataTransferItem !== 'undefined' &&
      !isMobile,
    supportsMediaRecorder: typeof MediaRecorder !== 'undefined',
    supportsPermissionsApi:
      'permissions' in navigator && typeof navigator.permissions?.query === 'function',
  };
};

export const useBrowserCapabilities = () => {
  const [capabilities, setCapabilities] = useState<BrowserCapabilities>(
    defaultCapabilities,
  );

  useEffect(() => {
    setCapabilities(detectBrowserCapabilities());
  }, []);

  return capabilities;
};

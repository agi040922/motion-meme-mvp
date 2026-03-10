'use client';

import { useEffect, useState } from 'react';
import { timeAgo } from '@/lib/utils';

interface RelativeTimeProps {
  dateString: string;
  className?: string;
}

export function RelativeTime({ dateString, className = '' }: RelativeTimeProps) {
  const [label, setLabel] = useState('');

  useEffect(() => {
    const update = () => {
      setLabel(timeAgo(dateString));
    };

    update();
    const intervalId = window.setInterval(update, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [dateString]);

  return (
    <span className={className} suppressHydrationWarning>
      {label || '...'}
    </span>
  );
}

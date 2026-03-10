import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallback?: string;
}

export function Avatar({ src, alt, size = 'md', className = '', fallback = 'U' }: AvatarProps) {
  let sizeClass = 'w-10 h-10';
  let textClass = 'text-sm';
  
  if (size === 'sm') {
    sizeClass = 'w-8 h-8';
    textClass = 'text-xs';
  } else if (size === 'lg') {
    sizeClass = 'w-16 h-16';
    textClass = 'text-xl';
  } else if (size === 'xl') {
    sizeClass = 'w-24 h-24';
    textClass = 'text-3xl';
  }

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 rounded-full bg-zinc-200 overflow-hidden select-none ${sizeClass} ${className}`}>
      {src ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt={alt || "Avatar"}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className={`font-medium text-zinc-500 ${textClass}`}>
          {fallback.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}

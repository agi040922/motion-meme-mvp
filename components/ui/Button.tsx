import React, { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', fullWidth = false, children, ...props }, ref) => {
    
    let baseStyles = 'inline-flex items-center justify-center font-medium rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ';
    
    // Variants
    if (variant === 'primary') {
      baseStyles += ' bg-black text-white hover:bg-zinc-800 focus:ring-black ';
    } else if (variant === 'secondary') {
      baseStyles += ' border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100 focus:ring-zinc-200 ';
    } else if (variant === 'ghost') {
      baseStyles += ' bg-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 focus:ring-zinc-200 ';
    } else if (variant === 'icon') {
      baseStyles += ' bg-transparent text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 focus:ring-zinc-200 ';
    } else if (variant === 'danger') {
      baseStyles += ' bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 ';
    }

    // Sizes
    if (size === 'sm') {
      baseStyles += ' px-3 py-1.5 text-sm ';
    } else if (size === 'md') {
      baseStyles += ' px-4 py-2 text-base ';
    } else if (size === 'lg') {
      baseStyles += ' px-6 py-3 text-lg font-semibold ';
    } else if (size === 'icon') {
      baseStyles += ' p-2 ';
    }

    if (fullWidth) {
      baseStyles += ' w-full ';
    }

    return (
      <button ref={ref} className={`${baseStyles} ${className}`} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

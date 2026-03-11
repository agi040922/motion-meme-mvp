'use client';

import React from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { useScroll } from '@/components/ui/use-scroll';
import { cn } from '@/lib/utils';

type HeaderProps = {
  primaryCtaHref: string;
  primaryCtaLabel: string;
  secondaryCtaHref?: string;
  secondaryCtaLabel?: string;
};

const links = [
  { label: 'How It Works', href: '#features' },
  { label: 'Feed Preview', href: '#feed-preview' },
  { label: 'Start Here', href: '#cta' },
];

const headerButtonVariants = ({
  variant = 'default',
  size = 'default',
  className = '',
}: {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm';
  className?: string;
}) =>
  cn(
    'inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none',
    variant === 'default' && 'bg-white text-black hover:bg-zinc-100',
    variant === 'outline' && 'border border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white',
    variant === 'secondary' && 'bg-zinc-900 text-white hover:bg-zinc-800',
    variant === 'ghost' && 'text-white/72 hover:bg-white/10 hover:text-white',
    size === 'default' && 'h-10 px-4 py-2',
    size === 'sm' && 'h-9 px-3',
    className,
  );

export function Header({
  primaryCtaHref,
  primaryCtaLabel,
  secondaryCtaHref = '/feed',
  secondaryCtaLabel = 'Open Feed',
}: HeaderProps) {
  const [open, setOpen] = React.useState(false);
  const scrolled = useScroll(10);

  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const closeMenu = React.useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <header className="sticky top-0 z-[120] px-3 pt-3 md:px-4 md:pt-4">
      <div
        className={cn(
          'mx-auto w-full max-w-5xl border border-transparent bg-transparent transition-all duration-300 ease-out md:rounded-[20px]',
          {
            'border-white/12 bg-black/65 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl':
              scrolled && !open,
            'border-white/12 bg-black/90 shadow-[0_20px_80px_rgba(0,0,0,0.3)] backdrop-blur-xl':
              open,
          },
        )}
      >
        <nav
          className={cn(
            'flex h-14 w-full items-center justify-between px-4 md:h-12 md:transition-all md:ease-out',
            { 'md:px-3': scrolled },
          )}
        >
          <Link href="/" className="flex items-center">
            <WordmarkIcon className="h-6 w-auto text-white" />
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {links.map((link) => (
              <a
                key={link.label}
                className={headerButtonVariants({ variant: 'ghost', size: 'sm' })}
                href={link.href}
              >
                {link.label}
              </a>
            ))}

            <Link
              href={secondaryCtaHref}
              className={headerButtonVariants({
                variant: 'outline',
                size: 'sm',
                className: 'ml-1',
              })}
            >
              {secondaryCtaLabel}
            </Link>
            <Link
              href={primaryCtaHref}
              className={headerButtonVariants({
                size: 'sm',
              })}
            >
              {primaryCtaLabel}
            </Link>
          </div>

          <Button
            size="icon"
            variant="secondary"
            onClick={() => setOpen((prevOpen) => !prevOpen)}
            className="md:hidden"
          >
            <MenuToggleIcon open={open} className="size-5" duration={300} />
          </Button>
        </nav>
      </div>

      <div
        className={cn(
          'fixed inset-x-3 top-[72px] bottom-3 z-[119] flex flex-col overflow-hidden rounded-[28px] border border-white/12 bg-black/92 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl md:hidden',
          open ? 'block' : 'hidden',
        )}
      >
        <div
          data-slot={open ? 'open' : 'closed'}
          className={cn(
            'data-[slot=open]:animate-in data-[slot=open]:zoom-in-95 data-[slot=closed]:animate-out data-[slot=closed]:zoom-out-95 ease-out',
            'flex h-full w-full flex-col justify-between gap-y-3 p-4',
          )}
        >
          <div className="grid gap-y-2">
            {links.map((link) => (
              <a
                key={link.label}
                className={headerButtonVariants({
                  variant: 'ghost',
                  className: 'h-11 justify-start rounded-2xl px-4 text-base',
                })}
                href={link.href}
                onClick={closeMenu}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <Link
              href={secondaryCtaHref}
              className={headerButtonVariants({
                variant: 'outline',
                className: 'h-11 w-full rounded-2xl',
              })}
              onClick={closeMenu}
            >
              {secondaryCtaLabel}
            </Link>
            <Link
              href={primaryCtaHref}
              className={headerButtonVariants({
                className: 'h-11 w-full rounded-2xl',
              })}
              onClick={closeMenu}
            >
              {primaryCtaLabel}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export const WordmarkIcon = (props: React.ComponentProps<'svg'>) => (
  <svg viewBox="0 0 190 28" fill="none" {...props}>
    <rect x="1" y="1" width="26" height="26" rx="13" fill="currentColor" fillOpacity="0.14" />
    <path
      d="M8 19V9.2h2.44l2.94 4.78 2.94-4.78h2.42V19h-2.28v-6.16l-3.08 4.9h-.08l-3.06-4.86V19H8Z"
      fill="currentColor"
    />
    <text
      x="39"
      y="12"
      fill="currentColor"
      fontFamily="Inter, system-ui, sans-serif"
      fontSize="8"
      letterSpacing="3.2"
    >
      MOTION MEME
    </text>
    <text
      x="39"
      y="23"
      fill="currentColor"
      fillOpacity="0.74"
      fontFamily="Inter, system-ui, sans-serif"
      fontSize="10"
    >
      Camera-first social network
    </text>
  </svg>
);

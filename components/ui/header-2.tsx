'use client';

import React from 'react';
import Image from 'next/image';
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
  tone = 'light',
  className = '',
}: {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm';
  tone?: 'light' | 'dark';
  className?: string;
}) =>
  cn(
    'inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none',
    variant === 'default' &&
      (tone === 'light'
        ? 'bg-white text-black hover:bg-zinc-100'
        : 'bg-black text-white hover:bg-zinc-800'),
    variant === 'outline' &&
      (tone === 'light'
        ? 'border border-white/24 bg-white/8 text-white hover:bg-white/14 hover:text-white'
        : 'border border-black/10 bg-white text-zinc-900 hover:bg-zinc-100'),
    variant === 'secondary' &&
      (tone === 'light'
        ? 'bg-zinc-900 text-white hover:bg-zinc-800'
        : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200'),
    variant === 'ghost' &&
      (tone === 'light'
        ? 'text-white/84 hover:bg-white/12 hover:text-white'
        : 'text-zinc-700 hover:bg-black/5 hover:text-zinc-950'),
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
  const [pastHero, setPastHero] = React.useState(false);

  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const closeMenu = React.useCallback(() => {
    setOpen(false);
  }, []);

  React.useEffect(() => {
    const handleThemeShift = () => {
      const featuresSection = document.getElementById('features');

      if (!featuresSection) {
        setPastHero(false);
        return;
      }

      const featuresTop = featuresSection.offsetTop;
      const headerOffset = 96;
      setPastHero(window.scrollY >= featuresTop - headerOffset);
    };

    handleThemeShift();
    window.addEventListener('scroll', handleThemeShift);
    window.addEventListener('resize', handleThemeShift);

    return () => {
      window.removeEventListener('scroll', handleThemeShift);
      window.removeEventListener('resize', handleThemeShift);
    };
  }, []);

  const isLightSurface = pastHero && !open;

  return (
    <header className="sticky top-0 z-[120] px-3 pt-3 md:px-4 md:pt-4">
      <div
        className={cn(
          'mx-auto w-full max-w-5xl border backdrop-blur-xl transition-all duration-300 ease-out md:rounded-[20px]',
          {
            'border-white/12 bg-black/58 shadow-[0_20px_80px_rgba(0,0,0,0.2)]':
              !isLightSurface && !open,
            'border-black/8 bg-white/88 shadow-[0_18px_70px_rgba(15,23,42,0.12)]':
              isLightSurface,
            'border-white/14 bg-black/90 shadow-[0_22px_88px_rgba(0,0,0,0.34)]':
              open,
          },
        )}
      >
        <nav
          className={cn(
            'flex h-14 w-full items-center justify-between px-4 md:h-14 md:transition-all md:ease-out',
            { 'md:px-3': scrolled },
          )}
        >
          <Link
            href="/"
            className={cn('flex items-center gap-3 transition-colors', {
              'text-white': !isLightSurface,
              'text-zinc-950': isLightSurface,
            })}
          >
            <div
              className={cn(
                'relative size-9 overflow-hidden rounded-full bg-white shadow-[0_8px_20px_rgba(0,0,0,0.14)] ring-1 ring-black/8',
                {
                  'border border-white/18': !isLightSurface,
                  'border border-black/10': isLightSurface,
                },
              )}
            >
              <Image
                src="/favicon-32x32.png"
                alt="Motion Meme logo"
                fill
                sizes="36px"
                className="object-contain"
                priority
              />
            </div>
            <span className="text-base font-black uppercase tracking-[0.28em] md:text-xl">
              Motion Meme
            </span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {links.map((link) => (
              <a
                key={link.label}
                className={headerButtonVariants({
                  variant: 'ghost',
                  size: 'sm',
                  tone: isLightSurface ? 'dark' : 'light',
                })}
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
                tone: isLightSurface ? 'dark' : 'light',
                className: 'ml-1',
              })}
            >
              {secondaryCtaLabel}
            </Link>
            <Link
              href={primaryCtaHref}
              className={headerButtonVariants({
                size: 'sm',
                tone: isLightSurface ? 'dark' : 'light',
              })}
            >
              {primaryCtaLabel}
            </Link>
          </div>

          <Button
            size="icon"
            variant="secondary"
            onClick={() => setOpen((prevOpen) => !prevOpen)}
            className={cn('md:hidden', {
              'border-white/20 bg-white/8 text-white hover:bg-white/14': !isLightSurface,
              'border-black/10 bg-white text-zinc-950 hover:bg-zinc-100': isLightSurface,
            })}
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

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import type { SocialIdentity } from '@/components/layout/socialUi';
import {
  HomeIcon,
  SearchIcon,
  PlusIcon,
  UserIcon,
  SettingsIcon,
  MessageCircleIcon,
  HistoryIcon,
} from '../ui/icons';
import { ComposeModal } from '../feed/ComposeModal';

interface LeftRailProps {
  currentUser?: SocialIdentity | null;
}

export function LeftRail({ currentUser }: LeftRailProps) {
  const pathname = usePathname();
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const menuItems = [
    { href: '/feed', label: 'Home', icon: HomeIcon },
    { href: '/search', label: 'Search', icon: SearchIcon },
    currentUser
      ? { href: '/messages', label: 'Messages', icon: MessageCircleIcon }
      : null,
    currentUser
      ? { href: '/history', label: 'History', icon: HistoryIcon }
      : null,
    currentUser
      ? { href: `/profile/${currentUser.handle}`, label: 'Profile', icon: UserIcon }
      : null,
  ].filter(Boolean) as Array<{ href: string; label: string; icon: typeof HomeIcon }>;

  const composeLabel = currentUser ? 'Compose' : 'Sign in to post';

  const settingsHref = currentUser ? `/profile/${currentUser.handle}?menu=true` : '/search';

  const openCompose = () => {
    setIsComposeOpen(true);
  };

  const closeCompose = () => {
    setIsComposeOpen(false);
  };

  const composeDisabled = !currentUser;

  return (
    <>
      <nav className="fixed bottom-0 left-0 z-40 w-full border-t border-zinc-200 bg-white/80 backdrop-blur-md md:left-0 md:top-0 md:h-screen md:w-[280px] md:border-r md:border-t-0 md:bg-transparent md:backdrop-blur-none flex flex-col">
        {/* Desktop Logo Area */}
        <div className="hidden md:flex items-center px-8 py-8 mb-4">
          <Link href="/feed" className="flex items-center gap-3">
            <div className="relative w-8 h-8 overflow-hidden">
              <Image
                src="/favicon-32x32.png"
                alt="Motion Meme favicon"
                fill
                sizes="32px"
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl font-bold tracking-tight">Motion Meme</span>
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="flex w-full items-end justify-around px-3 py-2 pb-safe md:flex-col md:items-stretch md:justify-start md:p-4 md:space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-center gap-4 group min-h-[44px] min-w-[44px] p-2 md:justify-start md:px-6 md:py-4 rounded-full transition-colors ${
                  isActive
                    ? 'font-bold text-black'
                    : 'text-zinc-500 hover:text-black hover:bg-zinc-100'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                <span className="hidden md:block text-lg">{item.label}</span>
              </Link>
            )
          })}

          {/* Settings - Mobile Only */}
          <Link href={settingsHref} className="flex items-center justify-center group min-h-[44px] min-w-[44px] p-2 md:hidden rounded-full text-zinc-500 hover:text-black hover:bg-zinc-100 transition-colors">
            <SettingsIcon className="w-6 h-6" />
          </Link>
        </div>

        {/* Desktop Main Actions */}
        <div className="hidden md:flex flex-col gap-3 mt-auto mb-8 px-6">
          <button 
            type="button"
            onClick={openCompose}
            disabled={composeDisabled}
            className="w-full flex items-center justify-center gap-2 bg-zinc-100 text-zinc-900 py-4 rounded-2xl font-semibold hover:bg-zinc-200 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusIcon className="w-5 h-5" />
            <span>{composeLabel}</span>
          </button>
        </div>

        {/* Mobile Compose FAB */}
        <div className="md:hidden fixed bottom-20 right-4 z-50">
          <button 
            type="button"
            onClick={openCompose}
            disabled={composeDisabled}
            className="bg-black text-white p-4 rounded-full shadow-lg shadow-black/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusIcon className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Compose Modal */}
      <ComposeModal isOpen={isComposeOpen} onClose={closeCompose} currentUser={currentUser} />
    </>
  );
}

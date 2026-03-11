'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ProfileTab, SocialProfile } from '@/components/layout/socialUi';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { BuyCreditsModal } from '@/components/profile/BuyCreditsModal';
import { StartDmButton } from '@/components/messages/StartDmButton';
import { toggleFollow } from '@/features/meme/browser';
import { useCreditBalance } from '@/lib/credits';

interface ProfileHeaderProps {
  user: SocialProfile;
  onMenuClick?: () => void;
  onEditProfile?: () => void;
  activeTab: ProfileTab;
  onTabChange?: (tab: ProfileTab) => void;
}

const PROFILE_TABS: Array<{ id: ProfileTab; label: string }> = [
  { id: 'posts', label: 'Posts' },
  { id: 'videos', label: 'Videos' },
  { id: 'likes', label: 'Saved' },
];

export function ProfileHeader({
  user,
  onMenuClick,
  onEditProfile,
  activeTab,
  onTabChange,
}: ProfileHeaderProps) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(user.relationship.isFollowing);
  const [isBuyCreditsOpen, setIsBuyCreditsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isCurrentUser = user.relationship.isCurrentUser;
  const { balance, isLoading } = useCreditBalance();
  const visibleTabs = isCurrentUser
    ? PROFILE_TABS
    : PROFILE_TABS.filter((tab) => tab.id !== 'likes');

  return (
    <div className="bg-white pt-6 pb-4 border-b border-zinc-100 px-4 md:px-6">
      <div className="flex items-start justify-between mb-4">
        {/* Avatar and Basic Info */}
        <div className="flex flex-col gap-3">
          <Avatar
            src={user.avatarUrl ?? undefined}
            alt={user.handle}
            size="xl"
            fallback={user.displayName}
            className="border-4 border-white shadow-sm ring-1 ring-zinc-100"
          />
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{user.displayName}</h1>
            <p className="text-zinc-500">@{user.handle}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isCurrentUser ? (
            <>
              <Button
                variant="secondary"
                size="md"
                className="px-5 font-semibold"
                onClick={onEditProfile}
              >
                Edit profile
              </Button>
              <Button variant="secondary" size="icon" onClick={onMenuClick}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
              </Button>
            </>
          ) : (
            <>
              <StartDmButton
                targetUserId={user.id}
                targetHandle={user.handle}
                variant="secondary"
                size="md"
                className="px-5 font-semibold"
              />
              <Button
                type="button"
                aria-pressed={isFollowing}
                variant={isFollowing ? "secondary" : "primary"}
                size="md"
                className="px-6 font-semibold"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    try {
                      const nextState = await toggleFollow(user.id, isFollowing);
                      setIsFollowing(nextState);
                      router.refresh();
                    } catch {
                      setIsFollowing(user.relationship.isFollowing);
                    }
                  });
                }}
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Bio */}
      <p className="text-zinc-800 mb-4 whitespace-pre-wrap">{user.bio}</p>

      {/* Stats row */}
      <div className="mb-6 flex flex-wrap items-center gap-6 text-sm">
        {isCurrentUser ? (
          <button
            type="button"
            onClick={() => setIsBuyCreditsOpen(true)}
            className="inline-flex items-center gap-1.5 text-left transition-colors hover:text-zinc-900"
          >
            <span className="font-bold text-zinc-900">{isLoading ? '...' : balance}</span>
            <span className="text-zinc-500">Credits</span>
          </button>
        ) : null}
        <div className="inline-flex items-center gap-1.5">
          <span className="font-bold text-zinc-900">{user.stats.following}</span>
          <span className="text-zinc-500">Following</span>
        </div>
        <div className="inline-flex items-center gap-1.5">
          <span className="font-bold text-zinc-900">{user.stats.followers}</span>
          <span className="text-zinc-500">Followers</span>
        </div>
        <div className="inline-flex items-center gap-1.5">
          <span className="font-bold text-zinc-900">{user.stats.totalPlays}</span>
          <span className="text-zinc-500">Plays</span>
        </div>
      </div>

      {/* Motion Meme specific featured stats */}
      <div className="flex gap-2 w-full overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar">
        <div className="shrink-0 bg-black text-white rounded-2xl p-4 min-w-[140px] flex flex-col justify-center">
          <span className="text-zinc-400 text-xs uppercase tracking-wider font-bold mb-1">Best Score</span>
          <span className="text-3xl font-extrabold text-[#a3ff00]">{user.stats.bestScore ?? 0}</span>
        </div>
        
        {user.featuredMeme && (
          <div className="shrink-0 bg-zinc-100 rounded-2xl p-4 min-w-[140px] flex flex-col justify-center border border-zinc-200">
            <span className="text-zinc-500 text-xs uppercase tracking-wider font-bold mb-1">Top Meme</span>
            <span className="text-xl font-bold text-zinc-900 leading-tight">{user.featuredMeme}</span>
          </div>
        )}
      </div>
      
      {/* Tab Navigation (Visual only for MVP) */}
      <div className="flex mt-6 gap-6 w-full border-b border-zinc-100">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange?.(tab.id)}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-black font-bold text-zinc-900'
                : 'border-transparent font-medium text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isCurrentUser ? (
        <BuyCreditsModal isOpen={isBuyCreditsOpen} onClose={() => setIsBuyCreditsOpen(false)} />
      ) : null}
    </div>
  );
}

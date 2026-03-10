'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { SocialProfile } from '@/components/layout/socialUi';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { toggleFollow } from '@/features/meme/browser';

interface UserCardProps {
  user: SocialProfile;
}

export function UserCard({ user }: UserCardProps) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(user.relationship.isFollowing);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between p-4 hover:bg-zinc-50/50 transition-colors border-b border-zinc-50 last:border-0">
      <Link href={`/profile/${user.handle}`} className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar
          src={user.avatarUrl ?? undefined}
          alt={user.handle}
          size="md"
          fallback={user.displayName}
        />
        <div className="flex flex-col flex-1 min-w-0">
          <span className="font-bold text-zinc-900 truncate">{user.displayName}</span>
          <span className="text-zinc-500 text-sm truncate">@{user.handle}</span>
          {user.bio && (
            <span className="mt-1 text-sm text-zinc-500 line-clamp-1">{user.bio}</span>
          )}
        </div>
      </Link>

      {user.relationship.isCurrentUser ? (
        <span className="ml-4 shrink-0 rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-semibold text-zinc-500">
          You
        </span>
      ) : (
        <Button
          type="button"
          aria-pressed={isFollowing}
          variant={isFollowing ? 'secondary' : 'primary'}
          size="sm"
          className="ml-4 w-28 shrink-0"
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
          {isFollowing ? 'Following' : 'Follow'}
        </Button>
      )}
    </div>
  );
}

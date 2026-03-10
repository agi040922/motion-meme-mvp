'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { SocialProfile } from '@/components/layout/socialUi';
import { updateProfile } from '@/features/meme/browser';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: SocialProfile;
  onProfileUpdated: (updates: {
    handle: string;
    displayName: string;
    bio: string;
  }) => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
}: EditProfileModalProps) {
  const router = useRouter();
  const [handle, setHandle] = useState(profile.handle);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio ?? '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setHandle(profile.handle);
    setDisplayName(profile.displayName);
    setBio(profile.bio ?? '');
    setErrorMessage(null);
  }, [isOpen, profile.bio, profile.displayName, profile.handle]);

  const handleSave = () => {
    startTransition(async () => {
      try {
        setErrorMessage(null);
        const updated = await updateProfile({
          handle,
          displayName,
          bio,
        });

        onProfileUpdated({
          handle: updated.handle,
          displayName: updated.display_name,
          bio: updated.bio,
        });
        onClose();
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Profile could not be updated.',
        );
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit profile">
      <div className="space-y-4 p-4">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Handle
          </label>
          <input
            value={handle}
            onChange={(event) => setHandle(event.target.value)}
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-300"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Display name
          </label>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-300"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            rows={4}
            className="w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-300"
          />
        </div>

        {errorMessage ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-3 border-t border-zinc-100 pt-4">
          <Button
            type="button"
            variant="secondary"
            className="rounded-full px-5"
            disabled={isPending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            className="rounded-full px-5"
            disabled={!handle.trim() || !displayName.trim() || isPending}
            onClick={handleSave}
          >
            {isPending ? 'Saving...' : 'Save profile'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

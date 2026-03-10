'use client';

import React, { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Modal } from '../ui/Modal';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import type { SocialIdentity } from '@/components/layout/socialUi';
import { VideoIcon, ImageIcon, TypeIcon, CameraIcon } from '../ui/icons';
import { createPost } from '@/features/meme/browser';
import type { MediaType } from '@/features/meme/types';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: SocialIdentity | null;
  onSubmit?: (content: string) => void;
  isSubmitting?: boolean;
}

export function ComposeModal({
  isOpen,
  onClose,
  currentUser,
  onSubmit,
  isSubmitting = false,
}: ComposeModalProps) {
  const [content, setContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType | null>(null);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const composeRootRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const router = useRouter();
  const isBusy = isSubmitting || isPending;
  const canPost =
    Boolean(currentUser) &&
    (content.trim().length > 0 || Boolean(selectedMedia)) &&
    !isBusy;

  const resetComposer = () => {
    setContent('');
    setSelectedMedia(null);
    setSelectedMediaType(null);
    setSelectedMediaUrl(null);
    setErrorMessage(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  useEffect(() => {
    if (!selectedMedia) {
      setSelectedMediaUrl(null);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedMedia);
    setSelectedMediaUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedMedia]);

  useEffect(() => {
    if (!isOpen) {
      setContent('');
      setSelectedMedia(null);
      setSelectedMediaType(null);
      setSelectedMediaUrl(null);
      setErrorMessage(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  }, [isOpen]);

  const setMediaAttachment = useCallback((file: File | null, mediaType: MediaType | null) => {
    setSelectedMedia(file);
    setSelectedMediaType(mediaType);
    setErrorMessage(null);

    if (!file) {
      if (imageInputRef.current) imageInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  }, []);

  const handleMediaSelection = useCallback((file: File | null, mediaType: MediaType) => {
    if (!file) {
      setMediaAttachment(null, null);
      return;
    }

    const normalizedFile =
      file.name.trim().length > 0
        ? file
        : new File([file], `clipboard-image.${file.type.split('/')[1] ?? 'png'}`, {
            type: file.type || 'image/png',
          });

    setMediaAttachment(normalizedFile, mediaType);
  }, [setMediaAttachment]);

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!currentUser || isBusy) {
      return;
    }

    const pastedImage = Array.from(event.clipboardData.items).find((item) =>
      item.type.startsWith('image/'),
    );
    const imageFile = pastedImage?.getAsFile() ?? null;

    if (!imageFile) {
      return;
    }

    event.preventDefault();
    handleMediaSelection(imageFile, 'image');
  };

  useEffect(() => {
    if (!isOpen || !currentUser || isBusy) {
      return;
    }

    const handleWindowPaste = (event: ClipboardEvent) => {
      const pastedImage = Array.from(event.clipboardData?.items ?? []).find((item) =>
        item.type.startsWith('image/'),
      );
      const imageFile = pastedImage?.getAsFile() ?? null;

      if (!imageFile) {
        return;
      }

      event.preventDefault();
      handleMediaSelection(imageFile, 'image');
    };

    window.addEventListener('paste', handleWindowPaste);
    return () => {
      window.removeEventListener('paste', handleWindowPaste);
    };
  }, [currentUser, handleMediaSelection, isBusy, isOpen]);

  const selectedMediaSizeLabel = selectedMedia
    ? `${(selectedMedia.size / 1024 / 1024).toFixed(2)} MB`
    : null;

  const handlePost = () => {
    if (!canPost) {
      return;
    }

    startTransition(async () => {
      try {
        setErrorMessage(null);

        if (onSubmit) {
          onSubmit(content.trim());
        } else {
          await createPost({
            caption: content.trim(),
            mediaFile: selectedMedia,
            mediaType: selectedMediaType,
          });
          router.refresh();
        }

        resetComposer();
        onClose();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Failed to create post.',
        );
      }
    });
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Post">
      <div ref={composeRootRef} className="p-4 flex gap-4">
        <Avatar
          src={currentUser?.avatarUrl ?? undefined}
          alt={currentUser?.handle}
          fallback={currentUser?.displayName ?? 'G'}
        />
        <div className="flex-1">
          <div className="rounded-[28px] border border-zinc-200 bg-zinc-50 p-4 transition-colors focus-within:border-zinc-200 focus-within:bg-zinc-50 focus-within:ring-0">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">
              Caption
            </p>
            <textarea
              ref={textareaRef}
              className="w-full resize-none border-none bg-transparent p-0 text-lg text-zinc-900 shadow-none outline-none ring-0 placeholder:text-zinc-400 focus:border-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
              rows={4}
              placeholder={
                currentUser ? 'Share your moves, score, or reaction...' : 'Sign in to share your moves...'
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onPaste={handlePaste}
              disabled={!currentUser || isBusy}
            />
          </div>

          {!currentUser && (
            <p className="mt-3 text-sm text-zinc-500">
              Posting is available once a signed-in profile is present.{" "}
              <Link href="/auth/login?next=/feed" className="font-semibold text-zinc-900 underline">
                Sign in
              </Link>
            </p>
          )}

          {selectedMedia && selectedMediaUrl && (
            <div className="mt-4 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50">
              <div className="aspect-[4/3] w-full bg-zinc-100">
                {selectedMediaType === 'video' ? (
                  <video
                    src={selectedMediaUrl}
                    className="h-full w-full object-cover"
                    controls
                    muted
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={selectedMediaUrl}
                    alt={selectedMedia.name || 'Attached image preview'}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900">
                    {selectedMedia.name || 'Attached media'}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Ready to post as a {selectedMediaType ?? 'media'} attachment
                    {selectedMediaSizeLabel ? ` · ${selectedMediaSizeLabel}` : ''}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="shrink-0 px-3"
                  disabled={isBusy}
                  onClick={() => setMediaAttachment(null, null)}
                >
                  Remove
                </Button>
              </div>
            </div>
          )}

          {errorMessage && (
            <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMessage}
            </p>
          )}

          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={!currentUser || isBusy}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              handleMediaSelection(file, 'image');
            }}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/webm,video/mp4"
            className="hidden"
            disabled={!currentUser || isBusy}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              handleMediaSelection(file, 'video');
            }}
          />
          
          <div className="mt-4 rounded-3xl border border-zinc-100 bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  title="Attach image"
                  className="h-11 w-11 rounded-2xl border-zinc-200 focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0"
                  disabled={!currentUser || isBusy}
                  onClick={() => imageInputRef.current?.click()}
                >
                  <ImageIcon className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  title="Attach video"
                  className="h-11 w-11 rounded-2xl border-zinc-200 focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0"
                  disabled={!currentUser || isBusy}
                  onClick={() => videoInputRef.current?.click()}
                >
                  <VideoIcon className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  title="Text mode"
                  className="h-11 w-11 rounded-2xl border-zinc-200 focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0"
                  disabled={!currentUser || isBusy}
                  onClick={() => textareaRef.current?.focus()}
                >
                  <TypeIcon className="h-5 w-5" />
                </Button>
                <Link
                  href={currentUser ? '/camera' : '/auth/login?next=/camera'}
                  title="Open /play"
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition-colors focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 ${
                    currentUser
                      ? 'border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50'
                      : 'pointer-events-none border-zinc-200 bg-zinc-50 text-zinc-400'
                  }`}
                >
                  <CameraIcon className="h-5 w-5" />
                </Link>
              </div>

              <Button
                variant="primary"
                className="rounded-full px-6 focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0"
                disabled={!canPost}
                onClick={handlePost}
              >
                {isBusy ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

'use client';

import Link from 'next/link';
import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { SocialPost } from '@/components/layout/socialUi';
import { Avatar } from '../ui/Avatar';
import { HeartIcon, MessageCircleIcon, SendIcon, MoreHorizontalIcon } from '../ui/icons';
import { Button } from '../ui/Button';
import { RelativeTime } from '../ui/RelativeTime';
import { useDisplayPreferences } from '@/lib/displayPreferences';
import { StartDmButton } from '@/components/messages/StartDmButton';
import {
  addComment,
  blockUser,
  updateComment,
  deleteComment,
  deletePost,
  hidePost,
  reportPost,
  toggleBookmark,
  updatePost,
  togglePostLike,
} from '@/features/meme/browser';

interface FeedPostProps {
  post: SocialPost;
  currentUser?: {
    id: string;
  } | null;
}

const DUET_TAG_PATTERN = /^with\s+@([a-z0-9._-]+)\s*[·-]\s*/i;

export function FeedPost({ post, currentUser }: FeedPostProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(post.viewerState.liked);
  const [isSaved, setIsSaved] = useState(post.viewerState.saved);
  const [likeCount, setLikeCount] = useState(post.counts.likes);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [body, setBody] = useState(post.body);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editingPostDraft, setEditingPostDraft] = useState(post.body);
  const [comments, setComments] = useState(post.commentsPreview ?? []);
  const [commentDraft, setCommentDraft] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentDraft, setEditingCommentDraft] = useState('');
  const [commentCount, setCommentCount] = useState(post.counts.comments);
  const [commentErrorMessage, setCommentErrorMessage] = useState<string | null>(null);
  const [postErrorMessage, setPostErrorMessage] = useState<string | null>(null);
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [isProcessingMoreAction, setIsProcessingMoreAction] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [isRemoved, setIsRemoved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isVideo = post.media?.kind === 'video';
  const canComment = Boolean(post.viewerState.currentUserId);
  const { preferences } = useDisplayPreferences();
  const isCurrentUsersPost =
    (post.viewerState.currentUserId && post.author.id === post.viewerState.currentUserId) ||
    (currentUser?.id && post.author.id === currentUser.id) ||
    post.author.relationship.isCurrentUser;
  const duetMatch = body.match(DUET_TAG_PATTERN);
  const duetHandle = duetMatch?.[1] ?? null;
  const postBody = duetMatch ? body.replace(DUET_TAG_PATTERN, '') : body;

  const handleLike = () => {
    // 낙관적 업데이트: startTransition 바깥에서 즉시 UI 반영
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikeCount((current) => current + (nextLiked ? 1 : -1));

    startTransition(async () => {
      try {
        const actualLiked = await togglePostLike(post.id, isLiked);
        setIsLiked(actualLiked);
      } catch {
        // 실패 시 원래 상태로 복구
        setIsLiked(post.viewerState.liked);
        setLikeCount(post.counts.likes);
      }
    });
  };

  const handleComment = async () => {
    const trimmedDraft = commentDraft.trim();
    if (!trimmedDraft || !canComment) {
      return;
    }

    setIsCommentSubmitting(true);
    setCommentErrorMessage(null);

    try {
      const createdComment = await addComment(post.id, trimmedDraft);
      setComments((current) => [...current, createdComment]);
      setCommentDraft('');
      setCommentCount((current) => current + 1);
      setIsCommentsOpen(true);
      router.refresh();
    } catch (error) {
      setCommentErrorMessage(
        error instanceof Error
          ? error.message
          : 'Comment could not be posted. Please try again.',
      );
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Delete this post? This removes it from your feed and profile.')) {
      return;
    }

    setIsMenuOpen(false);
    setPostErrorMessage(null);
    setIsDeletingPost(true);
    setIsRemoved(true);

    try {
      await deletePost(post.id);
      router.refresh();
    } catch (error) {
      setIsRemoved(false);
      setPostErrorMessage(
        error instanceof Error ? error.message : 'Post could not be deleted. Please try again.',
      );
    } finally {
      setIsDeletingPost(false);
    }
  };

  const handleStartEditingPost = () => {
    setIsMenuOpen(false);
    setPostErrorMessage(null);
    setIsEditingPost(true);
    setEditingPostDraft(body);
  };

  const handleCancelEditingPost = () => {
    setIsEditingPost(false);
    setEditingPostDraft(body);
  };

  const handleSavePost = async () => {
    const trimmedDraft = editingPostDraft.trim();
    if (!trimmedDraft && !post.media) {
      setPostErrorMessage('Post caption cannot be empty.');
      return;
    }

    const previousBody = body;
    setPostErrorMessage(null);
    setBody(trimmedDraft);
    setIsSavingPost(true);

    try {
      const updatedCaption = await updatePost(post.id, trimmedDraft);
      setBody(updatedCaption);
      setIsEditingPost(false);
      router.refresh();
    } catch (error) {
      setBody(previousBody);
      setPostErrorMessage(
        error instanceof Error ? error.message : 'Post could not be updated. Please try again.',
      );
    } finally {
      setIsSavingPost(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Delete this comment?')) {
      return;
    }

    const previousComments = comments;
    const nextComments = comments.filter((comment) => comment.id !== commentId);

    setDeletingCommentId(commentId);
    setCommentErrorMessage(null);
    setComments(nextComments);
    setCommentCount((current) => Math.max(0, current - 1));

    try {
      await deleteComment(commentId);
      router.refresh();
    } catch (error) {
      setComments(previousComments);
      setCommentCount((current) => current + 1);
      setCommentErrorMessage(
        error instanceof Error ? error.message : 'Comment could not be deleted. Please try again.',
      );
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleShare = async () => {
    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/profile/${post.author.handle}#post-${post.id}`
        : '';

    if (!shareUrl) {
      return;
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${post.author.displayName} on Motion Meme`,
          text: post.body || `${post.author.displayName}'s latest motion meme post`,
          url: shareUrl,
        });
        setShareFeedback('Shared');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShareFeedback('Copied');
      }
    } catch {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareFeedback('Copied');
      } catch {
        setShareFeedback('Share unavailable');
      }
    }

    window.setTimeout(() => {
      setShareFeedback(null);
    }, 1800);
  };

  const copyPostLink = async () => {
    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/profile/${post.author.handle}#post-${post.id}`
        : '';

    if (!shareUrl) {
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
    setShareFeedback('Copied');
    window.setTimeout(() => {
      setShareFeedback(null);
    }, 1800);
  };

  const handleToggleSave = () => {
    startTransition(async () => {
      const nextSaved = !isSaved;
      setIsSaved(nextSaved);
      setPostErrorMessage(null);

      try {
        const actualSaved = await toggleBookmark(post.id, isSaved);
        setIsSaved(actualSaved);
        setShareFeedback(actualSaved ? 'Saved' : 'Unsaved');
        setIsMenuOpen(false);
        router.refresh();
      } catch (error) {
        setIsSaved(post.viewerState.saved);
        setPostErrorMessage(
          error instanceof Error ? error.message : 'Post could not be saved. Please try again.',
        );
      }
    });
  };

  const handleHidePost = async () => {
    setIsProcessingMoreAction(true);
    setPostErrorMessage(null);

    try {
      await hidePost(post.id);
      setIsRemoved(true);
      setIsMenuOpen(false);
      router.refresh();
    } catch (error) {
      setPostErrorMessage(
        error instanceof Error ? error.message : 'Post could not be hidden. Please try again.',
      );
    } finally {
      setIsProcessingMoreAction(false);
    }
  };

  const handleBlockAuthor = async () => {
    if (!window.confirm(`Block @${post.author.handle}? Their posts and comments will be hidden.`)) {
      return;
    }

    setIsProcessingMoreAction(true);
    setPostErrorMessage(null);

    try {
      await blockUser(post.author.id);
      setIsRemoved(true);
      setIsMenuOpen(false);
      router.refresh();
    } catch (error) {
      setPostErrorMessage(
        error instanceof Error ? error.message : 'User could not be blocked. Please try again.',
      );
    } finally {
      setIsProcessingMoreAction(false);
    }
  };

  const handleReportPost = async () => {
    setIsProcessingMoreAction(true);
    setPostErrorMessage(null);

    try {
      await reportPost({
        postId: post.id,
        reason: 'other',
        detail: `Reported from feed by @${post.viewerState.currentUserId ?? 'viewer'}`,
      });
      setShareFeedback('Reported');
      setIsMenuOpen(false);
    } catch (error) {
      setPostErrorMessage(
        error instanceof Error ? error.message : 'Report could not be submitted. Please try again.',
      );
    } finally {
      setIsProcessingMoreAction(false);
    }
  };

  const handleStartEditingComment = (commentId: string, currentContent: string) => {
    setCommentErrorMessage(null);
    setEditingCommentId(commentId);
    setEditingCommentDraft(currentContent);
  };

  const handleCancelEditingComment = () => {
    setEditingCommentId(null);
    setEditingCommentDraft('');
  };

  const handleUpdateComment = async (commentId: string) => {
    const trimmedDraft = editingCommentDraft.trim();
    if (!trimmedDraft) {
      setCommentErrorMessage('Comment cannot be empty.');
      return;
    }

    const previousComments = comments;
    setCommentErrorMessage(null);
    setComments((current) =>
      current.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              content: trimmedDraft,
            }
          : comment,
      ),
    );
    setDeletingCommentId(commentId);

    try {
      const updatedContent = await updateComment(commentId, trimmedDraft);
      setComments((current) =>
        current.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                content: updatedContent,
              }
            : comment,
        ),
      );
      setEditingCommentId(null);
      setEditingCommentDraft('');
      router.refresh();
    } catch (error) {
      setComments(previousComments);
      setCommentErrorMessage(
        error instanceof Error ? error.message : 'Comment could not be updated. Please try again.',
      );
    } finally {
      setDeletingCommentId(null);
    }
  };

  if (isRemoved) {
    return null;
  }

  return (
    <article
      id={`post-${post.id}`}
      className={`border-b border-zinc-100 transition-colors hover:bg-zinc-50/50 ${
        preferences.compactFeed ? 'p-4 py-4' : 'p-4 py-6'
      }`}
    >
      <div className="flex gap-4">
        <div className="flex shrink-0 flex-col items-center">
          <Link href={`/profile/${post.author.handle}`} className="rounded-full">
            <Avatar
              src={post.author.avatarUrl ?? undefined}
              alt={post.author.handle}
              fallback={post.author.displayName}
            />
          </Link>
          <div className="mt-2 hidden h-full min-h-[40px] w-[1px] flex-grow bg-zinc-200" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-hidden text-sm">
              <Link
                href={`/profile/${post.author.handle}`}
                className="truncate font-bold text-zinc-900 transition-colors hover:underline"
              >
                {post.author.displayName}
              </Link>
              <Link
                href={`/profile/${post.author.handle}`}
                className="truncate text-zinc-500 transition-colors hover:text-zinc-700 hover:underline"
              >
                @{post.author.handle}
              </Link>
              {isCurrentUsersPost && (
                <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  You
                </span>
              )}
              <span className="text-zinc-400">·</span>
              <RelativeTime dateString={post.createdAt} className="shrink-0 text-zinc-500" />
            </div>

            {isCurrentUsersPost ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((current) => !current)}
                  className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
                >
                  <MoreHorizontalIcon className="h-4 w-4" />
                </button>

                {isMenuOpen ? (
                  <div className="absolute right-0 top-11 z-10 min-w-[156px] rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg">
                    <button
                      type="button"
                      onClick={handleStartEditingPost}
                      className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
                    >
                      Edit post
                    </button>
                    <button
                      type="button"
                      disabled={isDeletingPost}
                      onClick={() => void handleDeletePost()}
                      className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
                    >
                      {isDeletingPost ? 'Deleting...' : 'Delete post'}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="relative flex items-center gap-2">
                <StartDmButton
                  targetUserId={post.author.id}
                  targetHandle={post.author.handle}
                  label="DM"
                  variant="ghost"
                  size="sm"
                  className="rounded-full px-3"
                />
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((current) => !current)}
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                >
                  <MoreHorizontalIcon className="h-4 w-4" />
                  <span>More</span>
                </button>

                {isMenuOpen ? (
                  <div className="absolute right-0 top-11 z-10 min-w-[208px] rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={handleToggleSave}
                      className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 disabled:opacity-50"
                    >
                      {isSaved ? 'Remove from saved' : 'Save post'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void copyPostLink()}
                      className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
                    >
                      Copy link
                    </button>
                    <button
                      type="button"
                      disabled={isProcessingMoreAction}
                      onClick={() => void handleHidePost()}
                      className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 disabled:opacity-50"
                    >
                      Hide post
                    </button>
                    <button
                      type="button"
                      disabled={isProcessingMoreAction}
                      onClick={() => void handleReportPost()}
                      className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 disabled:opacity-50"
                    >
                      Report post
                    </button>
                    <button
                      type="button"
                      disabled={isProcessingMoreAction}
                      onClick={() => void handleBlockAuthor()}
                      className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
                    >
                      Block @{post.author.handle}
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {isEditingPost ? (
            <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-3">
              <textarea
                value={editingPostDraft}
                onChange={(event) => setEditingPostDraft(event.target.value)}
                rows={4}
                className="w-full resize-none border-none bg-transparent text-sm leading-6 text-zinc-900 outline-none placeholder:text-zinc-400"
              />
              <div className="mt-3 flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-full px-4"
                  disabled={isSavingPost}
                  onClick={handleCancelEditingPost}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="rounded-full px-4"
                  disabled={isSavingPost}
                  onClick={() => void handleSavePost()}
                >
                  {isSavingPost ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          ) : postBody || duetHandle ? (
            <div className="mb-3 space-y-2">
              {duetHandle ? (
                <Link
                  href={`/profile/${duetHandle}`}
                  className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700 transition-colors hover:bg-emerald-100"
                >
                  with @{duetHandle}
                </Link>
              ) : null}
              {postBody ? (
                <p className="whitespace-pre-wrap leading-relaxed text-zinc-800">{postBody}</p>
              ) : null}
            </div>
          ) : null}

          {post.kind === 'stage_result' && post.stageResult && (
            <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-black px-3 py-1.5 text-xs font-bold uppercase leading-none tracking-wide text-white">
              <span className="text-[#a3ff00]">Score: {post.stageResult.score ?? 'Pending'}</span>
              <span className="opacity-50">|</span>
              <span>{post.stageResult.stageLabel}</span>
              <span className="opacity-50">|</span>
              <span className="text-zinc-300">{post.stageResult.memeLabel ?? 'Meme locked'}</span>
            </div>
          )}

          {post.media && (
            <div className="relative mb-4 flex aspect-video max-w-full overflow-hidden rounded-2xl border border-zinc-100 bg-black">
              {isVideo ? (
                <video
                  src={post.media.url}
                  poster={post.media.thumbnailUrl ?? undefined}
                  controls
                  autoPlay={preferences.autoplayVideos}
                  muted={preferences.autoplayVideos}
                  loop={preferences.autoplayVideos}
                  playsInline
                  className="h-full w-full object-contain"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={post.media.url}
                  alt="Post attachment"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          )}

          {(post.kind === 'stage_result' || post.kind === 'video') && isVideo && !isCurrentUsersPost ? (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Link
                href={`/play?reference=${post.id}`}
                className="inline-flex items-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
              >
                Try with this clip
              </Link>
              <span className="text-xs text-zinc-500">
                Open split-screen mode with @{post.author.handle}&apos;s uploaded run.
              </span>
            </div>
          ) : null}

          {postErrorMessage && (
            <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {postErrorMessage}
            </p>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-3 text-zinc-500">
            <button
              type="button"
              aria-pressed={isLiked}
              disabled={isPending}
              onClick={handleLike}
              className={`flex items-center gap-2 rounded-full px-3 py-2 transition-colors hover:bg-red-50 hover:text-red-500 ${
                isLiked ? 'text-red-500' : ''
              }`}
            >
              <HeartIcon className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">
                {likeCount > 0 ? `${likeCount} like${likeCount === 1 ? '' : 's'}` : 'Like'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsCommentsOpen((current) => !current)}
              className="flex items-center gap-2 rounded-full px-3 py-2 transition-colors hover:bg-zinc-100 hover:text-black"
            >
              <MessageCircleIcon className="h-5 w-5" />
              <span className="text-sm font-medium">
                {commentCount > 0
                  ? `${commentCount} comment${commentCount === 1 ? '' : 's'}`
                  : 'Comment'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => void handleShare()}
              className="flex items-center gap-2 rounded-full px-3 py-2 transition-colors hover:bg-zinc-100 hover:text-black"
            >
              <SendIcon className="h-5 w-5" />
              <span className="text-sm font-medium">{shareFeedback ?? 'Share'}</span>
            </button>
          </div>

          {isCommentsOpen && (
            <div className="mt-4 rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4">
              <div className="space-y-3">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar
                        src={comment.authorAvatarUrl ?? undefined}
                        alt={comment.authorHandle}
                        size="sm"
                        fallback={comment.authorDisplayName}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm">
                            <span className="font-semibold text-zinc-900">
                              {comment.authorDisplayName}
                            </span>{' '}
                            <span className="text-zinc-500">@{comment.authorHandle}</span>
                          </p>
                          {comment.isCurrentUser ? (
                            <div className="flex shrink-0 items-center gap-3">
                              <button
                                type="button"
                                disabled={Boolean(deletingCommentId)}
                                onClick={() =>
                                  handleStartEditingComment(comment.id, comment.content)
                                }
                                className="text-xs font-semibold text-zinc-500 transition-colors hover:text-zinc-700 disabled:opacity-50"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                disabled={deletingCommentId === comment.id}
                                onClick={() => void handleDeleteComment(comment.id)}
                                className="text-xs font-semibold text-red-500 transition-colors hover:text-red-600 disabled:opacity-50"
                              >
                                {deletingCommentId === comment.id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          ) : null}
                        </div>
                        {editingCommentId === comment.id ? (
                          <div className="mt-2 rounded-2xl border border-zinc-200 bg-white p-3">
                            <textarea
                              value={editingCommentDraft}
                              onChange={(event) => setEditingCommentDraft(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' && !event.shiftKey) {
                                  event.preventDefault();
                                  void handleUpdateComment(comment.id);
                                }
                              }}
                              className="min-h-[72px] w-full resize-none border-none bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                            />
                            <div className="mt-3 flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="rounded-full px-4"
                                disabled={Boolean(deletingCommentId)}
                                onClick={handleCancelEditingComment}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                className="rounded-full px-4"
                                disabled={!editingCommentDraft.trim() || Boolean(deletingCommentId)}
                                onClick={() => void handleUpdateComment(comment.id)}
                              >
                                {deletingCommentId === comment.id ? 'Saving...' : 'Save'}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-1 text-sm text-zinc-700">{comment.content}</p>
                        )}
                        <RelativeTime
                          dateString={comment.createdAt}
                          className="mt-1 text-xs text-zinc-400"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">No comments yet. Start the thread.</p>
                )}
              </div>

              {commentErrorMessage && (
                <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {commentErrorMessage}
                </p>
              )}

              <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-3">
                <label
                  htmlFor={`comment-${post.id}`}
                  className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400"
                >
                  Your reply
                </label>
                <textarea
                  id={`comment-${post.id}`}
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void handleComment();
                    }
                  }}
                  placeholder={
                    canComment
                      ? 'Add context, celebrate the run, or leave feedback.'
                      : 'Sign in to join the thread.'
                  }
                  disabled={!canComment || isCommentSubmitting}
                  className="min-h-[88px] w-full resize-none border-none bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:text-zinc-400"
                />
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-zinc-100 pt-3">
                  <p className="text-xs text-zinc-500">
                    {canComment
                      ? 'Press Enter to reply, Shift+Enter for a new line.'
                      : 'Sign in with Google to reply in the thread.'}
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="rounded-full px-4"
                    disabled={!canComment || !commentDraft.trim() || isCommentSubmitting}
                    onClick={() => void handleComment()}
                  >
                    {isCommentSubmitting ? 'Posting...' : 'Reply'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function FeedEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
        Feed
      </div>
      <h2 className="text-xl font-bold tracking-tight text-zinc-900">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">{description}</p>
    </div>
  );
}

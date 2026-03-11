'use client';

import React, { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import type {
  ProfileTab,
  SocialIdentity,
  SocialPost,
  SocialProfile,
  SocialVideoHighlight,
} from '@/components/layout/socialUi';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileMenuLayer } from '@/components/profile/ProfileMenuLayer';
import { FeedEmptyState, FeedPost } from '@/components/feed/FeedPost';
import { RelativeTime } from '@/components/ui/RelativeTime';

interface ProfilePageClientProps {
  currentUser?: SocialIdentity | null;
  profileUser: SocialProfile;
  posts: SocialPost[];
  savedPosts?: SocialPost[];
  featuredPost?: SocialPost | null;
  recentPlayPost?: SocialPost | null;
  recentSessions?: SocialVideoHighlight[];
  initialMenuOpen?: boolean;
  initialTab?: ProfileTab;
}

export function ProfilePageClient({
  currentUser,
  profileUser,
  posts,
  savedPosts = [],
  featuredPost = null,
  recentPlayPost = null,
  recentSessions = [],
  initialMenuOpen = false,
  initialTab = 'posts',
}: ProfilePageClientProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(initialMenuOpen);
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileState, setProfileState] = useState(profileUser);

  const visiblePosts = useMemo(() => {
    if (activeTab === 'videos') {
      return posts.filter((post) => post.media?.kind === 'video');
    }

    if (activeTab === 'likes') {
      return profileState.relationship.isCurrentUser ? savedPosts : posts.filter((post) => post.viewerState.saved);
    }

    return posts;
  }, [activeTab, posts, profileState.relationship.isCurrentUser, savedPosts]);

  const emptyCopy: Record<ProfileTab, { title: string; description: string }> = {
    posts: {
      title: 'No posts yet',
      description: `${profileState.displayName} has not shared any motion meme updates yet.`,
    },
    videos: {
      title: 'No videos yet',
      description: `${profileState.displayName} has not posted any playable clips yet.`,
    },
    likes: {
      title: profileState.relationship.isCurrentUser ? 'Nothing saved yet' : 'Nothing saved here yet',
      description: profileState.relationship.isCurrentUser
        ? 'Save posts from the feed to build your private meme shelf here.'
        : `${profileState.displayName} has not surfaced saved posts here yet.`,
    },
  };

  const spotlightVideo = recentPlayPost?.media?.kind === 'video' ? recentPlayPost : null;

  return (
    <MainLayout currentUser={currentUser}>
      <div className="flex min-h-screen flex-col">
        <ProfileHeader
          user={profileState}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onEditProfile={() => setIsEditProfileOpen(true)}
          onMenuClick={() => setIsMenuOpen(true)}
        />

        {(spotlightVideo || featuredPost || recentSessions.length > 0) ? (
          <section className="border-b border-zinc-100 bg-zinc-50/70 px-4 py-5 md:px-6">
            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              {spotlightVideo ? (
                <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-black text-white shadow-sm">
                  <div className="aspect-video bg-black">
                    <video
                      src={spotlightVideo.media?.url}
                      poster={spotlightVideo.media?.thumbnailUrl ?? undefined}
                      controls
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="space-y-2 px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a3ff00]">
                      Recent Uploaded Run
                    </p>
                    <p className="text-2xl font-black tracking-tight">
                      {spotlightVideo.stageResult?.stageLabel ?? 'Play highlight'}
                    </p>
                    <p className="text-sm text-zinc-300">
                      {spotlightVideo.stageResult?.memeLabel ?? 'Latest successful play clip'}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-zinc-300">
                      <span className="rounded-full border border-white/10 px-3 py-1">
                        Score {spotlightVideo.stageResult?.score ?? 'Pending'}
                      </span>
                      <span className="rounded-full border border-white/10 px-3 py-1">
                        Uploaded moment
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* 최근 플레이 영상이 없을 때 표시되는 빈 상태 영역
                   업로드된 플레이 영상이 생기면 이 자리에 비디오 스포트라이트가 표시된다. */
                <div className="rounded-[28px] border border-dashed border-zinc-200 bg-white px-5 py-6">
                  <p className="text-sm font-semibold text-zinc-900">Recent video spotlight</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    Play a stage and upload your clip to feature it here.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {featuredPost ? (
                  <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
                      {profileState.featuredPostLabel ?? 'Featured'}
                    </p>
                    <p className="mt-2 text-xl font-bold text-zinc-900">
                      {featuredPost.body || featuredPost.stageResult?.memeLabel || 'Pinned highlight'}
                    </p>
                    {/* 대표 밈/대표 post는 featured_post_id 기준으로 우선 정하고,
                        없으면 최근 업로드 영상으로 대체한다. */}
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-500">
                      <span className="rounded-full bg-zinc-100 px-3 py-1">
                        {featuredPost.kind === 'stage_result' ? 'Play video' : 'Profile post'}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-3 py-1">
                        {featuredPost.counts.likes} likes
                      </span>
                      <span className="rounded-full bg-zinc-100 px-3 py-1">
                        {featuredPost.counts.comments} comments
                      </span>
                    </div>
                  </div>
                ) : null}

                {/* 최근 업로드된 플레이 영상 목록 (업로드 완료된 영상이 생기면 이 구역에서 먼저 강조) */}
                <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-zinc-900">Recent uploads</p>
                  <div className="mt-4 space-y-3">
                    {recentSessions.length > 0 ? (
                      recentSessions.slice(0, 3).map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-3"
                        >
                          <div className="h-16 w-20 overflow-hidden rounded-2xl bg-black">
                            {session.thumbnailUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={session.thumbnailUrl}
                                alt={session.stageLabel}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[11px] text-zinc-500">
                                Clip
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-zinc-900">{session.stageLabel}</p>
                            <p className="mt-1 text-sm text-zinc-500">Score {session.score ?? 'Pending'}</p>
                            {session.uploadedAt ? (
                              <RelativeTime dateString={session.uploadedAt} className="mt-1 block text-xs text-zinc-400" />
                            ) : null}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm leading-6 text-zinc-500">
                        No uploaded clips yet. Complete a stage to see it here.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <div className="flex flex-col w-full pb-32 md:pb-0">
          {visiblePosts.length > 0 ? (
            visiblePosts.map((post) => (
              <FeedPost key={post.id} post={post} currentUser={currentUser} />
            ))
          ) : (
            <FeedEmptyState
              title={emptyCopy[activeTab].title}
              description={emptyCopy[activeTab].description}
            />
          )}
        </div>

        <ProfileMenuLayer
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          profileName={profileState.displayName}
          onAccountClick={() => {
            setIsMenuOpen(false);
            setIsEditProfileOpen(true);
          }}
          onSavedMemesClick={() => {
            setActiveTab('likes');
            setIsMenuOpen(false);
          }}
        />

        {profileState.relationship.isCurrentUser ? (
          <EditProfileModal
            isOpen={isEditProfileOpen}
            onClose={() => setIsEditProfileOpen(false)}
            profile={profileState}
            onProfileUpdated={(updates) =>
              setProfileState((current) => ({
                ...current,
                handle: updates.handle,
                displayName: updates.displayName,
                bio: updates.bio,
              }))
            }
          />
        ) : null}
      </div>
    </MainLayout>
  );
}

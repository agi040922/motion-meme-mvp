import { notFound } from 'next/navigation';
import {
  adaptDomainPost,
  adaptDomainProfile,
  type SocialVideoHighlight,
  type ProfileTab,
} from '@/components/layout/socialUi';
import { ProfilePageClient } from '@/components/profile/ProfilePageClient';
import { getProfileByHandle, getViewerProfileSummary } from '@/features/meme/server';

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: { handle: string };
  searchParams?: { menu?: string; tab?: string };
}) {
  const viewerProfile = await getViewerProfileSummary();
  const profileData = await getProfileByHandle(params.handle);
  if (!profileData) {
    notFound();
  }

  const currentUser = viewerProfile ? adaptDomainProfile(viewerProfile) : null;
  const featuredPost = profileData.highlights.featuredPost
    ? adaptDomainPost(profileData.highlights.featuredPost)
    : null;
  const recentPlayPost = profileData.highlights.recentPlayPost
    ? adaptDomainPost(profileData.highlights.recentPlayPost)
    : null;
  const recentSessions: SocialVideoHighlight[] = profileData.highlights.recentUploadedSessions.map(
    (session) => ({
      id: session.id,
      stageLabel: session.stageNumber ? `Stage ${session.stageNumber}` : session.stageTitle ?? 'Play',
      score: session.score,
      videoUrl: session.videoPublicUrl,
      thumbnailUrl: session.thumbnailPublicUrl,
      uploadedAt: session.uploadedAt,
    }),
  );
  const profileUser = adaptDomainProfile(profileData.profile, {
    featuredMeme:
      profileData.highlights.recentPlayPost?.play?.stageTitle ??
      profileData.highlights.featuredPost?.play?.stageTitle ??
      null,
    featuredPostLabel: profileData.highlights.featuredPost
      ? profileData.highlights.featuredPost.postType === 'play_video'
        ? 'Featured run'
        : 'Featured post'
      : null,
  });
  const profilePosts = profileData.posts.map((post) => adaptDomainPost(post));
  const savedPosts = (profileData.savedPosts ?? []).map((post) => adaptDomainPost(post));
  const activeTab: ProfileTab =
    searchParams?.tab === 'videos' || searchParams?.tab === 'likes' ? searchParams.tab : 'posts';

  return (
    <ProfilePageClient
      currentUser={currentUser}
      profileUser={profileUser}
      posts={profilePosts}
      savedPosts={savedPosts}
      featuredPost={featuredPost}
      recentPlayPost={recentPlayPost}
      recentSessions={recentSessions}
      initialMenuOpen={searchParams?.menu === 'true'}
      initialTab={activeTab}
    />
  );
}

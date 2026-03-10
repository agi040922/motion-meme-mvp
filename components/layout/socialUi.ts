import type { Post as LegacyPost, User as LegacyUser } from "@/lib/mockData";
import type {
  FeedPost as DomainFeedPost,
  ProfileSummary as DomainProfileSummary,
} from "@/features/meme/types";

export type SocialSortMode = "for_you" | "following";
export type ProfileTab = "posts" | "videos" | "likes";

export interface SocialIdentity {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface SocialRelationshipState {
  isCurrentUser: boolean;
  isFollowing: boolean;
}

export interface SocialProfile extends SocialIdentity {
  bio?: string | null;
  featuredMeme?: string | null;
  featuredPostLabel?: string | null;
  stats: {
    followers: number;
    following: number;
    totalPlays: number;
    bestScore?: number | null;
  };
  relationship: SocialRelationshipState;
}

export interface SocialVideoHighlight {
  id: string;
  stageLabel: string;
  score?: number | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  uploadedAt?: string | null;
}

export interface SocialPost {
  id: string;
  author: SocialProfile;
  body: string;
  createdAt: string;
  kind: "video" | "image" | "text" | "stage_result";
  media?: {
    kind: "video" | "image";
    url: string;
    thumbnailUrl?: string | null;
  };
  stageResult?: {
    stageLabel: string;
    score?: number | null;
    memeLabel?: string | null;
  };
  counts: {
    likes: number;
    comments: number;
    shares: number;
  };
  viewerState: {
    liked: boolean;
    saved: boolean;
    currentUserId?: string | null;
  };
  commentsPreview?: Array<{
    id: string;
    authorUserId: string;
    authorHandle: string;
    authorDisplayName: string;
    authorAvatarUrl?: string | null;
    content: string;
    createdAt: string;
    isCurrentUser: boolean;
    media?: {
      storagePath: string;
      mimeType: string;
      publicUrl: string;
      width: number | null;
      height: number | null;
    } | null;
  }>;
}

export interface SearchTrend {
  id: string;
  context: string;
  label: string;
  postCountLabel: string;
}

export interface SearchStateSummary {
  query: string;
  resultLabel: string;
}

export function adaptLegacyUser(
  user: LegacyUser,
  options?: {
    currentUserId?: string;
    isFollowing?: boolean;
  },
): SocialProfile {
  const isCurrentUser = user.id === options?.currentUserId;

  return {
    id: user.id,
    handle: user.handle,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl ?? null,
    bio: user.bio ?? null,
    featuredMeme: user.featuredMeme ?? null,
    stats: {
      followers: user.followers,
      following: user.following,
      totalPlays: user.totalPlays,
      bestScore: user.bestScore ?? null,
    },
    relationship: {
      isCurrentUser,
      isFollowing: isCurrentUser ? false : options?.isFollowing ?? user.isFollowing ?? false,
    },
  };
}

export function adaptLegacyPost(post: LegacyPost, currentUserId?: string): SocialPost {
  return {
    id: post.id,
    author: adaptLegacyUser(post.author, {
      currentUserId,
      isFollowing: post.author.isFollowing,
    }),
    body: post.content,
    createdAt: post.createdAt,
    kind: post.type,
    media: post.mediaUrl
      ? {
          kind: post.type === "video" || post.type === "stage_result" ? "video" : "image",
          url: post.mediaUrl,
          thumbnailUrl: post.thumbnailUrl ?? null,
        }
      : undefined,
    stageResult:
      post.type === "stage_result"
        ? {
            stageLabel: post.stageId ?? "Stage",
            score: post.score ?? null,
            memeLabel: post.memeUsed ?? null,
          }
        : undefined,
    counts: {
      likes: post.likes,
      comments: post.comments,
      shares: 0,
    },
    viewerState: {
      liked: post.isLiked ?? false,
      saved: false,
    },
  };
}

export function adaptDomainProfile(
  profile: DomainProfileSummary,
  options?: {
    featuredMeme?: string | null;
    featuredPostLabel?: string | null;
  },
): SocialProfile {
  return {
    id: profile.userId,
    handle: profile.handle,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl ?? null,
    bio: profile.bio ?? null,
    featuredMeme: options?.featuredMeme ?? null,
    featuredPostLabel: options?.featuredPostLabel ?? null,
    stats: {
      followers: profile.followerCount,
      following: profile.followingCount,
      totalPlays: profile.totalPlayCount,
      bestScore: profile.bestScore,
    },
    relationship: {
      isCurrentUser: profile.isCurrentUser,
      isFollowing: profile.isFollowing,
    },
  };
}

export function adaptDomainPost(post: DomainFeedPost): SocialPost {
  const kind: SocialPost["kind"] =
    post.play && post.postType === "play_video"
      ? "stage_result"
      : post.postType === "play_video"
        ? "video"
        : post.postType;

  return {
    id: post.id,
    author: adaptDomainProfile(post.author),
    body: post.caption,
    createdAt: post.publishedAt,
    kind,
    media: post.media
      ? {
          kind: post.media.mediaType,
          url: post.media.publicUrl,
          thumbnailUrl: post.media.posterUrl ?? null,
        }
      : undefined,
    stageResult: post.play
      ? {
          stageLabel: post.play.stageNumber
            ? `Stage ${post.play.stageNumber}`
            : "Play",
          score: post.play.score ?? null,
          memeLabel: post.play.stageTitle ?? null,
        }
      : undefined,
    counts: {
      likes: post.likeCount,
      comments: post.commentCount,
      shares: 0,
    },
    viewerState: {
      liked: post.viewerHasLiked,
      saved: post.viewerHasSaved,
      currentUserId: post.viewerUserId,
    },
    commentsPreview: post.comments.map((comment) => ({
      id: comment.id,
      authorUserId: comment.authorUserId,
      authorHandle: comment.authorHandle,
      authorDisplayName: comment.authorDisplayName,
      authorAvatarUrl: comment.authorAvatarUrl,
      content: comment.content,
      createdAt: comment.createdAt,
      isCurrentUser: comment.isCurrentUser,
      media: comment.media ?? null,
    })),
  };
}

export function matchesProfileQuery(profile: SocialProfile, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [profile.displayName, profile.handle, profile.bio ?? "", profile.featuredMeme ?? ""]
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
}

export function matchesTrendQuery(trend: SearchTrend, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [trend.context, trend.label].join(" ").toLowerCase().includes(normalizedQuery);
}

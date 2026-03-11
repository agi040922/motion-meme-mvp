import { cache } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getStoragePublicUrl } from "@/features/meme/storage";
import type {
  ConversationMessage,
  ConversationRoomData,
  ConversationSummary,
  FeedPost,
  FeedSort,
  PlayDashboardData,
  PlayHistoryData,
  PlayReferenceClip,
  PlayHistorySession,
  PlaySessionRecord,
  PlaySessionWithStage,
  PostComment,
  ProfileHighlight,
  ProfileRecord,
  ProfileStatsRecord,
  ProfileSummary,
  SearchResult,
  SearchTrend,
  StageHistorySummary,
  StageProgressRecord,
  StageRecord,
} from "@/features/meme/types";

type ProfileLookupRow = {
  user_id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
};

type ProfileQueryRow = ProfileLookupRow & {
  bio: string;
  featured_post_id: string | null;
  created_at: string;
  updated_at: string;
};

type ProfileStatsRow = {
  user_id: string;
  post_count: number;
  follower_count: number;
  following_count: number;
  best_score: number;
  total_play_count: number;
  uploaded_play_count: number;
  last_played_at: string | null;
};

const mapProfileStatsRow = (stats: ProfileStatsRow | null): ProfileStatsRecord | null =>
  stats
    ? {
        userId: stats.user_id,
        postCount: Number(stats.post_count),
        followerCount: Number(stats.follower_count),
        followingCount: Number(stats.following_count),
        bestScore: Number(stats.best_score),
        totalPlayCount: Number(stats.total_play_count),
        uploadedPlayCount: Number(stats.uploaded_play_count),
        lastPlayedAt: stats.last_played_at,
      }
    : null;

const loadPublicProfileStats = async (userIds: string[]) => {
  const supabase = getMemeServerClient();
  if (userIds.length === 0) {
    return new Map<string, ProfileStatsRecord>();
  }

  const { data, error } = await supabase.rpc("list_public_profile_stats", {
    p_user_ids: userIds,
  });

  if (error) {
    throw error;
  }

  return new Map<string, ProfileStatsRecord>(
    ((data ?? []) as ProfileStatsRow[])
      .map((row) => mapProfileStatsRow(row))
      .filter((row): row is ProfileStatsRecord => Boolean(row))
      .map((row) => [row.userId, row]),
  );
};

type StageRow = {
  id: string;
  stage_number: number;
  slug: string;
  title: string;
  description: string;
  instruction_text: string;
  time_limit_seconds: number;
  min_score_to_clear: number;
  success_meme_asset_id: string | null;
  success_meme_asset: {
    id: string;
    title: string;
    asset_type: string;
    storage_path: string | null;
    overlay_preset: Record<string, unknown> | null;
  } | null;
  rule_config: StageRecord["ruleConfig"];
  is_active: boolean;
};

type StageProgressRow = {
  id: string;
  user_id: string;
  stage_id: string;
  best_score: number;
  attempt_count: number;
  unlocked_at: string;
  cleared_at: string | null;
  last_attempted_at: string | null;
};

type PlaySessionRow = {
  id: string;
  user_id: string;
  stage_id: string;
  score: number;
  result_tier: PlaySessionRecord["resultTier"];
  success: boolean;
  attempt_started_at: string;
  attempt_finished_at: string;
  duration_seconds: number;
  similarity_breakdown: Record<string, number> | null;
  uploaded_video_path: string | null;
  uploaded_thumbnail_path: string | null;
  uploaded_at: string | null;
  created_post_id: string | null;
  created_at: string;
};

type PlayReferenceRow = {
  post_id: string;
  author_user_id: string;
  author_handle: string;
  author_display_name: string;
  author_avatar_url: string | null;
  caption: string;
  video_path: string | null;
  poster_path: string | null;
  stage_id: string | null;
  stage_number: number | null;
  stage_title: string | null;
};

const getMemeServerClient = () => createServerSupabaseClient().schema("meme");

const toProfileSummary = (
  profile: ProfileRecord,
  stats: ProfileStatsRecord | null,
  viewerId: string | null,
  isFollowing = false,
): ProfileSummary => ({
  userId: profile.userId,
  handle: profile.handle,
  displayName: profile.displayName,
  bio: profile.bio,
  avatarUrl: profile.avatarUrl,
  featuredPostId: profile.featuredPostId,
  followerCount: stats?.followerCount ?? 0,
  followingCount: stats?.followingCount ?? 0,
  bestScore: stats?.bestScore ?? 0,
  totalPlayCount: stats?.totalPlayCount ?? 0,
  uploadedPlayCount: stats?.uploadedPlayCount ?? 0,
  lastPlayedAt: stats?.lastPlayedAt ?? null,
  isCurrentUser: viewerId === profile.userId,
  isFollowing,
});

type FeedRow = {
  id: string;
  post_type: "text" | "image" | "play_video";
  caption: string;
  like_count: number;
  comment_count: number;
  published_at: string;
  author_user_id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  primary_media_path: string | null;
  primary_media_type: "image" | "video" | null;
  primary_media_poster_path: string | null;
  play_score: number | null;
  stage_number: number | null;
  stage_title: string | null;
};

type CommentRow = {
  id: string;
  post_id: string;
  author_user_id: string;
  content: string;
  created_at: string;
};

type CommentMediaRow = {
  comment_id: string;
  storage_path: string;
  mime_type: string;
  width: number | null;
  height: number | null;
};

const getPopularFeedScore = (row: Pick<FeedRow, "like_count" | "comment_count" | "published_at">) => {
  const ageHours = Math.max(
    1,
    (Date.now() - new Date(row.published_at).getTime()) / (1000 * 60 * 60),
  );

  return (row.like_count * 2) + (row.comment_count * 4) + (72 / ageHours);
};

type BookmarkRow = {
  post_id: string;
};

type HiddenPostRow = {
  post_id: string;
};

type UserBlockRow = {
  blocker_user_id: string;
  blocked_user_id: string;
};

type ConversationRow = {
  id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
};

type ConversationMemberRow = {
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string | null;
  last_read_message_id: string | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
  deleted_at: string | null;
};

const mapFeedPost = async (
  row: FeedRow,
  viewerId: string | null,
  followingUserIds: Set<string>,
  viewerLikedIds: Set<string>,
  viewerSavedIds: Set<string>,
  comments: PostComment[],
): Promise<FeedPost> => {
  const now = Date.now();
  const ageHours = Math.max(
    1,
    (now - new Date(row.published_at).getTime()) / (1000 * 60 * 60),
  );
  const popularityScore =
    row.like_count * 3 +
    row.comment_count * 4 +
    (row.post_type === "play_video" ? 2 : 0) +
    Math.max(0, 72 - ageHours) / 12;

  const author = toProfileSummary(
    {
      userId: row.author_user_id,
      handle: row.handle,
      displayName: row.display_name,
      bio: "",
      avatarUrl: row.avatar_url,
      featuredPostId: null,
      createdAt: row.published_at,
      updatedAt: row.published_at,
    },
    null,
    viewerId,
    followingUserIds.has(row.author_user_id),
  );

  const publicUrl = await getStoragePublicUrl(
    row.primary_media_path,
    row.primary_media_type === "image" ? "post-media" : "post-media",
  );
  const posterUrl = await getStoragePublicUrl(row.primary_media_poster_path, "post-media");

  return {
    id: row.id,
    postType: row.post_type,
    caption: row.caption,
    likeCount: row.like_count,
    commentCount: row.comment_count,
    publishedAt: row.published_at,
    viewerUserId: viewerId,
    popularityScore,
    author,
    media: row.primary_media_type && row.primary_media_path
      ? {
          id: row.id,
          postId: row.id,
          mediaType: row.primary_media_type,
          storagePath: row.primary_media_path,
          mimeType: row.primary_media_type === "video" ? "video/webm" : "image/jpeg",
          width: null,
          height: null,
          durationSeconds: null,
          posterPath: row.primary_media_poster_path,
          publicUrl: publicUrl ?? row.primary_media_path,
          posterUrl,
        }
      : null,
    play: row.stage_number
      ? {
          score: row.play_score,
          stageNumber: row.stage_number,
          stageTitle: row.stage_title,
        }
      : null,
    viewerHasLiked: viewerLikedIds.has(row.id),
    viewerHasSaved: viewerSavedIds.has(row.id),
    comments,
  };
};

const mapPlaySessionWithStage = async (
  session: PlayHistorySession,
): Promise<PlaySessionWithStage> => ({
  id: session.id,
  userId: session.userId,
  stageId: session.stageId,
  score: session.score,
  resultTier: session.resultTier,
  success: session.success,
  attemptStartedAt: session.attemptStartedAt,
  attemptFinishedAt: session.attemptFinishedAt,
  durationSeconds: session.durationSeconds,
  similarityBreakdown: session.similarityBreakdown,
  uploadedVideoPath: session.uploadedVideoPath,
  uploadedThumbnailPath: session.uploadedThumbnailPath,
  uploadedAt: session.uploadedAt,
  createdPostId: session.createdPostId,
  createdAt: session.createdAt,
  stageNumber: session.stageNumber,
  stageTitle: session.stageTitle,
  videoPublicUrl: session.videoUrl,
  thumbnailPublicUrl: session.thumbnailUrl,
});

const emptyRelationshipState = {
  likedPostIds: new Set<string>(),
  savedPostIds: new Set<string>(),
  followingUserIds: new Set<string>(),
  hiddenPostIds: new Set<string>(),
  blockedUserIds: new Set<string>(),
};

const getViewerRelationshipState = async (
  viewerId: string | null,
  postIds: string[],
  authorIds: string[],
) => {
  const supabase = getMemeServerClient();

  if (!viewerId) {
    return emptyRelationshipState;
  }

  const [likesResult, savesResult, followsResult, hiddenPostsResult, blocksResult] =
    await Promise.all([
      postIds.length > 0
        ? supabase
            .from("post_likes")
            .select("post_id")
            .eq("user_id", viewerId)
            .in("post_id", postIds)
        : Promise.resolve({ data: [] as BookmarkRow[], error: null }),
      postIds.length > 0
        ? supabase
            .from("post_bookmarks")
            .select("post_id")
            .eq("user_id", viewerId)
            .in("post_id", postIds)
        : Promise.resolve({ data: [] as BookmarkRow[], error: null }),
      authorIds.length > 0
        ? supabase
            .from("follows")
            .select("following_user_id")
            .eq("follower_user_id", viewerId)
            .in("following_user_id", authorIds)
        : Promise.resolve({ data: [] as { following_user_id: string }[], error: null }),
      postIds.length > 0
        ? supabase
            .from("hidden_posts")
            .select("post_id")
            .eq("user_id", viewerId)
            .in("post_id", postIds)
        : Promise.resolve({ data: [] as HiddenPostRow[], error: null }),
      authorIds.length > 0
        ? supabase
            .from("user_blocks")
            .select("blocker_user_id, blocked_user_id")
            .or(
              [
                `and(blocker_user_id.eq.${viewerId},blocked_user_id.in.(${authorIds.join(",")}))`,
                `and(blocked_user_id.eq.${viewerId},blocker_user_id.in.(${authorIds.join(",")}))`,
              ].join(","),
            )
        : Promise.resolve({ data: [] as UserBlockRow[], error: null }),
    ]);

  if (likesResult.error) throw likesResult.error;
  if (savesResult.error) throw savesResult.error;
  if (followsResult.error) throw followsResult.error;
  if (hiddenPostsResult.error) throw hiddenPostsResult.error;
  if (blocksResult.error) throw blocksResult.error;

  return {
    likedPostIds: new Set(((likesResult.data ?? []) as BookmarkRow[]).map((row) => row.post_id)),
    savedPostIds: new Set(((savesResult.data ?? []) as BookmarkRow[]).map((row) => row.post_id)),
    followingUserIds: new Set(
      ((followsResult.data ?? []) as { following_user_id: string }[]).map(
        (row) => row.following_user_id,
      ),
    ),
    hiddenPostIds: new Set(
      ((hiddenPostsResult.data ?? []) as HiddenPostRow[]).map((row) => row.post_id),
    ),
    blockedUserIds: new Set(
      ((blocksResult.data ?? []) as UserBlockRow[]).flatMap((row) => [
        row.blocker_user_id === viewerId ? row.blocked_user_id : null,
        row.blocked_user_id === viewerId ? row.blocker_user_id : null,
      ]).filter((value): value is string => Boolean(value)),
    ),
  };
};

const loadCommentsByPostId = async (
  postIds: string[],
  viewerId: string | null,
  blockedUserIds: Set<string>,
) => {
  const supabase = getMemeServerClient();

  if (postIds.length === 0) {
    return new Map<string, PostComment[]>();
  }

  const commentsResult = await supabase
    .from("post_comments")
    .select("id, post_id, author_user_id, content, created_at")
    .in("post_id", postIds)
    .order("created_at", { ascending: true });

  if (commentsResult.error) {
    throw commentsResult.error;
  }

  const visibleComments = ((commentsResult.data ?? []) as CommentRow[]).filter(
    (comment) => !blockedUserIds.has(comment.author_user_id),
  );
  const commentAuthorIds = Array.from(
    new Set(visibleComments.map((comment) => comment.author_user_id)),
  );
  const commentProfilesResult =
    commentAuthorIds.length > 0
      ? await supabase
          .from("profiles")
          .select("user_id, handle, display_name, avatar_url")
          .in("user_id", commentAuthorIds)
      : { data: [] as ProfileLookupRow[], error: null };

  if (commentProfilesResult.error) {
    throw commentProfilesResult.error;
  }

  const commentIds = visibleComments.map((comment) => comment.id);
  const commentMediaResult =
    commentIds.length > 0
      ? await supabase
          .from("comment_media")
          .select("comment_id, storage_path, mime_type, width, height")
          .in("comment_id", commentIds)
          .order("sort_order", { ascending: true })
      : { data: [] as CommentMediaRow[], error: null };

  if (commentMediaResult.error) {
    throw commentMediaResult.error;
  }

  const commentProfilesByUserId = new Map(
    ((commentProfilesResult.data ?? []) as ProfileLookupRow[]).map((profile) => [
      profile.user_id,
      profile,
    ]),
  );
  const commentMediaByCommentId = new Map(
    ((commentMediaResult.data ?? []) as CommentMediaRow[]).map((media) => [
      media.comment_id,
      media,
    ]),
  );
  const commentsByPostId = new Map<string, PostComment[]>();

  for (const comment of visibleComments) {
    const authorProfile = commentProfilesByUserId.get(comment.author_user_id);
    const commentMedia = commentMediaByCommentId.get(comment.id);
    const mapped: PostComment = {
      id: comment.id,
      postId: comment.post_id,
      authorUserId: comment.author_user_id,
      authorHandle: authorProfile?.handle ?? "player",
      authorDisplayName: authorProfile?.display_name ?? "Player",
      authorAvatarUrl: authorProfile?.avatar_url ?? null,
      content: comment.content,
      createdAt: comment.created_at,
      isCurrentUser: viewerId === comment.author_user_id,
      media: commentMedia
        ? {
            storagePath: commentMedia.storage_path,
            mimeType: commentMedia.mime_type,
            publicUrl:
              (await getStoragePublicUrl(commentMedia.storage_path, "post-media")) ??
              commentMedia.storage_path,
            width: commentMedia.width,
            height: commentMedia.height,
          }
        : null,
    };

    commentsByPostId.set(comment.post_id, [
      ...(commentsByPostId.get(comment.post_id) ?? []),
      mapped,
    ]);
  }

  return commentsByPostId;
};

const mapFeedRowsForViewer = async (
  rows: FeedRow[],
  viewerId: string | null,
  relationshipState: Awaited<ReturnType<typeof getViewerRelationshipState>>,
) => {
  const commentsByPostId = await loadCommentsByPostId(
    rows.map((row) => row.id),
    viewerId,
    relationshipState.blockedUserIds,
  );

  return Promise.all(
    rows.map((row) =>
      mapFeedPost(
        row,
        viewerId,
        relationshipState.followingUserIds,
        relationshipState.likedPostIds,
        relationshipState.savedPostIds,
        commentsByPostId.get(row.id) ?? [],
      ),
    ),
  );
};

export const listFeedPosts = async (sort: FeedSort = "latest") => {
  const supabase = getMemeServerClient();
  const viewer = await getCurrentUser();

  let query = supabase.from("feed_posts").select("*");
  if (sort === "popular") {
    query = query
      .limit(60)
      .order("published_at", { ascending: false });
  } else {
    query = query.order("published_at", { ascending: false }).limit(30);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  const fetchedRows = ((sort === "popular"
    ? [...((data ?? []) as FeedRow[])].sort(
        (left, right) => getPopularFeedScore(right) - getPopularFeedScore(left),
      ).slice(0, 30)
    : ((data ?? []) as FeedRow[])) as FeedRow[]);
  const relationshipState = await getViewerRelationshipState(
    viewer?.id ?? null,
    fetchedRows.map((row) => row.id),
    fetchedRows.map((row) => row.author_user_id),
  );
  const rows = fetchedRows.filter(
    (row) =>
      !relationshipState.hiddenPostIds.has(row.id) &&
      !relationshipState.blockedUserIds.has(row.author_user_id),
  );

  return mapFeedRowsForViewer(rows, viewer?.id ?? null, relationshipState);
};

export const getProfileByHandle = async (handle: string) => {
  const supabase = getMemeServerClient();
  const viewer = await getCurrentUser();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("handle", handle)
    .single();

  if (profileError) {
    return null;
  }

  const typedProfile = profile as ProfileQueryRow;

  if (viewer?.id) {
    const { data: blockRows, error: blockError } = await supabase
      .from("user_blocks")
      .select("blocker_user_id, blocked_user_id")
      .or(
        `and(blocker_user_id.eq.${viewer.id},blocked_user_id.eq.${typedProfile.user_id}),and(blocked_user_id.eq.${viewer.id},blocker_user_id.eq.${typedProfile.user_id})`,
      );

    if (blockError) {
      throw blockError;
    }

    if ((blockRows ?? []).length > 0) {
      return null;
    }
  }

  const [statsMap, followResult, posts, recentSessionsResult] = await Promise.all([
    loadPublicProfileStats([typedProfile.user_id]),
    viewer
      ? supabase
          .from("follows")
          .select("following_user_id")
          .eq("follower_user_id", viewer.id)
          .eq("following_user_id", typedProfile.user_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("feed_posts")
      .select("*")
      .eq("author_user_id", typedProfile.user_id)
      .order("published_at", { ascending: false }),
    supabase
      .from("play_sessions")
      .select(`
        *,
        stages:stage_id (
          stage_number,
          title
        )
      `)
      .eq("user_id", typedProfile.user_id)
      .not("uploaded_at", "is", null)
      .order("uploaded_at", { ascending: false })
      .limit(4),
  ]);

  if (posts.error) {
    throw posts.error;
  }
  if (recentSessionsResult.error) {
    throw recentSessionsResult.error;
  }

  const summary = toProfileSummary(
    {
      userId: typedProfile.user_id,
      handle: typedProfile.handle,
      displayName: typedProfile.display_name,
      bio: typedProfile.bio,
      avatarUrl: typedProfile.avatar_url,
      featuredPostId: typedProfile.featured_post_id,
      createdAt: typedProfile.created_at,
      updatedAt: typedProfile.updated_at,
    },
    statsMap.get(typedProfile.user_id) ?? null,
    viewer?.id ?? null,
    Boolean(followResult.data),
  );

  const relationshipState = await getViewerRelationshipState(
    viewer?.id ?? null,
    ((posts.data ?? []) as FeedRow[]).map((post) => post.id),
    [typedProfile.user_id],
  );
  const visibleProfilePosts = ((posts.data ?? []) as FeedRow[]).filter(
    (post) =>
      !relationshipState.hiddenPostIds.has(post.id) &&
      !relationshipState.blockedUserIds.has(post.author_user_id),
  );

  const mappedPosts = await mapFeedRowsForViewer(
    visibleProfilePosts,
    viewer?.id ?? null,
    relationshipState,
  );

  type ProfilePlayHistoryRow = PlaySessionRow & {
    stages: {
      stage_number: number;
      title: string;
    } | null;
  };

  const recentUploadedSessions = await Promise.all(
    ((recentSessionsResult.data ?? []) as ProfilePlayHistoryRow[]).map(
      async (session): Promise<PlaySessionWithStage> => ({
        id: session.id,
        userId: session.user_id,
        stageId: session.stage_id,
        score: session.score,
        resultTier: session.result_tier,
        success: session.success,
        attemptStartedAt: session.attempt_started_at,
        attemptFinishedAt: session.attempt_finished_at,
        durationSeconds: session.duration_seconds,
        similarityBreakdown: session.similarity_breakdown ?? {},
        uploadedVideoPath: session.uploaded_video_path,
        uploadedThumbnailPath: session.uploaded_thumbnail_path,
        uploadedAt: session.uploaded_at,
        createdPostId: session.created_post_id,
        createdAt: session.created_at,
        stageNumber: session.stages?.stage_number ?? null,
        stageTitle: session.stages?.title ?? null,
        videoPublicUrl: await getStoragePublicUrl(session.uploaded_video_path, "post-media"),
        thumbnailPublicUrl: await getStoragePublicUrl(
          session.uploaded_thumbnail_path,
          "post-media",
        ),
      }),
    ),
  );

  const highlights: ProfileHighlight = {
    featuredPost:
      mappedPosts.find((post) => post.id === summary.featuredPostId) ??
      mappedPosts.find((post) => post.play && post.media?.mediaType === "video") ??
      mappedPosts[0] ??
      null,
    recentPlayPost:
      mappedPosts.find((post) => post.play && post.media?.mediaType === "video") ?? null,
    recentUploadedSessions,
  };

  let savedPosts: FeedPost[] = [];
  if (viewer?.id === typedProfile.user_id) {
    const savedPostIdsResult = await supabase
      .from("post_bookmarks")
      .select("post_id")
      .eq("user_id", viewer.id)
      .order("created_at", { ascending: false })
      .limit(40);

    if (savedPostIdsResult.error) {
      throw savedPostIdsResult.error;
    }

    const savedPostIds = ((savedPostIdsResult.data ?? []) as BookmarkRow[]).map((row) => row.post_id);
    if (savedPostIds.length > 0) {
      const savedRowsResult = await supabase
        .from("feed_posts")
        .select("*")
        .in("id", savedPostIds)
        .order("published_at", { ascending: false });

      if (savedRowsResult.error) {
        throw savedRowsResult.error;
      }

      const savedRows = ((savedRowsResult.data ?? []) as FeedRow[]).filter(
        (row) => !relationshipState.blockedUserIds.has(row.author_user_id),
      );
      const savedRelationshipState = await getViewerRelationshipState(
        viewer.id,
        savedRows.map((row) => row.id),
        savedRows.map((row) => row.author_user_id),
      );

      savedPosts = await mapFeedRowsForViewer(savedRows, viewer.id, savedRelationshipState);
    }
  }

  return {
    profile: summary,
    posts: mappedPosts,
    highlights,
    savedPosts,
  };
};

export const searchProfiles = cache(async (query = "") => {
  const supabase = getMemeServerClient();
  const viewer = await getCurrentUser();
  let profilesQuery = supabase
    .from("profiles")
    .select("user_id, handle, display_name, bio, avatar_url, featured_post_id, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(24);

  if (query.trim()) {
    profilesQuery = profilesQuery.or(
      `handle.ilike.%${query.trim()}%,display_name.ilike.%${query.trim()}%`,
    );
  }

  const { data, error } = await profilesQuery;
  if (error) {
    throw error;
  }

  const profileRows = (data ?? []) as {
    user_id: string;
    handle: string;
    display_name: string;
    bio: string;
    avatar_url: string | null;
    featured_post_id: string | null;
    created_at: string;
    updated_at: string;
  }[];
  const blockedIds =
    viewer && profileRows.length > 0
      ? new Set(
          (
            (
              await supabase
                .from("user_blocks")
                .select("blocker_user_id, blocked_user_id")
                .or(
                  [
                    `and(blocker_user_id.eq.${viewer.id},blocked_user_id.in.(${profileRows.map((row) => row.user_id).join(",")}))`,
                    `and(blocked_user_id.eq.${viewer.id},blocker_user_id.in.(${profileRows.map((row) => row.user_id).join(",")}))`,
                  ].join(","),
                )
            ).data ?? []
          ).flatMap((row: UserBlockRow) => [
            row.blocker_user_id === viewer.id ? row.blocked_user_id : null,
            row.blocked_user_id === viewer.id ? row.blocker_user_id : null,
          ]).filter((value): value is string => Boolean(value)),
        )
      : new Set<string>();

  const userIds = profileRows
    .map((row) => row.user_id)
    .filter((userId) => !blockedIds.has(userId));

  const [statsMap, followsResult, postsResult] = await Promise.all([
    loadPublicProfileStats(userIds),
    viewer && userIds.length > 0
      ? supabase
          .from("follows")
          .select("following_user_id")
          .eq("follower_user_id", viewer.id)
          .in("following_user_id", userIds)
      : Promise.resolve({ data: [] as { following_user_id: string }[], error: null }),
    userIds.length > 0
      ? supabase
          .from("posts")
          .select("author_user_id")
          .in("author_user_id", userIds)
          .is("deleted_at", null)
      : Promise.resolve({ data: [] as { author_user_id: string }[], error: null }),
  ]);

  if (followsResult.error) {
    throw followsResult.error;
  }

  if (postsResult.error) {
    throw postsResult.error;
  }

  const followingIds = new Set(
    ((followsResult.data ?? []) as { following_user_id: string }[]).map(
      (item) => item.following_user_id,
    ),
  );
  const postsCountMap = new Map<string, number>();
  for (const post of (postsResult.data ?? []) as { author_user_id: string }[]) {
    postsCountMap.set(
      post.author_user_id,
      (postsCountMap.get(post.author_user_id) ?? 0) + 1,
    );
  }

  return profileRows
    .filter((profileRow) => !blockedIds.has(profileRow.user_id))
    .map((profileRow) => ({
      ...toProfileSummary(
        {
          userId: profileRow.user_id,
          handle: profileRow.handle,
          displayName: profileRow.display_name,
          bio: profileRow.bio,
          avatarUrl: profileRow.avatar_url,
          featuredPostId: profileRow.featured_post_id,
          createdAt: profileRow.created_at,
          updatedAt: profileRow.updated_at,
        },
        statsMap.get(profileRow.user_id) ?? null,
        viewer?.id ?? null,
        followingIds.has(profileRow.user_id),
      ),
      recentPostCount: postsCountMap.get(profileRow.user_id) ?? 0,
    }))
    .sort((left, right) => right.followerCount - left.followerCount) as SearchResult[];
});

export const listTrendingTopics = cache(async (): Promise<SearchTrend[]> => {
  const supabase = getMemeServerClient();
  const { data, error } = await supabase
    .from("feed_posts")
    .select("id, caption, like_count, comment_count, stage_title")
    .limit(80)
    .order("published_at", { ascending: false });

  if (error) {
    throw error;
  }

  const trendScores = new Map<
    string,
    {
      label: string;
      score: number;
      source: string;
      count: number;
    }
  >();

  const pushTrend = (label: string, source: string, score: number) => {
    const normalized = label.trim();
    if (!normalized) {
      return;
    }

    const key = normalized.toLowerCase();
    const existing = trendScores.get(key);
    if (existing) {
      existing.score += score;
      existing.count += 1;
      return;
    }

    trendScores.set(key, {
      label: normalized,
      score,
      source,
      count: 1,
    });
  };

  for (const row of (data ?? []) as Array<{
    caption: string;
    like_count: number;
    comment_count: number;
    stage_title: string | null;
  }>) {
    const score = row.like_count * 2 + row.comment_count * 3 + 1;

    if (row.stage_title) {
      pushTrend(row.stage_title, "Stage momentum", score);
    }

    const hashtags = row.caption.match(/#[A-Za-z0-9_-]+/g) ?? [];
    hashtags.slice(0, 3).forEach((tag) => pushTrend(tag, "Trending in Motion", score));
  }

  return Array.from(trendScores.values())
    .sort((left, right) => right.score - left.score)
    .slice(0, 6)
    .map((trend, index) => ({
      id: `trend-${index + 1}-${trend.label.toLowerCase().replace(/\s+/g, '-')}`,
      context: trend.source,
      label: trend.label.startsWith("#") ? trend.label : trend.label,
      postCountLabel: `${trend.count} signal${trend.count === 1 ? "" : "s"}`,
    }));
});

export const getPlayDashboardData = cache(async (userId: string): Promise<PlayDashboardData> => {
  const supabase = getMemeServerClient();

  const [profileResult, statsResult, stagesResult, progressResult, sessionsResult, followsResult] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).single(),
      supabase.from("profile_stats").select("*").eq("user_id", userId).single(),
      supabase
        .from("stages")
        .select(`
          *,
          success_meme_asset:success_meme_asset_id (
            id,
            title,
            asset_type,
            storage_path,
            overlay_preset
          )
        `)
        .order("stage_number", { ascending: true }),
      supabase.from("stage_progress").select("*").eq("user_id", userId),
      supabase
        .from("play_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("attempt_finished_at", { ascending: false })
        .limit(8),
      supabase
        .from("follows")
        .select("following_user_id")
        .eq("follower_user_id", userId),
    ]);

  if (profileResult.error) {
    throw profileResult.error;
  }
  if (statsResult.error) {
    throw statsResult.error;
  }
  if (stagesResult.error) {
    throw stagesResult.error;
  }
  if (progressResult.error) {
    throw progressResult.error;
  }
  if (sessionsResult.error) {
    throw sessionsResult.error;
  }
  if (followsResult.error) {
    throw followsResult.error;
  }

  const profileRow = profileResult.data as ProfileQueryRow;
  const statsRow = statsResult.data as ProfileStatsRow;

  return {
    profile: toProfileSummary(
      {
        userId: profileRow.user_id,
        handle: profileRow.handle,
        displayName: profileRow.display_name,
        bio: profileRow.bio,
        avatarUrl: profileRow.avatar_url,
        featuredPostId: profileRow.featured_post_id,
        createdAt: profileRow.created_at,
        updatedAt: profileRow.updated_at,
      },
      {
        userId: statsRow.user_id,
        postCount: statsRow.post_count,
        followerCount: statsRow.follower_count,
        followingCount: statsRow.following_count,
        bestScore: statsRow.best_score,
        totalPlayCount: statsRow.total_play_count,
        uploadedPlayCount: statsRow.uploaded_play_count,
        lastPlayedAt: statsRow.last_played_at,
      },
      userId,
      false,
    ),
    stages: ((stagesResult.data ?? []) as StageRow[]).map(
      (stage): StageRecord => {
        const overlayPreset = stage.success_meme_asset?.overlay_preset ?? {};

        return {
          id: stage.id,
          stageNumber: stage.stage_number,
          slug: stage.slug,
          title: stage.title,
          description: stage.description,
          instructionText: stage.instruction_text,
          timeLimitSeconds: stage.time_limit_seconds,
          minScoreToClear: stage.min_score_to_clear,
          successMemeAssetId: stage.success_meme_asset_id,
          memeAsset: stage.success_meme_asset
            ? {
                id: stage.success_meme_asset.id,
                title: stage.success_meme_asset.title,
                assetType: stage.success_meme_asset.asset_type,
                publicUrl: getStoragePublicUrl(
                  stage.success_meme_asset.storage_path,
                  "meme-assets",
                ),
                accent:
                  typeof overlayPreset.accent === "string"
                    ? overlayPreset.accent
                    : null,
                successSticker:
                  typeof overlayPreset.successSticker === "string"
                    ? overlayPreset.successSticker
                    : null,
              }
            : null,
          ruleConfig: stage.rule_config,
          isActive: stage.is_active,
        };
      },
    ),
    progressByStageId: Object.fromEntries(
      ((progressResult.data ?? []) as StageProgressRow[]).map((progress) => [
        progress.stage_id,
        {
          id: progress.id,
          userId: progress.user_id,
          stageId: progress.stage_id,
          bestScore: progress.best_score,
          attemptCount: progress.attempt_count,
          unlockedAt: progress.unlocked_at,
          clearedAt: progress.cleared_at,
          lastAttemptedAt: progress.last_attempted_at,
        } satisfies StageProgressRecord,
      ]),
    ),
    recentSessions: ((sessionsResult.data ?? []) as PlaySessionRow[]).map(
      (session): PlaySessionRecord => ({
        id: session.id,
        userId: session.user_id,
        stageId: session.stage_id,
        score: session.score,
        resultTier: session.result_tier,
        success: session.success,
        attemptStartedAt: session.attempt_started_at,
        attemptFinishedAt: session.attempt_finished_at,
        durationSeconds: session.duration_seconds,
        similarityBreakdown: session.similarity_breakdown ?? {},
        uploadedVideoPath: session.uploaded_video_path,
        uploadedThumbnailPath: session.uploaded_thumbnail_path,
        uploadedAt: session.uploaded_at,
        createdPostId: session.created_post_id,
        createdAt: session.created_at,
      }),
    ),
    referenceClip: null,
  };
});

export const getPlayReferenceClip = cache(
  async (postId: string): Promise<PlayReferenceClip | null> => {
    const supabase = getMemeServerClient();

    const { data, error } = await supabase
      .rpc("get_public_play_reference", { p_post_id: postId });

    if (error || !data || data.length === 0) {
      return null;
    }

    const row = (data as unknown as PlayReferenceRow[])[0];
    if (!row.video_path || !row.stage_id || !row.stage_number || !row.stage_title) {
      return null;
    }

    const [videoUrl, posterUrl] = await Promise.all([
      getStoragePublicUrl(row.video_path, "post-media"),
      getStoragePublicUrl(row.poster_path, "post-media"),
    ]);

    if (!videoUrl) {
      return null;
    }

    return {
      postId: row.post_id,
      authorUserId: row.author_user_id,
      authorHandle: row.author_handle,
      authorDisplayName: row.author_display_name,
      caption: row.caption,
      videoUrl,
      posterUrl,
      stageId: row.stage_id,
      stageNumber: row.stage_number,
      stageTitle: row.stage_title,
    };
  },
);

export const getPlayHistoryData = cache(async (userId: string): Promise<PlayHistoryData> => {
  const supabase = getMemeServerClient();

  const [dashboard, sessionsResult] = await Promise.all([
    getPlayDashboardData(userId),
    supabase
      .from("play_sessions")
      .select(`
        *,
        stages:stage_id (
          stage_number,
          title
        )
      `)
      .eq("user_id", userId)
      .order("attempt_finished_at", { ascending: false })
      .limit(36),
  ]);

  if (sessionsResult.error) {
    throw sessionsResult.error;
  }

  type PlayHistoryRow = PlaySessionRow & {
    stages: {
      stage_number: number;
      title: string;
    } | null;
  };

  const sessions = await Promise.all(
    ((sessionsResult.data ?? []) as PlayHistoryRow[]).map(
      async (session): Promise<PlayHistorySession> => ({
        id: session.id,
        userId: session.user_id,
        stageId: session.stage_id,
        score: session.score,
        resultTier: session.result_tier,
        success: session.success,
        attemptStartedAt: session.attempt_started_at,
        attemptFinishedAt: session.attempt_finished_at,
        durationSeconds: session.duration_seconds,
        similarityBreakdown: session.similarity_breakdown ?? {},
        uploadedVideoPath: session.uploaded_video_path,
        uploadedThumbnailPath: session.uploaded_thumbnail_path,
        uploadedAt: session.uploaded_at,
        createdPostId: session.created_post_id,
        createdAt: session.created_at,
        stageNumber: session.stages?.stage_number ?? 0,
        stageTitle: session.stages?.title ?? "Stage",
        videoUrl: await getStoragePublicUrl(session.uploaded_video_path, "post-media"),
        thumbnailUrl: await getStoragePublicUrl(session.uploaded_thumbnail_path, "post-media"),
      }),
    ),
  );

  const recentSessionByStageId = new Map<string, PlayHistorySession>();
  const bestSessionByStageId = new Map<string, PlayHistorySession>();
  for (const session of sessions) {
    if (!recentSessionByStageId.has(session.stageId)) {
      recentSessionByStageId.set(session.stageId, session);
    }

    const currentBest = bestSessionByStageId.get(session.stageId);
    if (
      !currentBest ||
      session.score > currentBest.score ||
      (session.score === currentBest.score &&
        session.attemptFinishedAt > currentBest.attemptFinishedAt)
    ) {
      bestSessionByStageId.set(session.stageId, session);
    }
  }

  const stageSummaries = dashboard.stages.map(
    (stage): StageHistorySummary => {
      const progress = dashboard.progressByStageId[stage.id];

      return {
        stageId: stage.id,
        stageNumber: stage.stageNumber,
        title: stage.title,
        isUnlocked: Boolean(progress),
        isCleared: Boolean(progress?.clearedAt),
        bestScore: progress?.bestScore ?? 0,
        attemptCount: progress?.attemptCount ?? 0,
        lastAttemptedAt: progress?.lastAttemptedAt ?? null,
        recentSession: recentSessionByStageId.get(stage.id) ?? null,
        bestSession: bestSessionByStageId.get(stage.id) ?? null,
      };
    },
  );

  return {
    profile: dashboard.profile,
    stageSummaries,
    recentSessions: sessions.slice(0, 12),
    uploadedSessions: sessions.filter((session) => Boolean(session.uploadedAt)).slice(0, 12),
  };
});

const toConversationMessage = (
  row: MessageRow,
  senderProfile: ProfileLookupRow | undefined,
  viewerId: string,
  readAt: string | null,
): ConversationMessage => ({
  id: row.id,
  conversationId: row.conversation_id,
  senderUserId: row.sender_user_id,
  body: row.body,
  createdAt: row.created_at,
  readAt,
  isOwnMessage: row.sender_user_id === viewerId,
  sender: {
    userId: row.sender_user_id,
    handle: senderProfile?.handle ?? "player",
    displayName: senderProfile?.display_name ?? "Player",
    avatarUrl: senderProfile?.avatar_url ?? null,
  },
});

export const getProfileSummaryByUserId = cache(async (userId: string) => {
  const supabase = getMemeServerClient();
  const viewer = await getCurrentUser();

  const [profileResult, statsMap, followResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId).single(),
    loadPublicProfileStats([userId]),
    viewer
      ? supabase
          .from("follows")
          .select("following_user_id")
          .eq("follower_user_id", viewer.id)
          .eq("following_user_id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (profileResult.error) {
    return null;
  }

  const profile = profileResult.data as ProfileQueryRow;
  const stats = statsMap.get(userId) ?? null;

  return toProfileSummary(
    {
      userId: profile.user_id,
      handle: profile.handle,
      displayName: profile.display_name,
      bio: profile.bio,
      avatarUrl: profile.avatar_url,
      featuredPostId: profile.featured_post_id,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    },
    stats,
    viewer?.id ?? null,
    Boolean(followResult.data),
  );
});

export const listConversationSummaries = cache(async (): Promise<ConversationSummary[]> => {
  const viewer = await getCurrentUser();
  if (!viewer) {
    return [];
  }

  const supabase = getMemeServerClient();
  const { data: memberRows, error: membersError } = await supabase
    .from("conversation_members")
    .select("conversation_id, user_id, joined_at, last_read_at, last_read_message_id")
    .eq("user_id", viewer.id);

  if (membersError) {
    throw membersError;
  }

  const memberships = (memberRows ?? []) as ConversationMemberRow[];
  const conversationIds = memberships.map((row) => row.conversation_id);
  if (conversationIds.length === 0) {
    return [];
  }

  const [conversationsResult, otherMembersResult, messagesResult] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, created_at, updated_at, last_message_at")
      .in("id", conversationIds)
      .order("last_message_at", { ascending: false }),
    supabase
      .from("conversation_members")
      .select("conversation_id, user_id, joined_at, last_read_at, last_read_message_id")
      .in("conversation_id", conversationIds)
      .neq("user_id", viewer.id),
    supabase
      .from("messages")
      .select("id, conversation_id, sender_user_id, body, created_at, deleted_at")
      .in("conversation_id", conversationIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  if (conversationsResult.error) throw conversationsResult.error;
  if (otherMembersResult.error) throw otherMembersResult.error;
  if (messagesResult.error) throw messagesResult.error;

  const otherUserIds = Array.from(
    new Set(((otherMembersResult.data ?? []) as ConversationMemberRow[]).map((row) => row.user_id)),
  );
  const profilesResult =
    otherUserIds.length > 0
      ? await supabase
          .from("profiles")
          .select("user_id, handle, display_name, avatar_url")
          .in("user_id", otherUserIds)
      : { data: [] as ProfileLookupRow[], error: null };

  if (profilesResult.error) {
    throw profilesResult.error;
  }

  const profilesByUserId = new Map(
    ((profilesResult.data ?? []) as ProfileLookupRow[]).map((profile) => [profile.user_id, profile]),
  );
  const membershipByConversationId = new Map(
    memberships.map((membership) => [membership.conversation_id, membership]),
  );
  const counterpartByConversationId = new Map(
    ((otherMembersResult.data ?? []) as ConversationMemberRow[]).map((membership) => [
      membership.conversation_id,
      membership,
    ]),
  );
  const messagesByConversationId = new Map<string, MessageRow[]>();
  for (const message of (messagesResult.data ?? []) as MessageRow[]) {
    messagesByConversationId.set(message.conversation_id, [
      ...(messagesByConversationId.get(message.conversation_id) ?? []),
      message,
    ]);
  }

  return ((conversationsResult.data ?? []) as ConversationRow[]).flatMap((conversation) => {
    const viewerMembership = membershipByConversationId.get(conversation.id);
    const counterpartMembership = counterpartByConversationId.get(conversation.id);
    if (!viewerMembership || !counterpartMembership) {
      return [];
    }

    const counterpartProfile = profilesByUserId.get(counterpartMembership.user_id);
    if (!counterpartProfile) {
      return [];
    }

    const messages = messagesByConversationId.get(conversation.id) ?? [];
    const lastMessageRow = messages[0] ?? null;
    const unreadCount = messages.filter(
      (message) =>
        message.sender_user_id !== viewer.id &&
        (!viewerMembership.last_read_at ||
          new Date(message.created_at).getTime() >
            new Date(viewerMembership.last_read_at).getTime()),
    ).length;

    return [
      {
        id: conversation.id,
        createdAt: conversation.created_at,
        updatedAt: conversation.updated_at,
        lastMessageAt: conversation.last_message_at,
        unreadCount,
        counterpart: {
          userId: counterpartProfile.user_id,
          handle: counterpartProfile.handle,
          displayName: counterpartProfile.display_name,
          avatarUrl: counterpartProfile.avatar_url,
          bestScore: 0,
          uploadedPlayCount: 0,
        },
        lastMessage: lastMessageRow
          ? toConversationMessage(lastMessageRow, counterpartProfile, viewer.id, viewerMembership.last_read_at)
          : null,
      } satisfies ConversationSummary,
    ];
  });
});

export const getConversationRoomData = cache(
  async (conversationId: string): Promise<ConversationRoomData | null> => {
    const viewer = await getCurrentUser();
    if (!viewer) {
      return null;
    }

    const supabase = getMemeServerClient();
    const [membershipResult, counterpartMemberResult, conversationResult, messagesResult] =
      await Promise.all([
        supabase
          .from("conversation_members")
          .select("conversation_id, user_id, joined_at, last_read_at, last_read_message_id")
          .eq("conversation_id", conversationId)
          .eq("user_id", viewer.id)
          .maybeSingle(),
        supabase
          .from("conversation_members")
          .select("conversation_id, user_id, joined_at, last_read_at, last_read_message_id")
          .eq("conversation_id", conversationId)
          .neq("user_id", viewer.id)
          .maybeSingle(),
        supabase
          .from("conversations")
          .select("id, created_at, updated_at, last_message_at")
          .eq("id", conversationId)
          .maybeSingle(),
        supabase
          .from("messages")
          .select("id, conversation_id, sender_user_id, body, created_at, deleted_at")
          .eq("conversation_id", conversationId)
          .is("deleted_at", null)
          .order("created_at", { ascending: true })
          .limit(200),
      ]);

    if (membershipResult.error) throw membershipResult.error;
    if (counterpartMemberResult.error) throw counterpartMemberResult.error;
    if (conversationResult.error) throw conversationResult.error;
    if (messagesResult.error) throw messagesResult.error;

    if (!membershipResult.data || !counterpartMemberResult.data || !conversationResult.data) {
      return null;
    }

    const profileResult = await supabase
      .from("profiles")
      .select("user_id, handle, display_name, avatar_url")
      .eq("user_id", counterpartMemberResult.data.user_id)
      .single();

    if (profileResult.error) {
      throw profileResult.error;
    }

    const counterpartProfile = profileResult.data as ProfileLookupRow;
    const messages = (messagesResult.data ?? []) as MessageRow[];
    const conversationMessages = messages.map((message) =>
      toConversationMessage(
        message,
        message.sender_user_id === counterpartProfile.user_id ? counterpartProfile : undefined,
        viewer.id,
        membershipResult.data?.last_read_at ?? null,
      ),
    );

    return {
      conversation: {
        id: conversationResult.data.id,
        createdAt: conversationResult.data.created_at,
        updatedAt: conversationResult.data.updated_at,
        lastMessageAt: conversationResult.data.last_message_at,
        unreadCount: messages.filter(
          (message) =>
            message.sender_user_id !== viewer.id &&
            (!membershipResult.data?.last_read_at ||
              new Date(message.created_at).getTime() >
                new Date(membershipResult.data.last_read_at).getTime()),
        ).length,
        counterpart: {
          userId: counterpartProfile.user_id,
          handle: counterpartProfile.handle,
          displayName: counterpartProfile.display_name,
          avatarUrl: counterpartProfile.avatar_url,
          bestScore: 0,
          uploadedPlayCount: 0,
        },
        lastMessage: conversationMessages.at(-1) ?? null,
      },
      messages: conversationMessages,
    };
  },
);

export const getViewerProfileSummary = async () => {
  const viewer = await getCurrentUser();
  if (!viewer) {
    return null;
  }

  const supabase = getMemeServerClient();
  const [profileResult, statsResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", viewer.id).single(),
    supabase.from("profile_stats").select("*").eq("user_id", viewer.id).single(),
  ]);

  if (profileResult.error) {
    return null;
  }

  if (statsResult.error) {
    throw statsResult.error;
  }

  const profile = profileResult.data as ProfileQueryRow;
  const stats = statsResult.data as ProfileStatsRow;

  return toProfileSummary(
    {
      userId: profile.user_id,
      handle: profile.handle,
      displayName: profile.display_name,
      bio: profile.bio,
      avatarUrl: profile.avatar_url,
      featuredPostId: profile.featured_post_id,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    },
    mapProfileStatsRow((stats ?? null) as ProfileStatsRow | null),
    viewer.id,
    false,
  );
};

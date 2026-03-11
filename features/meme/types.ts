export type FeedSort = "latest" | "popular";
export type PostType = "text" | "image" | "play_video";
export type MediaType = "image" | "video";
export type ResultTier = "perfect" | "success" | "close" | "fail";

export type StageRuleConfig = {
  targetPoseKey: string;
  holdMs: number;
  weights: Record<string, number>;
};

export type StageMemeAsset = {
  id: string;
  title: string;
  assetType: string;
  publicUrl: string | null;
  accent: string | null;
  successSticker: string | null;
};

export type StageRecord = {
  id: string;
  stageNumber: number;
  slug: string;
  title: string;
  description: string;
  instructionText: string;
  timeLimitSeconds: number;
  minScoreToClear: number;
  successMemeAssetId: string | null;
  memeAsset: StageMemeAsset | null;
  ruleConfig: StageRuleConfig;
  isActive: boolean;
};

export type StageProgressRecord = {
  id: string;
  userId: string;
  stageId: string;
  bestScore: number;
  attemptCount: number;
  unlockedAt: string;
  clearedAt: string | null;
  lastAttemptedAt: string | null;
};

export type ProfileRecord = {
  userId: string;
  handle: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  featuredPostId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProfileStatsRecord = {
  userId: string;
  postCount: number;
  followerCount: number;
  followingCount: number;
  bestScore: number;
  totalPlayCount: number;
  uploadedPlayCount: number;
  lastPlayedAt: string | null;
};

export type ProfileSummary = {
  userId: string;
  handle: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  featuredPostId: string | null;
  followerCount: number;
  followingCount: number;
  bestScore: number;
  totalPlayCount: number;
  uploadedPlayCount: number;
  lastPlayedAt: string | null;
  isCurrentUser: boolean;
  isFollowing: boolean;
};

export type PostComment = {
  id: string;
  postId: string;
  authorUserId: string;
  isCurrentUser: boolean;
  authorHandle: string;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
  content: string;
  createdAt: string;
  media?: {
    storagePath: string;
    mimeType: string;
    publicUrl: string;
    width: number | null;
    height: number | null;
  } | null;
};

export type PostMedia = {
  id: string;
  postId: string;
  mediaType: MediaType;
  storagePath: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  posterPath: string | null;
  publicUrl: string;
  posterUrl: string | null;
};

export type FeedPost = {
  id: string;
  postType: PostType;
  caption: string;
  likeCount: number;
  commentCount: number;
  publishedAt: string;
  viewerUserId: string | null;
  popularityScore: number;
  author: ProfileSummary;
  media: PostMedia | null;
  play: {
    score: number | null;
    stageNumber: number | null;
    stageTitle: string | null;
  } | null;
  viewerHasLiked: boolean;
  viewerHasSaved: boolean;
  comments: PostComment[];
};

export type PlayReferenceClip = {
  postId: string;
  authorUserId: string;
  authorHandle: string;
  authorDisplayName: string;
  caption: string;
  videoUrl: string;
  posterUrl: string | null;
  stageId: string;
  stageNumber: number;
  stageTitle: string;
};

export type PlaySessionRecord = {
  id: string;
  userId: string;
  stageId: string;
  score: number;
  resultTier: ResultTier;
  success: boolean;
  attemptStartedAt: string;
  attemptFinishedAt: string;
  durationSeconds: number;
  similarityBreakdown: Record<string, number>;
  uploadedVideoPath: string | null;
  uploadedThumbnailPath: string | null;
  uploadedAt: string | null;
  createdPostId: string | null;
  createdAt: string;
};

export type PlaySessionWithStage = PlaySessionRecord & {
  stageNumber: number | null;
  stageTitle: string | null;
  videoPublicUrl: string | null;
  thumbnailPublicUrl: string | null;
};

export type ProfileHighlight = {
  featuredPost: FeedPost | null;
  recentPlayPost: FeedPost | null;
  recentUploadedSessions: PlaySessionWithStage[];
};

export type SearchResult = ProfileSummary & {
  recentPostCount: number;
};

export type SearchTrend = {
  id: string;
  context: string;
  label: string;
  postCountLabel: string;
};

export type PlayDashboardData = {
  profile: ProfileSummary;
  stages: StageRecord[];
  progressByStageId: Record<string, StageProgressRecord>;
  recentSessions: PlaySessionRecord[];
  referenceClip: PlayReferenceClip | null;
};

export type PlayHistorySession = PlaySessionRecord & {
  stageNumber: number;
  stageTitle: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
};

export type StageHistorySummary = {
  stageId: string;
  stageNumber: number;
  title: string;
  isUnlocked: boolean;
  isCleared: boolean;
  bestScore: number;
  attemptCount: number;
  lastAttemptedAt: string | null;
  recentSession: PlayHistorySession | null;
  bestSession: PlayHistorySession | null;
};

export type PlayHistoryData = {
  profile: ProfileSummary;
  stageSummaries: StageHistorySummary[];
  recentSessions: PlayHistorySession[];
  uploadedSessions: PlayHistorySession[];
};

export type ConversationMessage = {
  id: string;
  conversationId: string;
  senderUserId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  isOwnMessage: boolean;
  sender: Pick<ProfileSummary, "userId" | "handle" | "displayName" | "avatarUrl">;
};

export type ConversationSummary = {
  id: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  unreadCount: number;
  counterpart: Pick<
    ProfileSummary,
    "userId" | "handle" | "displayName" | "avatarUrl" | "bestScore" | "uploadedPlayCount"
  >;
  lastMessage: ConversationMessage | null;
};

export type ConversationRoomData = {
  conversation: ConversationSummary;
  messages: ConversationMessage[];
};

export type CreatePostInput = {
  caption: string;
  mediaFile?: File | null;
  mediaType?: MediaType | null;
};

export type PublishPlayInput = {
  sessionId: string;
  caption: string;
  videoFile: File;
  posterFile?: File | null;
  stageId: string;
  score: number;
};

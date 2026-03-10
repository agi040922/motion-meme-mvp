export type User = {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl?: string;
  bio: string;
  featuredMeme?: string;
  bestScore?: number;
  totalPlays: number;
  followers: number;
  following: number;
  isFollowing?: boolean;
};

export type PostType = 'video' | 'image' | 'text' | 'stage_result';

export type Post = {
  id: string;
  author: User;
  type: PostType;
  content: string; // The text caption
  mediaUrl?: string; // For video or image
  thumbnailUrl?: string; // For video
  stageId?: string; // For stage_result
  score?: number; // For stage_result
  memeUsed?: string; // For stage_result
  likes: number;
  comments: number;
  createdAt: string; // ISO String
  isLiked?: boolean;
};

export const MOCK_CURRENT_USER: User = {
  id: 'u_1',
  handle: 'motion_master',
  displayName: 'Motion Master',
  avatarUrl: 'https://i.pravatar.cc/150?u=motion_master',
  bio: 'Just moving to the memes. 🕺✨',
  featuredMeme: 'Pop Cat',
  bestScore: 98,
  totalPlays: 142,
  followers: 1205,
  following: 34,
};

export const MOCK_USERS: User[] = [
  MOCK_CURRENT_USER,
  {
    id: 'u_2',
    handle: 'dancemachine99',
    displayName: 'Dance Machine',
    avatarUrl: 'https://i.pravatar.cc/150?u=dancemachine99',
    bio: 'Stages 1-10 Cleared. Need more challenges.',
    bestScore: 95,
    totalPlays: 250,
    followers: 840,
    following: 120,
    isFollowing: true,
  },
  {
    id: 'u_3',
    handle: 'meme_lord',
    displayName: 'Meme Lord 👑',
    avatarUrl: 'https://i.pravatar.cc/150?u=meme_lord',
    bio: 'I make the best faces.',
    featuredMeme: 'Doge',
    bestScore: 88,
    totalPlays: 56,
    followers: 4320,
    following: 50,
    isFollowing: false,
  },
  {
    id: 'u_4',
    handle: 'quiet_ninja',
    displayName: 'Quiet Ninja',
    avatarUrl: 'https://i.pravatar.cc/150?u=quiet_ninja',
    bio: 'Stealth mode activate',
    totalPlays: 12,
    followers: 45,
    following: 80,
    isFollowing: false,
  }
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'p_1',
    author: MOCK_USERS[1]!,
    type: 'stage_result',
    content: 'Just cleared Stage 5 with a Perfect! The timing was so hard but I nailed it. 😂',
    mediaUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
    stageId: 'Stage 5',
    score: 95,
    memeUsed: 'Shooting Stars',
    likes: 342,
    comments: 12,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    isLiked: true,
  },
  {
    id: 'p_2',
    author: MOCK_USERS[2]!,
    type: 'text',
    content: 'Is anyone else having trouble with the Stage 8 pose? I feel like my arms are too short to get 90+ score.',
    likes: 89,
    comments: 45,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: 'p_3',
    author: MOCK_USERS[0]!, // Current User
    type: 'image',
    content: 'My setup for playing Motion Meme today! 🎮📸',
    mediaUrl: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    likes: 124,
    comments: 8,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
  },
  {
    id: 'p_4',
    author: MOCK_USERS[3]!,
    type: 'stage_result',
    content: 'First try! Not bad right?',
    mediaUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnailUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg',
    stageId: 'Stage 1',
    score: 72,
    memeUsed: 'Awkward Look Monkey Puppet',
    likes: 12,
    comments: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  }
];

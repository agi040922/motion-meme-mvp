import Link from "next/link";
import { FeedPost } from "@/components/feed/FeedPost";
import { FeedEmptyState } from "@/components/feed/FeedPost";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  adaptDomainPost,
  adaptDomainProfile,
} from "@/components/layout/socialUi";
import { getViewerProfileSummary, listFeedPosts } from "@/features/meme/server";
import { Avatar } from "@/components/ui/Avatar";

export const metadata = {
  title: "Motion Meme - Feed",
  description: "모션 밈 소셜 피드",
};

type FeedViewSort = "latest" | "popular";

const SORT_OPTIONS: Array<{ id: FeedViewSort; label: string }> = [
  { id: "latest", label: "Latest Runs" },
  { id: "popular", label: "Hot Right Now" },
];

export default async function FeedPage({
  searchParams,
}: {
  searchParams?: { sort?: string; compose?: string };
}) {
  const viewerProfile = await getViewerProfileSummary();
  const currentUser = viewerProfile ? adaptDomainProfile(viewerProfile) : null;
  const sortMode: FeedViewSort =
    searchParams?.sort === "popular" ? "popular" : "latest";
  const posts = (await listFeedPosts(sortMode)).map(
    adaptDomainPost,
  );

  return (
    <MainLayout
      currentUser={currentUser}
      initialComposeOpen={searchParams?.compose === "true"}
    >
      <div className="flex flex-col w-full h-full">
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-zinc-100 px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-xl tracking-tight">Feed</h1>
            <p className="text-sm text-zinc-500">
              Latest keeps the timeline fresh. Hot weighs reactions and recency together.
            </p>
          </div>
          <Link
            href={currentUser ? `/feed?sort=${sortMode}&compose=true` : "/auth/login?next=/feed"}
            className="whitespace-nowrap rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            {currentUser ? "Compose" : "Sign in"}
          </Link>
        </header>

        <div className="border-b border-zinc-100 px-4 py-4">
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
            <Avatar
              src={currentUser?.avatarUrl ?? undefined}
              alt={currentUser?.handle}
              fallback={currentUser?.displayName ?? "Guest"}
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-zinc-900">Share your latest attempt</p>
              <p className="text-sm text-zinc-500">
                {currentUser
                  ? "Post a clip, a reaction, or your best stage score."
                  : "Sign in with Google to publish clips, comments, and follows."}
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            {SORT_OPTIONS.map((option) => (
              <Link
                key={option.id}
                href={`/feed?sort=${option.id}`}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  sortMode === option.id
                    ? "bg-black text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
                }`}
              >
                {option.label}
              </Link>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-500">
            {sortMode === "popular"
              ? "Hot Right Now favors clips getting fast likes, comments, and recent momentum."
              : "Latest Runs shows the newest public uploads and conversations in strict time order."}
          </div>
        </div>

        {/* Feed Content */}
        <div className="flex flex-col w-full pb-32 md:pb-0">
          {posts.length > 0 ? (
            posts.map((post) => (
              <FeedPost key={post.id} post={post} currentUser={currentUser} />
            ))
          ) : (
            <FeedEmptyState
              title="The public feed is still warming up"
              description="Publish a clip, image, or text post to start the timeline."
            />
          )}
        </div>
      </div>
    </MainLayout>
  );
}

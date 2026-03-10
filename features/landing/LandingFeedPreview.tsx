import Link from "next/link";
import { adaptDomainPost } from "@/components/layout/socialUi";
import { FeedPost } from "@/components/feed/FeedPost";
import type { FeedPost as DomainFeedPost } from "@/features/meme/types";

type LandingFeedPreviewProps = {
  posts: DomainFeedPost[];
};

export const LandingFeedPreview = ({ posts }: LandingFeedPreviewProps) => {
  const previewPosts = posts.slice(0, 3).map(adaptDomainPost);

  return (
    <section className="bg-[#efefec] px-4 py-20 text-zinc-900 md:px-8">
      <div className="mx-auto max-w-[1260px]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
              Public feed preview
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
              The social layer is live.
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600">
              Browse the public feed first, then sign in with Google to record stages,
              upload your result clip, and interact with the community.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/feed"
              className="rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-800 transition-colors hover:border-zinc-900 hover:text-zinc-950"
            >
              Open public feed
            </Link>
            <Link
              href="/auth/login?next=/camera"
              className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              Sign in to play
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[280px_minmax(0,620px)_280px]">
          <aside className="hidden rounded-[32px] border border-white/60 bg-white/70 p-5 lg:block">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Quiet Mono Social
            </p>
            <p className="mt-4 text-2xl font-bold tracking-tight">
              Confirmed rail, cards, and modal direction.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-zinc-600">
              <li>Google login only</li>
              <li>Public feed with posts, images, and play clips</li>
              <li>Comments, likes, follows, and profile stats</li>
              <li>Upload happens only on explicit publish</li>
            </ul>
          </aside>

          <div className="overflow-hidden rounded-[40px] border border-white/60 bg-white shadow-[0_20px_80px_rgba(0,0,0,0.08)]">
            <div className="border-b border-zinc-100 px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                For you
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                This preview stays public. Posting and stage uploads unlock after sign-in.
              </p>
            </div>
            <div>
              {previewPosts.length > 0 ? (
                previewPosts.map((post) => <FeedPost key={post.id} post={post} />)
              ) : (
                <div className="px-6 py-14 text-center">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Feed preview
                  </p>
                  <h3 className="mt-4 text-2xl font-bold tracking-tight">
                    The first public clips appear here.
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-500">
                    Sign in, clear a stage, and press upload to create the first public play
                    video post.
                  </p>
                </div>
              )}
            </div>
          </div>

          <aside className="hidden rounded-[32px] border border-white/60 bg-white/70 p-5 lg:block">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Core loop
            </p>
            <div className="mt-5 space-y-4">
              <div className="rounded-[24px] bg-zinc-100 p-4">
                <p className="text-sm font-semibold">1. Stage challenge</p>
                <p className="mt-1 text-sm text-zinc-600">
                  10 seeded stages with sequential unlock and pose similarity scoring.
                </p>
              </div>
              <div className="rounded-[24px] bg-zinc-100 p-4">
                <p className="text-sm font-semibold">2. Local preview first</p>
                <p className="mt-1 text-sm text-zinc-600">
                  The result clip stays local until the upload button is pressed.
                </p>
              </div>
              <div className="rounded-[24px] bg-zinc-100 p-4">
                <p className="text-sm font-semibold">3. Publish to the feed</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Video posts, images, captions, and social reactions land in the same feed.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

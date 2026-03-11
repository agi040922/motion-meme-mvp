import MouseScroll from "@/components/MouseScroll";
import { LandingFeedPreview } from "@/features/landing/LandingFeedPreview";
import { getViewerProfileSummary, listFeedPosts } from "@/features/meme/server";
import { Header } from "@/components/ui/header-2";

export const metadata = {
  title: "Motion Meme | Camera Challenges Meet Social Feed",
  description:
    "A camera-first social network where stage challenges turn into meme clips, posts, reactions, and DMs.",
};

export default async function LandingPage() {
  await getViewerProfileSummary();
  const previewPosts = await listFeedPosts("popular");

  return (
    <main className="min-h-screen w-full bg-black selection:bg-white/30 text-white relative">
      <Header
        primaryCtaHref="/auth/login?next=/camera"
        primaryCtaLabel="Start with Google"
      />
      <MouseScroll
        ctaHref="/auth/login?next=/camera"
        ctaLabel="Start with Google"
      />
      <LandingFeedPreview
        ctaHref="/auth/login?next=/camera"
        ctaLabel="Start with Google"
        posts={previewPosts}
      />
    </main>
  );
}

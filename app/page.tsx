import MouseScroll from "@/components/MouseScroll";
import Link from "next/link";
import { LandingFeedPreview } from "@/features/landing/LandingFeedPreview";
import { getViewerProfileSummary, listFeedPosts } from "@/features/meme/server";

export const metadata = {
  title: "Motion Meme - Your Body is Content",
  description: "카메라를 켜고 밈이 되세요. 웹 기반 모션 밈 SNS.",
};

export default async function LandingPage() {
  const viewerProfile = await getViewerProfileSummary();
  const previewPosts = await listFeedPosts("popular");

  return (
    <main className="min-h-screen w-full bg-black selection:bg-white/30 text-white relative">
      {/* Quick entry to feed for dev/testing */}
      <Link
        href="/feed"
        className="fixed top-4 right-4 z-[100] bg-white text-black px-5 py-2.5 rounded-full font-bold text-sm shadow-lg hover:scale-105 transition-transform"
      >
        Enter Feed →
      </Link>
      <MouseScroll
        ctaHref={viewerProfile ? "/camera" : "/auth/login?next=/camera"}
        ctaLabel={viewerProfile ? "플레이하러 가기" : "로그인하고 시작하기"}
      />
      <LandingFeedPreview posts={previewPosts} />
    </main>
  );
}

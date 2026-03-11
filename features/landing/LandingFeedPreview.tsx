import Image from "next/image";
import Link from "next/link";
import { adaptDomainPost } from "@/components/layout/socialUi";
import { FeedPost } from "@/components/feed/FeedPost";
import type { FeedPost as DomainFeedPost } from "@/features/meme/types";

type LandingFeedPreviewProps = {
  ctaHref: string;
  ctaLabel: string;
  posts: DomainFeedPost[];
};

const socialSignals = [
  {
    label: "Challenge loop",
    title: "From stage clear to social post",
    body:
      "Sequential stage play is only the first half. The winning moment becomes a shareable clip with a caption, reactions, and profile presence.",
  },
  {
    label: "Private before publish",
    title: "Record first, decide later",
    body:
      "Result videos stay local until the upload button is pressed, so the product feels expressive without forcing instant posting.",
  },
  {
    label: "Actual social depth",
    title: "Not just a gimmick microsite",
    body:
      "Profiles, follows, saves, comments, and DMs turn one funny success moment into an ongoing social graph.",
  },
];

const productMoments = [
  {
    eyebrow: "01. Stage challenge",
    title: "Pose tracking with score feedback that feels theatrical.",
    copy:
      "Open the camera, align with the guide, and push through sequential stages designed to feel more like a live show than a utilitarian motion test.",
    imageSrc: "/landing/play-scene.png",
    imageAlt: "Motion Meme camera stage preview screen",
    bullets: [
      "Pose similarity scoring that users can read instantly",
      "Strong success moments with meme overlays and visual payoff",
      "Browser-first flow with no app install friction",
    ],
  },
  {
    eyebrow: "02. Duet momentum",
    title: "A solo run can turn into a shared moment.",
    copy:
      "The duet flow makes Motion Meme feel more social than a solo challenge page. Bring another player into the frame, clear together, and turn the run into something worth sending around.",
    imageSrc: "/landing/duet-play.png",
    imageAlt: "Motion Meme duet stage result clip preview",
    bullets: [
      "Split-screen duet moments that feel collaborative",
      "A natural path from stage clear into DMs or shared posts",
      "More personality than a one-player score screen",
    ],
  },
  {
    eyebrow: "03. Public sharing",
    title: "The clip should feel native inside the feed.",
    copy:
      "Once a run is posted, it needs to read like a real social post rather than an exported game artifact. That is where comments, reactions, follows, and saves start to matter.",
    imageSrc: "/landing/share-scene.png",
    imageAlt: "Motion Meme public feed post with shared result clip",
    bullets: [
      "A real feed card with caption, score tag, and share actions",
      "Public visibility before login helps explain the product fast",
      "The social loop grows after publish, not only during play",
    ],
  },
];

const opportunityRoutes = [
  {
    eyebrow: "Just chat",
    title: "Turn a challenge into a conversation.",
    body:
      "See a clip, feel the vibe, and move straight into a regular DM instead of letting the moment disappear in the feed.",
    tone: "border-zinc-200 bg-white",
    badge: "Social follow-up",
    badgeTone: "bg-zinc-100 text-zinc-700",
  },
  {
    eyebrow: "Dating spark",
    title: "A challenge can become a playful intro.",
    body:
      "If two people match the energy, Motion Meme can feel less like a scoreboard and more like a social icebreaker.",
    tone: "border-rose-200 bg-rose-50/70",
    badge: "Chemistry angle",
    badgeTone: "bg-white text-rose-500",
  },
  {
    eyebrow: "Brand / collab",
    title: "One clear could lead to a creator opportunity.",
    body:
      "A standout clip can also become a lightweight outreach moment for sponsorships, partnerships, or creator collabs.",
    tone: "border-sky-200 bg-sky-50/70",
    badge: "Creator upside",
    badgeTone: "bg-white text-sky-600",
  },
];

export const LandingFeedPreview = ({
  ctaHref,
  ctaLabel,
  posts,
}: LandingFeedPreviewProps) => {
  const previewPosts = posts.slice(0, 3).map(adaptDomainPost);

  return (
    <section id="features" className="bg-[#efefec] px-4 py-28 text-zinc-900 md:px-8 md:py-36">
      <div className="mx-auto max-w-[1260px]">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
              Why Motion Meme
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
              A challenge clip becomes a social moment.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-600">
              Motion Meme starts with camera-driven stage play, then turns your best
              reaction into a post people can watch, save, comment on, and share.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Link
              href="/feed"
              className="rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-800 transition-colors hover:border-zinc-900 hover:text-zinc-950"
            >
              Open public feed
            </Link>
            <Link
              href={ctaHref}
              className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              {ctaLabel}
            </Link>
          </div>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {socialSignals.map((signal) => (
            <article
              key={signal.label}
              className="rounded-[32px] border border-black/8 bg-white p-7 shadow-[0_18px_50px_rgba(0,0,0,0.06)] md:p-8"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
                {signal.label}
              </p>
              <h3 className="mt-4 text-2xl font-bold tracking-tight text-zinc-950">
                {signal.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-zinc-600">{signal.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-24 space-y-12 md:space-y-16">
          {productMoments.map((moment, index) => (
            <article
              key={moment.eyebrow}
              className="grid gap-8 rounded-[40px] border border-black/8 bg-white p-6 shadow-[0_20px_70px_rgba(0,0,0,0.06)] md:p-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center lg:gap-10"
            >
              <div className={index % 2 === 1 ? "lg:order-2" : undefined}>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
                  {moment.eyebrow}
                </p>
                <h3 className="mt-5 max-w-xl text-3xl font-black tracking-tight text-zinc-950 md:text-4xl">
                  {moment.title}
                </h3>
                <p className="mt-5 max-w-xl text-base leading-8 text-zinc-600">
                  {moment.copy}
                </p>
              </div>

              <div
                className={`grid gap-4 rounded-[28px] bg-zinc-100/90 p-5 ${
                  index % 2 === 1 ? "lg:order-1" : ""
                }`}
              >
                <div className="overflow-hidden rounded-[22px] border border-white/70 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
                  <Image
                    src={moment.imageSrc}
                    alt={moment.imageAlt}
                    width={1600}
                    height={1000}
                    className="h-auto w-full object-cover"
                  />
                </div>
                {moment.bullets.map((bullet) => (
                  <div
                    key={bullet}
                    className="rounded-[22px] border border-white/70 bg-white px-4 py-4 text-sm font-medium leading-7 text-zinc-700"
                  >
                    {bullet}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-24 overflow-hidden rounded-[40px] border border-black/8 bg-white shadow-[0_24px_90px_rgba(0,0,0,0.08)]">
          <div className="grid gap-8 px-6 py-8 md:px-10 md:py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-12">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
                Public feed in motion
              </p>
              <h3 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 md:text-4xl">
                The social layer should feel visible before sign-in.
              </h3>
              <p className="mt-5 text-base leading-8 text-zinc-600">
                This is the part worth showing on the landing page: a real feed, real
                layout, and real social context around the clips. It helps the product
                read as an SNS first instead of a one-screen experiment.
              </p>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-zinc-50 shadow-[0_20px_70px_rgba(0,0,0,0.08)]">
              <Image
                src="/landing/main-feed.png"
                alt="Motion Meme main feed page"
                width={1800}
                height={1000}
                className="h-auto w-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="mt-24 rounded-[40px] border border-black/8 bg-white px-6 py-8 shadow-[0_24px_90px_rgba(0,0,0,0.08)] md:px-10 md:py-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-12">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
                Beyond likes and comments
              </p>
              <h3 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 md:text-4xl">
                A single challenge can open a relationship or an opportunity.
              </h3>
              <p className="mt-5 text-base leading-8 text-zinc-600">
                This is the social direction that makes Motion Meme more interesting than
                a closed challenge loop: people can keep talking, test chemistry, or even
                turn a strong clip into a creator collaboration.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-zinc-50 shadow-[0_20px_70px_rgba(0,0,0,0.08)]">
                <Image
                  src="/landing/dm-options.png"
                  alt="Motion Meme DM options for just chat, dating intro, and brand collaboration"
                  width={900}
                  height={800}
                  className="h-auto w-full object-cover"
                />
              </div>
              <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-zinc-50 shadow-[0_20px_70px_rgba(0,0,0,0.08)]">
                <Image
                  src="/landing/dating-dm.png"
                  alt="Motion Meme dating intro direct message room"
                  width={900}
                  height={1100}
                  className="h-auto w-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {opportunityRoutes.map((route) => (
              <article
                key={route.eyebrow}
                className={`rounded-[32px] border p-6 shadow-[0_18px_50px_rgba(0,0,0,0.04)] md:p-7 ${route.tone}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    {route.eyebrow}
                  </p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${route.badgeTone}`}>
                    {route.badge}
                  </span>
                </div>
                <h4 className="mt-6 text-3xl font-bold tracking-tight text-zinc-950">
                  {route.title}
                </h4>
                <p className="mt-4 text-base leading-8 text-zinc-600">{route.body}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-24 grid gap-6 lg:grid-cols-[280px_minmax(0,620px)_280px] lg:gap-8">
          <aside className="hidden rounded-[32px] border border-white/60 bg-white/70 p-5 lg:block">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
              What you unlock
            </p>
            <p className="mt-4 text-2xl font-bold tracking-tight">
              More than a one-off camera challenge.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-zinc-600">
              <li>Stage progression with clear score feedback</li>
              <li>Private result review before any upload happens</li>
              <li>Public feed posts built from your best reaction clips</li>
              <li>Profiles, saves, follows, comments, and DMs</li>
            </ul>
          </aside>

          <div
            id="feed-preview"
            className="overflow-hidden rounded-[40px] border border-white/60 bg-white shadow-[0_20px_80px_rgba(0,0,0,0.08)]"
          >
            <div className="border-b border-zinc-100 px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Public feed preview
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                This part stays public. Publishing clips, comments, and follow actions
                unlock after sign-in.
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
                    Public motion clips will land here first.
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-500">
                    Sign in, clear a stage, and press upload to create the first public
                    result post.
                  </p>
                </div>
              )}
            </div>
          </div>

          <aside className="hidden rounded-[32px] border border-white/60 bg-white/70 p-5 lg:block">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Product loop
            </p>
            <div className="mt-5 space-y-4">
              <div className="rounded-[24px] bg-zinc-100 p-4">
                <p className="text-sm font-semibold">1. Stage challenge</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Stage progression, pose scoring, and a clear success moment.
                </p>
              </div>
              <div className="rounded-[24px] bg-zinc-100 p-4">
                <p className="text-sm font-semibold">2. Local preview first</p>
                <p className="mt-1 text-sm text-zinc-600">
                  The result clip stays private until the upload button is pressed.
                </p>
              </div>
              <div className="rounded-[24px] bg-zinc-100 p-4">
                <p className="text-sm font-semibold">3. Publish to the feed</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Video posts, captions, reactions, follows, and DMs keep the clip alive.
                </p>
              </div>
            </div>
          </aside>
        </div>

        <div
          id="cta"
          className="relative mt-24 overflow-hidden rounded-[40px] border border-black/10 bg-[#101114] px-6 py-12 text-white shadow-[0_28px_90px_rgba(0,0,0,0.22)] md:px-10 md:py-14"
        >
          <div className="absolute inset-0 opacity-35 [background-image:repeating-linear-gradient(-45deg,transparent,transparent_16px,rgba(255,255,255,0.06)_16px,rgba(255,255,255,0.06)_17px)]" />
          <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
                Ready to post the reaction?
              </p>
              <h3 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
                Enter through the camera, stay for the social loop.
              </h3>
              <p className="mt-5 text-base leading-8 text-white/70">
                Start in the browser, clear a stage, and decide which clip deserves to
                hit the feed. Motion Meme keeps the camera thrill and the social payoff
                in the same product.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={ctaHref}
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
              >
                {ctaLabel}
              </Link>
              <Link
                href="/feed"
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/85 transition-colors hover:border-white/40 hover:text-white"
              >
                Browse public feed
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

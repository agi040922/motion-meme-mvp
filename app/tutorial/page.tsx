import Link from "next/link";
import { requireUser } from "@/lib/supabase/auth";
import { getPlayDashboardData, getViewerProfileSummary } from "@/features/meme/server";
import { adaptDomainProfile } from "@/components/layout/socialUi";
import { MainLayout } from "@/components/layout/MainLayout";

export const metadata = {
  title: "Motion Meme - Tutorial",
  description: "Learn the stage loop, scoring, and upload flow before your next run.",
};

const STEPS = [
  {
    title: "Frame your body",
    description: "Keep your shoulders, hands, hips, and knees inside the camera frame.",
  },
  {
    title: "Match the target pose",
    description: "Score climbs when your pose lines up and stays stable long enough.",
  },
  {
    title: "Upload only the hits",
    description: "Successful clips can be reviewed, uploaded, and featured on your profile.",
  },
];

export default async function TutorialPage() {
  const user = await requireUser("/tutorial");
  const [viewerProfile, dashboard] = await Promise.all([
    getViewerProfileSummary(),
    getPlayDashboardData(user.id),
  ]);
  const currentUser = viewerProfile ? adaptDomainProfile(viewerProfile) : null;

  return (
    <MainLayout currentUser={currentUser}>
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-zinc-100 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Tutorial
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-zinc-950">
            Learn the loop before the spotlight hits
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600">
            You already unlocked Stage {dashboard.stages[0]?.stageNumber ?? 1}. This short guide
            covers how scoring, retries, and uploads work without touching the play canvas itself.
          </p>
        </header>

        <div className="space-y-4 px-5 py-6">
          {STEPS.map((step, index) => (
            <section
              key={step.title}
              className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
                Step {index + 1}
              </p>
              <h2 className="mt-2 text-lg font-bold text-zinc-950">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{step.description}</p>
            </section>
          ))}
        </div>

        <div className="mt-auto border-t border-zinc-100 px-5 py-5">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/history"
              className="rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50"
            >
              Review Your History
            </Link>
            <Link
              href="/play"
              className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              Continue to Play
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

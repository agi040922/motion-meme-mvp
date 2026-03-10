import { TutorialGuide } from "@/components/play-support/TutorialGuide";
import { adaptDomainProfile } from "@/components/layout/socialUi";
import { getPlayDashboardData, getViewerProfileSummary } from "@/features/meme/server";
import { requireUser } from "@/lib/supabase/auth";

export const metadata = {
  title: "Motion Meme - Tutorial",
  description: "Get ready for the stage loop before opening the live play surface.",
};

export default async function PlayTutorialPage() {
  const user = await requireUser("/play/tutorial");
  const [viewerProfile, dashboard] = await Promise.all([
    getViewerProfileSummary(),
    getPlayDashboardData(user.id),
  ]);

  return (
    <TutorialGuide
      currentUser={viewerProfile ? adaptDomainProfile(viewerProfile) : null}
      dashboard={dashboard}
    />
  );
}

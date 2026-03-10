import { TutorialGuide } from "@/components/play-support/TutorialGuide";
import { adaptDomainProfile } from "@/components/layout/socialUi";
import { getPlayDashboardData, getViewerProfileSummary } from "@/features/meme/server";
import { requireUser } from "@/lib/supabase/auth";

export const metadata = {
  title: "Motion Meme - Play Guide",
  description: "Review the play loop and stage expectations before opening the camera surface.",
};

export default async function PlayGuidePage() {
  const user = await requireUser("/play/guide");
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

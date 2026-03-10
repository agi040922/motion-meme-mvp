import { PlayHistoryPage } from "@/components/play-support/PlayHistoryPage";
import { adaptDomainProfile } from "@/components/layout/socialUi";
import { getPlayHistoryData, getViewerProfileSummary } from "@/features/meme/server";
import { requireUser } from "@/lib/supabase/auth";

export const metadata = {
  title: "Motion Meme - Play History",
  description: "Review stage progress, uploaded clips, and recent attempts.",
};

export default async function PlayHistoryRoutePage() {
  const user = await requireUser("/play/history");
  const [viewerProfile, history] = await Promise.all([
    getViewerProfileSummary(),
    getPlayHistoryData(user.id),
  ]);

  return (
    <PlayHistoryPage
      currentUser={viewerProfile ? adaptDomainProfile(viewerProfile) : null}
      history={history}
    />
  );
}

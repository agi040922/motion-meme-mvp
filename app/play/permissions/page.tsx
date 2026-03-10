import { MainLayout } from "@/components/layout/MainLayout";
import { adaptDomainProfile } from "@/components/layout/socialUi";
import { PlayPermissionGuide } from "@/components/play-support/PlayPermissionGuide";
import { requireUser } from "@/lib/supabase/auth";
import { getViewerProfileSummary } from "@/features/meme/server";

export const metadata = {
  title: "Motion Meme - Camera Guide",
  description: "Check camera permission before entering the stage.",
};

export default async function PlayPermissionsPage() {
  await requireUser("/play/permissions");
  const viewerProfile = await getViewerProfileSummary();
  const currentUser = viewerProfile ? adaptDomainProfile(viewerProfile) : null;

  return (
    <MainLayout currentUser={currentUser}>
      <PlayPermissionGuide />
    </MainLayout>
  );
}

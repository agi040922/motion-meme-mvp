import { MainLayout } from "@/components/layout/MainLayout";
import { adaptDomainProfile } from "@/components/layout/socialUi";
import { PlayPermissionGuide } from "@/components/play-support/PlayPermissionGuide";
import { getViewerProfileSummary } from "@/features/meme/server";
import { requireUser } from "@/lib/supabase/auth";

export const metadata = {
  title: "Motion Meme - Camera Setup",
  description: "Check camera permissions and retry the setup flow before opening Play.",
};

export default async function CameraGuidePage() {
  await requireUser("/camera");
  const viewerProfile = await getViewerProfileSummary();
  const currentUser = viewerProfile ? adaptDomainProfile(viewerProfile) : null;

  return (
    <MainLayout currentUser={currentUser}>
      <PlayPermissionGuide />
    </MainLayout>
  );
}

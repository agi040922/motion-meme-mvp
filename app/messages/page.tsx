import { MainLayout } from "@/components/layout/MainLayout";
import { InboxPage } from "@/components/messages/InboxPage";
import { adaptDomainProfile } from "@/components/layout/socialUi";
import { listInboxThreads } from "@/features/messages/server";
import { getViewerProfileSummary } from "@/features/meme/server";
import { requireUser } from "@/lib/supabase/auth";

export const metadata = {
  title: "Motion Meme - Messages",
  description: "Direct conversations with players you discover in the feed.",
};

export default async function MessagesPage() {
  const user = await requireUser("/messages");
  const [viewerProfile, threads] = await Promise.all([
    getViewerProfileSummary(),
    listInboxThreads(user.id),
  ]);

  return (
    <MainLayout currentUser={viewerProfile ? adaptDomainProfile(viewerProfile) : null}>
      <InboxPage threads={threads} />
    </MainLayout>
  );
}

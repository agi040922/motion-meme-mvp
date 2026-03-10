import { notFound } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { ConversationRoomClient } from "@/components/messages/ConversationRoomClient";
import { adaptDomainProfile } from "@/components/layout/socialUi";
import { getConversationRoom } from "@/features/messages/server";
import { getViewerProfileSummary } from "@/features/meme/server";
import { requireUser } from "@/lib/supabase/auth";

export default async function ConversationPage({
  params,
}: {
  params: { conversationId: string };
}) {
  const user = await requireUser(`/messages/${params.conversationId}`);
  const [viewerProfile, room] = await Promise.all([
    getViewerProfileSummary(),
    getConversationRoom(params.conversationId, user.id),
  ]);

  if (!room) {
    notFound();
  }

  return (
    <MainLayout currentUser={viewerProfile ? adaptDomainProfile(viewerProfile) : null}>
      <ConversationRoomClient room={room} />
    </MainLayout>
  );
}

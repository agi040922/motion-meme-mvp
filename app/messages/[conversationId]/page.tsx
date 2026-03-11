import { notFound } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { ConversationRoomClient } from "@/components/messages/ConversationRoomClient";
import { adaptDomainProfile } from "@/components/layout/socialUi";
import { getConversationRoom } from "@/features/messages/server";
import { getViewerProfileSummary } from "@/features/meme/server";
import { requireUser } from "@/lib/supabase/auth";

export default async function ConversationPage({
  params,
  searchParams,
}: {
  params: { conversationId: string };
  searchParams?: {
    intent?: string;
    theme?: string;
    spent?: string;
  };
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
      <ConversationRoomClient
        room={{
          ...room,
          specialRequest:
            searchParams?.intent === "dating_intro" || searchParams?.intent === "brand_collab"
              ? {
                  intent: searchParams.intent,
                  theme: searchParams.theme ?? null,
                  creditsSpent: Number(searchParams.spent ?? 0) || 0,
                }
              : null,
        }}
      />
    </MainLayout>
  );
}

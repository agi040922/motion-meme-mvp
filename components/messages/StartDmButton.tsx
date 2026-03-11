"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ensureDirectConversation, startSpecialConversation } from "@/features/messages/client";
import { BuyCreditsModal } from "@/components/profile/BuyCreditsModal";
import { SPECIAL_DM_COST, useCreditBalance, type SpecialDmIntent } from "@/lib/credits";

type StartDmButtonProps = {
  targetUserId: string;
  targetHandle: string;
  label?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function StartDmButton({
  targetUserId,
  targetHandle,
  label = "Message",
  variant = "secondary",
  size = "md",
  className = "",
}: StartDmButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isIntentOpen, setIsIntentOpen] = useState(false);
  const [isBuyCreditsOpen, setIsBuyCreditsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { balance, isLoading } = useCreditBalance();

  const openConversation = (intent: "just_chat" | SpecialDmIntent) => {
    startTransition(async () => {
      setErrorMessage(null);

      try {
        if (intent !== "just_chat") {
          const cost = SPECIAL_DM_COST[intent];
          if (balance < cost) {
            setIsBuyCreditsOpen(true);
            return;
          }
        }

        if (intent !== "just_chat") {
          const theme = intent === "dating_intro" ? "blossom" : "brand-dark";
          const result = await startSpecialConversation({
            targetUserId,
            intent,
            theme,
          });
          router.push(`/messages/${result.conversation_id}`);
        } else {
          const conversationId = await ensureDirectConversation(targetUserId);
          router.push(`/messages/${conversationId}`);
        }

        setIsIntentOpen(false);
        router.refresh();
      } catch (error) {
        if (error instanceof Error && error.message.includes("signed in")) {
          router.push("/auth/login?next=/messages");
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : `Direct messages for @${targetHandle} are unavailable right now.`;
        setErrorMessage(message);
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        disabled={isPending}
        onClick={() => setIsIntentOpen(true)}
      >
        {isPending ? "Opening..." : label}
      </Button>
      {errorMessage ? (
        <p className="max-w-[240px] text-right text-xs text-red-500">{errorMessage}</p>
      ) : null}

      <Modal isOpen={isIntentOpen} onClose={() => setIsIntentOpen(false)} title={`Message @${targetHandle}`}>
        <div className="space-y-5 p-5">
          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Credits available
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-3xl font-black tracking-tight text-zinc-900">
                {isLoading ? '...' : balance}
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="px-4"
                onClick={() => setIsBuyCreditsOpen(true)}
              >
                Buy credits
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              className="block w-full rounded-3xl border border-zinc-200 bg-white px-5 py-4 text-left transition-colors hover:bg-zinc-50"
              onClick={() => openConversation("just_chat")}
            >
              <p className="text-lg font-bold text-zinc-900">Just chat</p>
              <p className="mt-1 text-sm text-zinc-500">Open a regular DM with no credit cost.</p>
            </button>

            <button
              type="button"
              className="block w-full rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-left transition-colors hover:bg-rose-100"
              onClick={() => openConversation("dating_intro")}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-lg font-bold text-zinc-900">Dating intro</p>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-600">
                  {SPECIAL_DM_COST.dating_intro} credits
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-500">
                Opens a special DM with a softer romantic theme.
              </p>
            </button>

            <button
              type="button"
              className="block w-full rounded-3xl border border-sky-200 bg-sky-50 px-5 py-4 text-left transition-colors hover:bg-sky-100"
              onClick={() => openConversation("brand_collab")}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-lg font-bold text-zinc-900">Brand / collab</p>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-sky-700">
                  {SPECIAL_DM_COST.brand_collab} credits
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-500">
                Opens a special DM for sponsorships, partnerships, and creator outreach.
              </p>
            </button>
          </div>
        </div>
      </Modal>

      <BuyCreditsModal isOpen={isBuyCreditsOpen} onClose={() => setIsBuyCreditsOpen(false)} />
    </div>
  );
}

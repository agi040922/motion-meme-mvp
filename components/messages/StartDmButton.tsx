"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { ensureDirectConversation } from "@/features/messages/client";

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            setErrorMessage(null);

            try {
              const conversationId = await ensureDirectConversation(targetUserId);
              router.push(`/messages/${conversationId}`);
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
        }}
      >
        {isPending ? "Opening..." : label}
      </Button>
      {errorMessage ? (
        <p className="max-w-[240px] text-right text-xs text-red-500">{errorMessage}</p>
      ) : null}
    </div>
  );
}

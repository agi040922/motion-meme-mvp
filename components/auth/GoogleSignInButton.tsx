"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import {
  DEFAULT_AUTH_REDIRECT_PATH,
  getSafeRedirectPath,
} from "@/lib/supabase/shared";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type GoogleSignInButtonProps = {
  next?: string | null;
};

export const GoogleSignInButton = ({
  next,
}: GoogleSignInButtonProps) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSignIn = () => {
    startTransition(async () => {
      setErrorMessage(null);

      const redirectTo = new URL(
        "/auth/callback",
        window.location.origin,
      );
      redirectTo.searchParams.set(
        "next",
        getSafeRedirectPath(next ?? DEFAULT_AUTH_REDIRECT_PATH),
      );

      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectTo.toString(),
        },
      });

      if (error) {
        setErrorMessage(error.message);
      }
    });
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <Button
        type="button"
        size="lg"
        fullWidth
        onClick={handleSignIn}
        disabled={isPending}
      >
        {isPending ? "Connecting to Google..." : "Continue with Google"}
      </Button>
      {errorMessage ? (
        <p className="text-sm text-red-600">{errorMessage}</p>
      ) : null}
    </div>
  );
};

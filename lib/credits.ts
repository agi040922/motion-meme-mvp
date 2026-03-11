"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const CREDITS_EVENT = "motion-meme-credits-updated";
const DEFAULT_BALANCE = 0;

export const SPECIAL_DM_COST = {
  dating_intro: 20,
  brand_collab: 50,
} as const;

export type SpecialDmIntent = keyof typeof SPECIAL_DM_COST;

export const CREDIT_PACKAGES = [
  {
    id: "starter",
    credits: 50,
    priceLabel: "$4.99",
    note: "Enough for a few dating intros.",
  },
  {
    id: "plus",
    credits: 120,
    priceLabel: "$9.99",
    note: "Best value for regular intros and collabs.",
  },
  {
    id: "studio",
    credits: 300,
    priceLabel: "$19.99",
    note: "For agencies, brands, and heavy outreach.",
  },
];

const emitCreditsUpdated = (balance: number) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(CREDITS_EVENT, {
      detail: {
        balance,
      },
    }),
  );
};

const getCreditsClient = () => createBrowserSupabaseClient().schema("meme");

export const getViewerCreditBalance = async () => {
  const supabase = getCreditsClient();
  const { data, error } = await supabase.rpc("get_viewer_credit_balance");

  if (error) {
    throw new Error("Credits could not be loaded.");
  }

  const balance = Number(data ?? 0);
  emitCreditsUpdated(balance);
  return balance;
};

export const purchaseMockCredits = async (credits: number, packageId: string) => {
  const supabase = getCreditsClient();
  const { data, error } = await supabase.rpc("purchase_mock_credits", {
    p_credits: credits,
    p_package_id: packageId,
  });

  if (error) {
    throw new Error("Credits could not be added.");
  }

  const balance = Number(data ?? 0);
  emitCreditsUpdated(balance);
  return balance;
};

export const useCreditBalance = () => {
  const [balance, setBalance] = useState(DEFAULT_BALANCE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void getViewerCreditBalance()
      .then((nextBalance) => {
        if (isMounted) {
          setBalance(nextBalance);
        }
      })
      .catch(() => {
        if (isMounted) {
          setBalance(DEFAULT_BALANCE);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ balance?: number }>;
      if (typeof customEvent.detail?.balance === "number") {
        setBalance(customEvent.detail.balance);
        return;
      }

      void getViewerCreditBalance().catch(() => {
        setBalance(DEFAULT_BALANCE);
      });
    };

    window.addEventListener(CREDITS_EVENT, handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener(CREDITS_EVENT, handleUpdate);
    };
  }, []);

  return useMemo(
    () => ({
      balance,
      isLoading,
      refresh: getViewerCreditBalance,
    }),
    [balance, isLoading],
  );
};

"use client";

import { useEffect, useMemo, useState } from "react";

const CREDITS_STORAGE_KEY = "motion-meme-credit-balance";
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

export const getStoredCreditBalance = () => {
  if (typeof window === "undefined") {
    return DEFAULT_BALANCE;
  }

  const raw = window.localStorage.getItem(CREDITS_STORAGE_KEY);
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_BALANCE;
};

export const setStoredCreditBalance = (balance: number) => {
  if (typeof window === "undefined") {
    return DEFAULT_BALANCE;
  }

  const normalized = Math.max(0, Math.floor(balance));
  window.localStorage.setItem(CREDITS_STORAGE_KEY, String(normalized));
  emitCreditsUpdated(normalized);
  return normalized;
};

export const addCredits = (credits: number) =>
  setStoredCreditBalance(getStoredCreditBalance() + credits);

export const spendCredits = (credits: number) => {
  const current = getStoredCreditBalance();
  if (current < credits) {
    throw new Error("Not enough credits.");
  }

  return setStoredCreditBalance(current - credits);
};

export const useCreditBalance = () => {
  const [balance, setBalance] = useState(DEFAULT_BALANCE);

  useEffect(() => {
    setBalance(getStoredCreditBalance());

    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ balance?: number }>;
      if (typeof customEvent.detail?.balance === "number") {
        setBalance(customEvent.detail.balance);
        return;
      }

      setBalance(getStoredCreditBalance());
    };

    window.addEventListener(CREDITS_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(CREDITS_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return useMemo(
    () => ({
      balance,
      addCredits,
      spendCredits,
      setBalance: setStoredCreditBalance,
    }),
    [balance],
  );
};

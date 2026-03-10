"use client";

import Link from "next/link";
import { MainLayout } from "@/components/layout/MainLayout";
import type { SocialIdentity } from "@/components/layout/socialUi";

type PlaySupportShellProps = {
  currentUser?: SocialIdentity | null;
  eyebrow: string;
  title: string;
  description: string;
  actions?: Array<{
    href: string;
    label: string;
    variant?: "primary" | "secondary";
  }>;
  children: React.ReactNode;
};

export const PlaySupportShell = ({
  currentUser,
  eyebrow,
  title,
  description,
  actions = [],
  children,
}: PlaySupportShellProps) => (
  <MainLayout currentUser={currentUser}>
    <div className="min-h-screen bg-zinc-100 px-4 py-6 text-zinc-900 md:px-6">
      <div className="mx-auto max-w-[960px] overflow-hidden rounded-[36px] border border-zinc-200 bg-white shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
        <section className="border-b border-zinc-100 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.05),_transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,244,245,0.92))] px-5 py-10 md:px-8 md:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
          {eyebrow}
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-black tracking-tight md:text-5xl text-zinc-950">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 md:text-base">
          {description}
        </p>

        {actions.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {actions.map((action) => (
              <Link
                key={action.href + action.label}
                href={action.href}
                className={`rounded-full px-5 py-3 text-sm font-semibold transition-colors ${
                  action.variant === "secondary"
                    ? "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
                    : "bg-black text-white hover:bg-zinc-800"
                }`}
              >
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <div className="px-5 py-6 md:px-8 md:py-8 bg-zinc-50/60">{children}</div>
      </div>
    </div>
  </MainLayout>
);

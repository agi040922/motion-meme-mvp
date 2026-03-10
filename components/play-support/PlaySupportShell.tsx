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
    <div className="min-h-screen bg-zinc-950 text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top,_rgba(163,255,0,0.18),_transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.05),transparent_50%)] px-5 py-10 md:px-8 md:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#a3ff00]">
          {eyebrow}
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-black tracking-tight md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">
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
                    ? "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                    : "bg-[#a3ff00] text-black hover:bg-[#b7ff33]"
                }`}
              >
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <div className="px-5 py-6 md:px-8 md:py-8">{children}</div>
    </div>
  </MainLayout>
);

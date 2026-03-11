'use client';

import React from 'react';
import Link from 'next/link';
import { LeftRail } from './LeftRail';
import type { SocialIdentity } from '@/components/layout/socialUi';

export function MainLayout({
  children,
  currentUser,
  initialComposeOpen = false,
}: {
  children: React.ReactNode;
  currentUser?: SocialIdentity | null;
  initialComposeOpen?: boolean;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 flex w-full">
      {/* Navigation (Fixed Left Rail) */}
      <LeftRail currentUser={currentUser} initialComposeOpen={initialComposeOpen} />

      {/* Main Content Area */}
      <main className="flex-1 w-full md:pl-[280px] flex justify-center pb-20 md:pb-0">
        {/* Central Card Container */}
        <div className="w-full max-w-[600px] min-h-screen border-x border-zinc-200 bg-white shadow-sm flex flex-col relative">
          {children}
        </div>
      </main>

      {/* Optional Right Panel (Hidden on smaller screens, placeholder for later) */}
      <aside className="hidden lg:block w-[320px] p-6">
        <div className="sticky top-6">
          <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm">
            <h3 className="font-bold text-lg mb-2">Ready to move?</h3>
            <p className="text-zinc-500 text-sm mb-4">Turn on your camera and conquer the stages!</p>
            <Link
              href={currentUser ? "/play" : "/auth/login?next=/play"}
              className="block w-full rounded-xl bg-black py-3 text-center font-bold text-white transition-colors hover:bg-zinc-800"
            >
              Start Challenge
            </Link>
          </div>
          <div className="mt-4 rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-500">
              Limited Social Event
            </p>
            <h3 className="mt-2 text-lg font-bold text-zinc-900">Tonight&apos;s Chemistry Duet</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Find a play clip in the feed, open split-screen duet mode, and send a DM if the vibe matches.
            </p>
            <Link
              href="/feed?sort=popular"
              className="mt-4 block w-full rounded-xl border border-zinc-200 py-3 text-center text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50"
            >
              Browse duet-ready clips
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}

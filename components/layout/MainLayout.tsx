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
              href={currentUser ? "/camera" : "/auth/login?next=/camera"}
              className="block w-full rounded-xl bg-black py-3 text-center font-bold text-white transition-colors hover:bg-zinc-800"
            >
              Start Challenge
            </Link>
            {currentUser ? (
              <div className="mt-4 grid gap-2">
                <Link
                  href="/play/guide"
                  className="block w-full rounded-xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-200"
                >
                  Open Play Guide
                </Link>
                <Link
                  href="/play/history"
                  className="block w-full rounded-xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-200"
                >
                  Review History
                </Link>
                <Link
                  href="/play/permissions"
                  className="block w-full rounded-xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-200"
                >
                  Camera Permission Guide
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}

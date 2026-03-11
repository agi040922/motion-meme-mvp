import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { RelativeTime } from "@/components/ui/RelativeTime";
import type { InboxThread } from "@/features/messages/types";

const InboxFlowerSticker = ({ className }: { className: string }) => (
  <div className={`pointer-events-none absolute ${className}`}>
    <div className="relative h-full w-full">
      <span className="absolute left-1/2 top-0 h-[38%] w-[38%] -translate-x-1/2 rounded-full bg-rose-200/80" />
      <span className="absolute left-0 top-1/2 h-[38%] w-[38%] -translate-y-1/2 rounded-full bg-rose-100/80" />
      <span className="absolute right-0 top-1/2 h-[38%] w-[38%] -translate-y-1/2 rounded-full bg-fuchsia-100/80" />
      <span className="absolute bottom-0 left-1/2 h-[38%] w-[38%] -translate-x-1/2 rounded-full bg-rose-200/75" />
      <span className="absolute left-1/2 top-1/2 h-[22%] w-[22%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200/90" />
    </div>
  </div>
);

type InboxPageProps = {
  threads: InboxThread[];
};

export function InboxPage({ threads }: InboxPageProps) {
  const unreadThreadCount = threads.filter((thread) => thread.unreadCount > 0).length;
  const unreadMessageCount = threads.reduce((sum, thread) => sum + thread.unreadCount, 0);
  const unreadThreads = threads.filter((thread) => thread.unreadCount > 0);
  const caughtUpThreads = threads.filter((thread) => thread.unreadCount === 0);
  const sections = [
    { id: "unread", title: "Unread now", threads: unreadThreads },
    { id: "recent", title: "Caught up", threads: caughtUpThreads },
  ].filter((section) => section.threads.length > 0);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-zinc-100 bg-white/90 px-4 py-4 backdrop-blur-md">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Messages</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Move from comments into 1:1 chats without leaving Motion Meme.
        </p>
        {threads.length > 0 ? (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-600">
            <span>{unreadThreadCount} unread thread{unreadThreadCount === 1 ? '' : 's'}</span>
            <span className="text-zinc-300">·</span>
            <span>{unreadMessageCount} unread message{unreadMessageCount === 1 ? '' : 's'}</span>
          </div>
        ) : null}
      </header>

      <div className="flex flex-1 flex-col">
        {threads.length > 0 ? (
          sections.map((section) => (
            <section key={section.id} className="border-b border-zinc-100 last:border-b-0">
              <div className="bg-zinc-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                {section.title}
              </div>
              {section.threads.map((thread) => (
                <Link
                  key={thread.conversationId}
                  href={`/messages/${thread.conversationId}`}
                  className={`relative block overflow-hidden border-t border-zinc-100 px-4 py-4 transition-colors first:border-t-0 ${
                    thread.specialRequest?.intent === "dating_intro"
                      ? "bg-[linear-gradient(135deg,#fff8fb_0%,#ffffff_65%)] hover:bg-[linear-gradient(135deg,#fff1f7_0%,#ffffff_65%)]"
                      : thread.specialRequest?.intent === "brand_collab"
                        ? "bg-[linear-gradient(135deg,#f7fbff_0%,#ffffff_65%)] hover:bg-[linear-gradient(135deg,#eef8ff_0%,#ffffff_65%)]"
                        : "hover:bg-zinc-50"
                  }`}
                >
                  {thread.specialRequest?.intent === "dating_intro" ? (
                    <>
                      <InboxFlowerSticker className="-right-2 top-2 h-12 w-12 opacity-70" />
                      <InboxFlowerSticker className="bottom-2 right-10 h-8 w-8 opacity-45" />
                    </>
                  ) : null}
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={thread.otherMember.avatarUrl ?? undefined}
                      alt={thread.otherMember.handle}
                      fallback={thread.otherMember.displayName}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-zinc-900">
                            {thread.otherMember.displayName}
                          </p>
                          <p className="truncate text-sm text-zinc-500">
                            @{thread.otherMember.handle}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {thread.lastMessage ? (
                            <RelativeTime
                              dateString={thread.lastMessage.createdAt}
                              className="text-xs text-zinc-400"
                            />
                          ) : null}
                          {thread.unreadCount > 0 ? (
                            <span className="rounded-full bg-black px-2 py-1 text-[11px] font-bold text-white">
                              {thread.unreadCount}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-sm text-zinc-600">
                        {thread.specialRequest ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                              thread.specialRequest.intent === "dating_intro"
                                ? "bg-rose-100 text-rose-600"
                                : "bg-sky-100 text-sky-700"
                            }`}
                          >
                            {thread.specialRequest.intent === "dating_intro" ? "Dating" : "Brand"}
                          </span>
                        ) : null}
                        {thread.lastMessage?.messageType === 'image' ? (
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                            Photo
                          </span>
                        ) : null}
                        <p className="truncate">
                          {thread.lastMessage?.previewText || "Start the conversation"}
                        </p>
                      </div>
                      {thread.unreadCount > 0 ? (
                        <p className="mt-1 text-xs font-semibold text-zinc-900">
                          New since your last read
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </section>
          ))
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="rounded-full bg-zinc-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Inbox empty
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900">
              Your direct messages will appear here
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
              Open a profile or post and tap Message to start a 1:1 thread.
            </p>
            <Link
              href="/feed"
              className="mt-6 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              Browse the feed
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

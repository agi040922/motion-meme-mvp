import Link from 'next/link';
import { SearchBar } from '@/components/search/SearchBar';
import { UserCard } from '@/components/search/UserCard';
import { MainLayout } from "@/components/layout/MainLayout";
import {
  adaptDomainProfile,
  matchesProfileQuery,
  matchesTrendQuery,
} from '@/components/layout/socialUi';
import { getViewerProfileSummary, listTrendingTopics, searchProfiles } from '@/features/meme/server';

export const metadata = {
  title: "Motion Meme - Search & Follow",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const viewerProfile = await getViewerProfileSummary();
  const currentUser = viewerProfile ? adaptDomainProfile(viewerProfile) : null;
  const query = searchParams?.q?.trim() ?? '';
  const [rawUsers, rawTrends] = await Promise.all([
    searchProfiles(query),
    listTrendingTopics(),
  ]);
  const recommendedUsers = rawUsers
    .map((user) => adaptDomainProfile(user))
    .filter((user) => {
    if (!query && user.relationship.isCurrentUser) {
      return false;
    }

    return matchesProfileQuery(user, query);
  });
  const visibleTrends = rawTrends.filter((trend) => matchesTrendQuery(trend, query));
  const hasQuery = query.length > 0;
  const resultCount = recommendedUsers.length + visibleTrends.length;
  const resultLabel = hasQuery
    ? `${resultCount} result${resultCount === 1 ? '' : 's'} for "${query}"`
    : 'Find creators to follow and discover trending memes.';

  return (
    <MainLayout currentUser={currentUser}>
      <div className="flex flex-col w-full h-full min-h-screen pb-32 md:pb-0">
        <SearchBar query={query} resultLabel={resultLabel} />
        
        <div className="pt-4">
          <h2 className="px-5 pb-3 font-bold text-xl tracking-tight text-zinc-900">
            {hasQuery ? 'Creators' : 'Who to follow'}
          </h2>
          
          <div className="flex flex-col">
            {recommendedUsers.length > 0 ? (
              recommendedUsers.map((user) => (
                <UserCard key={user.id} user={user} />
              ))
            ) : (
              <div className="px-5 py-12 text-center text-zinc-500">
                <p className="font-semibold text-zinc-900">No creator matches yet</p>
                <p className="mt-2 text-sm">
                  Try a different handle, meme name, or clear the search to browse recommendations.
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-zinc-100">
          <h2 className="px-5 pb-3 font-bold text-xl tracking-tight text-zinc-900">
            Trending Memes
          </h2>
          <div className="flex flex-col gap-4 px-5">
            {visibleTrends.length > 0 ? (
              visibleTrends.map((trend) => (
                <Link
                  key={trend.id}
                  href={`/search?q=${encodeURIComponent(trend.label)}`}
                  className="block rounded-2xl bg-zinc-100 p-4 transition-colors hover:bg-zinc-200"
                >
                  <p className="text-xs text-zinc-500 mb-1">{trend.context}</p>
                  <p className="font-bold text-zinc-900">{trend.label}</p>
                  <p className="text-sm text-zinc-500 mt-1">{trend.postCountLabel}</p>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">
                No trending meme matched this search.
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

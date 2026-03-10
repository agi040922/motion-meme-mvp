import React from 'react';
import { SearchIcon } from '../ui/icons';

interface SearchBarProps {
  query?: string;
  resultLabel?: string;
  isLoading?: boolean;
}

export function SearchBar({ query = '', resultLabel, isLoading = false }: SearchBarProps) {
  return (
    <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md p-4 pb-2 border-b border-zinc-100">
      <form action="/search" className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-zinc-400" />
        </div>
        <input
          name="q"
          type="text"
          placeholder="Search creators, memes, or tags"
          defaultValue={query}
          className="w-full bg-zinc-100 border-transparent focus:bg-white focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200 rounded-full pl-12 pr-4 py-3 text-zinc-900 placeholder:text-zinc-500 transition-all outline-none"
        />
      </form>
      <div className="px-1 pt-2 text-xs font-medium text-zinc-500">
        {isLoading ? 'Searching...' : resultLabel ?? 'Find creators to follow and trending motion memes.'}
      </div>
    </div>
  );
}

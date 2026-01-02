import React, { useState } from 'react';
import { SEARCH_ENGINES } from '../constants';

interface SearchWidgetProps {
  searchEngine: string;
}

export const SearchWidget: React.FC<SearchWidgetProps> = ({ searchEngine }) => {
  const [query, setQuery] = useState('');

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const engine = SEARCH_ENGINES[searchEngine] || SEARCH_ENGINES['google'];
      window.open(`${engine.url}${encodeURIComponent(query)}`, '_blank');
      setQuery('');
    }
  };

  const placeholder = `Search ${SEARCH_ENGINES[searchEngine]?.name || 'Google'}...`;

  return (
    <form onSubmit={onSearch} className="w-full mb-8 relative z-10 px-2">
      <div className="relative group">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-800/60 border border-slate-700/50 text-white rounded-2xl py-3.5 pl-4 pr-12 shadow-lg backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-slate-500 text-base"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}
      </div>
    </form>
  );
};

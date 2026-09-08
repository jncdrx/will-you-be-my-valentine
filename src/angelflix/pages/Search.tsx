import { useState, useRef, useEffect } from 'react';
import { Memory } from '@/data/memories';
import MemoryCard from '@/components/MemoryCard';
import { netflixSound } from '../../lib/netflixSound';

interface SearchProps {
  memories: Memory[];
  favorites: Set<string>;
  watched: Map<string, number>;
  onPlay: (id: string) => void;
  onDetails: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export default function Search({ memories, favorites, watched, onPlay, onDetails, onToggleFavorite }: SearchProps) {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const addToRecent = (q: string) => {
    const t = q.trim();
    if (!t) return;
    setRecentSearches((prev) => [t, ...prev.filter((s) => s !== t)].slice(0, 5));
  };

  const trimmed = query.trim().toLowerCase();

  useEffect(() => {
    if (!trimmed) return;
    const t = setTimeout(() => addToRecent(query), 800);
    return () => clearTimeout(t);
  }, [trimmed]);
  const results = trimmed
    ? memories.filter((m) =>
        m.title.toLowerCase().includes(trimmed) ||
        m.category.toLowerCase().includes(trimmed) ||
        m.date.toLowerCase().includes(trimmed) ||
        m.description.toLowerCase().includes(trimmed)
      )
    : [];

  const suggestions = ['monthsary', 'road trip', 'coffee', 'adventure', 'messages'];

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingTop: '4rem' }}>
      <div className="px-4 sm:px-8 lg:px-16 pt-10 pb-16">
        <div className="max-w-2xl mx-auto mb-12">
          <div
            className="flex items-center gap-3 px-5 py-4 rounded-2xl"
            style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0" style={{ transition: 'none' }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && query.trim()) addToRecent(query); }}
              placeholder="Search our memories..."
              className="flex-1 bg-transparent text-lg outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
            {query && (
              <button
                onClick={() => {
                  netflixSound.playClick();
                  setQuery('');
                }}
                style={{ color: 'var(--text-muted)' }}
                className="hover:text-current transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {!trimmed && (
          <div className="text-center">
            {recentSearches.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                    <circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" />
                  </svg>
                  <p style={{ color: 'var(--text-muted)' }} className="text-xs font-semibold tracking-widest uppercase">Recent</p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                  {recentSearches.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        netflixSound.playClick();
                        setQuery(s);
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                      {s}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    netflixSound.playClick();
                    setRecentSearches([]);
                  }}
                  className="text-xs"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
                >
                  Clear history
                </button>
              </div>
            )}
            <p style={{ color: 'var(--text-muted)' }} className="text-sm mb-6">Try searching for</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    netflixSound.playClick();
                    setQuery(s);
                    addToRecent(s);
                  }}
                  className="px-4 py-2 rounded-full text-sm"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {trimmed && results.length > 0 && (
          <div>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Results for <span style={{ color: 'var(--text-primary)' }} className="font-medium">"{query}"</span> — {results.length} {results.length === 1 ? 'memory' : 'memories'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {results.map((m) => (
                <MemoryCard key={m.id} memory={m} isFavorite={favorites.has(m.id)} watchedSec={watched.get(m.id)} onPlay={onPlay} onDetails={onDetails} onToggleFavorite={onToggleFavorite} />
              ))}
            </div>
          </div>
        )}

        {trimmed && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Couldn't find that memory</h3>
            <p style={{ color: 'var(--text-secondary)' }} className="text-sm mb-6">Try another title, date, or moment.</p>
            <button
              onClick={() => setQuery('')}
              className="px-6 py-2.5 rounded-full text-sm font-semibold"
              style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--btn-primary-bg)'; }}
            >
              View All Memories
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

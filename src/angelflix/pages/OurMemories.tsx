import { useState } from 'react';
import { Memory, Category } from '@/data/memories';
import MemoryCard from '@/components/MemoryCard';
import { useInView } from '@/hooks/useInView';

type Filter = 'All' | Category;
type SortKey = 'newest' | 'oldest' | 'shortest' | 'longest';
type ViewMode = 'grid' | 'list';

const FILTERS: Filter[] = ['All', 'Monthsaries', 'Dates', 'Adventures', 'Messages', 'Funny Moments', 'Special Days'];

interface OurMemoriesProps {
  memories: Memory[];
  favorites: Set<string>;
  watched: Map<string, number>;
  onPlay: (id: string) => void;
  onDetails: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

function totalRuntime(memories: Memory[]) {
  const total = memories.reduce((s, m) => s + m.durationSec, 0);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return h > 0 ? `${h} hr ${m} min` : `${m} min`;
}

export default function OurMemories({ memories, favorites, watched, onPlay, onDetails, onToggleFavorite }: OurMemoriesProps) {
  const [filter, setFilter] = useState<Filter>('All');
  const [sort, setSort] = useState<SortKey>('newest');
  const [view, setView] = useState<ViewMode>('grid');
  const { ref: headerRef, inView: headerIn } = useInView();
  const { ref: gridRef, inView: gridIn } = useInView();

  const base = filter === 'All' ? memories : memories.filter((m) => m.category === filter);
  const filtered = [...base].sort((a, b) => {
    if (sort === 'newest') return b.dateSort.localeCompare(a.dateSort);
    if (sort === 'oldest') return a.dateSort.localeCompare(b.dateSort);
    if (sort === 'shortest') return a.durationSec - b.durationSec;
    return b.durationSec - a.durationSec;
  });

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingTop: '4rem' }}>
      <div className="px-4 sm:px-8 lg:px-16 pt-10 pb-16">

        {/* Header */}
        <div ref={headerRef} className={`mb-8 reveal ${headerIn ? 'visible' : ''}`}>
          <h1 className="font-display text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Our Memories</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-base mb-3">Every little moment worth keeping.</p>

          {/* Stats */}
          <div className="flex items-center gap-4">
            {[
              { label: `${memories.length} memories` },
              { label: totalRuntime(memories) + ' total' },
              { label: `${new Set(memories.map((m) => m.category)).size} categories` },
            ].map((stat, i) => (
              <span key={i} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                {i > 0 && <span style={{ opacity: 0.35 }}>·</span>}
                {stat.label}
              </span>
            ))}
          </div>
        </div>

        {/* Controls bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {FILTERS.map((f) => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="px-3.5 py-1.5 rounded-full text-sm font-medium"
                  style={{
                    background: active ? 'var(--accent)' : 'var(--bg-card)',
                    color: active ? '#fff' : 'var(--text-secondary)',
                    border: active ? '1px solid transparent' : '1px solid var(--border)',
                  }}
                  onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; } }}
                  onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; } }}
                >
                  {f}
                </button>
              );
            })}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="text-sm rounded-lg px-2.5 py-1.5 outline-none appearance-none cursor-pointer"
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                paddingRight: '28px',
              }}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="shortest">Shortest</option>
              <option value="longest">Longest</option>
            </select>
          </div>

          {/* View toggle */}
          <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {(['grid', 'list'] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="w-9 h-8 flex items-center justify-center"
                style={{
                  background: view === v ? 'var(--bg-elevated)' : 'var(--bg-card)',
                  color: view === v ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                {v === 'grid'
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                }
              </button>
            ))}
          </div>

          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
            {filtered.length} {filtered.length === 1 ? 'memory' : 'memories'}
          </span>
        </div>

        {/* Content */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><rect x="2" y="7" width="20" height="15" rx="2" /><path d="M16 7V5a2 2 0 0 0-4 0v2" /></svg>
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No memories in this category</h3>
            <p style={{ color: 'var(--text-secondary)' }} className="text-sm">More are on their way.</p>
          </div>
        ) : view === 'grid' ? (
          <div ref={gridRef} className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 reveal ${gridIn ? 'visible' : ''}`}>
            {filtered.map((m, i) => (
              <div key={m.id} className={`reveal reveal-d${Math.min(i % 4 + 1, 3) as 1 | 2 | 3} ${gridIn ? 'visible' : ''}`}>
                <MemoryCard memory={m} isFavorite={favorites.has(m.id)} watchedSec={watched.get(m.id)} onPlay={onPlay} onDetails={onDetails} onToggleFavorite={onToggleFavorite} />
              </div>
            ))}
          </div>
        ) : (
          /* List view */
          <div ref={gridRef} className={`flex flex-col gap-3 reveal ${gridIn ? 'visible' : ''}`}>
            {filtered.map((m) => (
              <div
                key={m.id}
                onClick={() => onDetails(m.id)}
                className="flex items-center gap-4 rounded-xl group cursor-pointer"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '12px', transition: 'border-color 0.15s ease, background 0.15s ease' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)'; }}
              >
                <div className="relative flex-shrink-0 rounded-lg overflow-hidden" style={{ width: '140px', height: '79px' }}>
                  <img src={m.thumbnail} alt={m.title} className="w-full h-full object-cover" style={{ transition: 'none' }} />
                  {watched.get(m.id) && (watched.get(m.id)! / m.durationSec) < 0.95 && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'var(--progress-remaining)' }}>
                      <div style={{ width: `${(watched.get(m.id)! / m.durationSec) * 100}%`, height: '100%', background: 'var(--progress-played)' }} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate mb-1" style={{ color: 'var(--text-primary)' }}>{m.title}</div>
                  <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{m.date} · {m.duration} · {m.category}</div>
                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{m.description}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100" style={{ transition: 'opacity 0.15s ease' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); onPlay(m.id); }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-white"
                    style={{ background: 'var(--accent)' }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
                    Play
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(m.id); }}
                    className="w-8 h-8 flex items-center justify-center rounded-full"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: favorites.has(m.id) ? 'var(--accent)' : 'var(--text-muted)' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill={favorites.has(m.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

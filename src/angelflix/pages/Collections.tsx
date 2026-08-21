import { useState } from 'react';
import { COLLECTIONS, Memory } from '@/data/memories';
import MemoryCard from '@/components/MemoryCard';

interface CollectionsProps {
  memories: Memory[];
  favorites: Set<string>;
  watched: Map<string, number>;
  onPlay: (id: string) => void;
  onDetails: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export default function Collections({ memories, favorites, watched, onPlay, onDetails, onToggleFavorite }: CollectionsProps) {
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const active = activeCollection ? COLLECTIONS.find((c) => c.id === activeCollection) : null;
  const filtered = active ? memories.filter((m) => m.category === active.category) : [];

  if (active) {
    return (
      <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingTop: '3.5rem' }}>
        <div className="relative" style={{ height: '240px' }}>
          <img src={active.thumbnail} alt={active.name} className="absolute inset-0 w-full h-full object-cover" style={{ transition: 'none' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(9,9,9,1) 0%, rgba(9,9,9,0.5) 50%, rgba(9,9,9,0.25) 100%)' }} />
          <div className="absolute inset-0 flex flex-col justify-end px-4 sm:px-8 lg:px-16 pb-8">
            <button
              onClick={() => setActiveCollection(null)}
              className="flex items-center gap-2 text-sm mb-3 w-fit"
              style={{ color: 'rgba(255,255,255,0.5)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'white'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6" /></svg>
              All Collections
            </button>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mb-1" style={{ color: 'var(--text-inverse)' }}>{active.name}</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)' }} className="text-sm">{active.description} · {filtered.length} {filtered.length === 1 ? 'memory' : 'memories'}</p>
          </div>
        </div>

        <div className="px-4 sm:px-8 lg:px-16 py-8 sm:py-10">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p style={{ color: 'var(--text-secondary)' }}>No memories in this collection yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {filtered.map((m) => (
                <MemoryCard key={m.id} memory={m} isFavorite={favorites.has(m.id)} watchedSec={watched.get(m.id)} onPlay={onPlay} onDetails={onDetails} onToggleFavorite={onToggleFavorite} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingTop: '3.5rem' }}>
      <div className="px-4 sm:px-8 lg:px-16 pt-10 pb-16">
        <div className="mb-8">
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Collections</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-base">Different chapters of us.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {COLLECTIONS.map((col) => {
            const count = memories.filter((m) => m.category === col.category).length;
            return (
              <button
                key={col.id}
                onClick={() => setActiveCollection(col.id)}
                className="relative rounded-2xl overflow-hidden text-left group"
                style={{ height: '220px', border: '1px solid var(--border)' }}
              >
                <img
                  src={col.thumbnail}
                  alt={col.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ transition: 'transform 0.5s ease' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'; }}
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.15) 100%)' }} />

                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                  <div className="text-xs font-medium mb-1.5 tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
                    {count} {count === 1 ? 'memory' : 'memories'}
                  </div>
                  <h3 className="font-display text-lg sm:text-xl font-semibold mb-1" style={{ color: 'var(--text-inverse)' }}>{col.name}</h3>
                  <p className="text-xs sm:text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{col.description}</p>
                </div>

                <div
                  className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"
                  style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', transition: 'opacity 200ms ease' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9,18 15,12 9,6" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

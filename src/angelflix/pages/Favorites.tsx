import { Memory } from '@/data/memories';
import MemoryCard from '@/components/MemoryCard';
import { Page } from '@/components/Navbar';

interface FavoritesProps {
  memories: Memory[];
  favorites: Set<string>;
  watched: Map<string, number>;
  onPlay: (id: string) => void;
  onDetails: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onNavigate: (page: Page) => void;
}

export default function Favorites({ memories, favorites, watched, onPlay, onDetails, onToggleFavorite, onNavigate }: FavoritesProps) {
  const favMemories = memories.filter((m) => favorites.has(m.id));

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingTop: '4rem' }}>
      <div className="px-4 sm:px-8 lg:px-16 pt-10 pb-16">
        <div className="mb-10">
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Our Favorites</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-base">The memories we'd watch over and over again.</p>
        </div>

        {favMemories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="mb-6" style={{ opacity: 0.12 }}>
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="0.8">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No favorites yet</h3>
            <p style={{ color: 'var(--text-secondary)' }} className="text-sm mb-6">When a memory feels extra special, save it here.</p>
            <button
              onClick={() => onNavigate('memories')}
              className="px-6 py-2.5 rounded-full text-sm font-semibold"
              style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--btn-primary-bg)'; }}
            >
              Browse Our Memories
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {favMemories.map((m) => (
              <MemoryCard key={m.id} memory={m} isFavorite={true} watchedSec={watched.get(m.id)} onPlay={onPlay} onDetails={onDetails} onToggleFavorite={onToggleFavorite} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

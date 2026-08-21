import { useState, useRef, useEffect } from 'react';
import { Memory, formatTime } from '@/data/memories';

interface MemoryCardProps {
  memory: Memory;
  isFavorite: boolean;
  watchedSec?: number;
  onPlay: (id: string) => void;
  onDetails: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export default function MemoryCard({ memory, isFavorite, watchedSec, onPlay, onDetails, onToggleFavorite }: MemoryCardProps) {
  const [hovered, setHovered] = useState(false);
  const [heartPop, setHeartPop] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const heartRef = useRef<SVGSVGElement>(null);

  useEffect(() => { setImgLoaded(false); }, [memory.thumbnail]);

  const progress = watchedSec != null ? watchedSec / memory.durationSec : null;
  const completed = progress != null && progress >= 0.95;

  const handleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHeartPop(true);
    onToggleFavorite(memory.id);
    setTimeout(() => setHeartPop(false), 400);
  };

  return (
    <div
      className="relative rounded-xl overflow-hidden cursor-pointer flex-shrink-0"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: hovered ? 'var(--shadow-hover)' : 'var(--shadow-card)',
        transform: hovered ? 'scale(1.035)' : 'scale(1)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 200ms ease, border-color 200ms ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onDetails(memory.id)}
    >
      {/* Thumbnail */}
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        {/* Shimmer skeleton while loading */}
        {!imgLoaded && (
          <div className="absolute inset-0 skeleton" />
        )}
        <img
          src={memory.thumbnail}
          alt={memory.title}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transition: 'none', opacity: imgLoaded ? 1 : 0 }}
          onLoad={() => setImgLoaded(true)}
        />

        {/* Persistent bottom gradient for readability */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)',
            opacity: 1,
          }}
        />

        {/* Hover overlay — darkens more */}
        <div
          className="absolute inset-0"
          style={{
            background: 'rgba(0,0,0,0.35)',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.18s ease',
          }}
        />

        {/* Hover controls — centered */}
        <div
          className="absolute inset-0 flex items-center justify-center gap-2.5"
          style={{ opacity: hovered ? 1 : 0, transition: 'opacity 0.18s ease' }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onPlay(memory.id); }}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white"
            style={{ background: 'var(--accent)', transition: 'background 150ms ease' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--accent)'; }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
            {watchedSec && !completed ? 'Resume' : 'Play'}
          </button>

          <button
            onClick={handleFav}
            className="w-9 h-9 flex items-center justify-center rounded-full"
            style={{
              background: 'rgba(255,255,255,0.13)',
              color: isFavorite ? 'var(--accent)' : 'white',
              border: '1px solid rgba(255,255,255,0.22)',
            }}
          >
            <svg
              ref={heartRef}
              width="14" height="14" viewBox="0 0 24 24"
              fill={isFavorite ? 'currentColor' : 'none'}
              stroke="currentColor" strokeWidth="2"
              className={heartPop ? 'heart-pop' : ''}
              style={{ transition: 'none' }}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>

        {/* Category pill — bottom left, always visible */}
        <div
          className="absolute bottom-0 left-0 px-2.5 py-1.5 m-2 rounded-md text-xs font-medium"
          style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(4px)' }}
        >
          {memory.category}
        </div>

        {/* Favorite badge — top right */}
        {isFavorite && !hovered && (
          <div className="absolute top-2 right-2">
            <svg
              width="15" height="15" viewBox="0 0 24 24"
              fill="var(--accent)" stroke="none"
              className={heartPop ? 'heart-pop' : ''}
              style={{ transition: 'none', filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.4))' }}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
        )}

        {/* Completed badge */}
        {completed && (
          <div
            className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1"
            style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.75)' }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12" /></svg>
            Watched
          </div>
        )}

        {/* Progress bar */}
        {progress != null && !completed && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'var(--progress-remaining)' }}>
            <div style={{ width: `${progress * 100}%`, height: '100%', background: 'var(--progress-played)' }} />
          </div>
        )}
      </div>

      {/* Info area */}
      <div className="px-3 pt-2.5 pb-3">
        <div className="text-sm font-semibold leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
          {memory.title}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>{memory.date}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>{memory.duration}</span>
          {watchedSec && !completed && (
            <>
              <span style={{ opacity: 0.4 }}>·</span>
              <span style={{ color: 'var(--accent)' }}>{formatTime(memory.durationSec - watchedSec)} left</span>
            </>
          )}
        </div>
        {/* Description — fades in on hover */}
        <div
          style={{
            maxHeight: hovered ? '40px' : '0px',
            opacity: hovered ? 1 : 0,
            overflow: 'hidden',
            transition: 'max-height 0.22s ease, opacity 0.22s ease',
            marginTop: hovered ? '6px' : '0px',
          }}
        >
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
            {memory.description}
          </p>
        </div>
      </div>
    </div>
  );
}

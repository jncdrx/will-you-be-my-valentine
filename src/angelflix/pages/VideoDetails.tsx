import { useState } from 'react';
import { Memory, formatTime } from '@/data/memories';
import MemoryCard from '@/components/MemoryCard';

const MOOD_OPTIONS = ['Romantic', 'Heartfelt', 'Funny', 'Sweet', 'Adventurous', 'Nostalgic', 'Cozy', 'Silly'];
const MOOD_COLORS: Record<string, string> = {
  Romantic: '#B7475A', Heartfelt: '#C06BA0', Funny: '#D4A84B', Sweet: '#E08970',
  Adventurous: '#E08940', Nostalgic: '#7B68EE', Cozy: '#4A9B8E', Silly: '#6BAD72',
};

interface VideoDetailsProps {
  memories: Memory[];
  memoryId: string;
  favorites: Set<string>;
  watched: Map<string, number>;
  onPlay: (id: string) => void;
  onDetails: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onBack: () => void;
  note?: string;
  onSaveNote?: (id: string, note: string) => void;
  moods?: string[];
  onSetMoods?: (id: string, moods: string[]) => void;
}

export default function VideoDetails({ memories, memoryId, favorites, watched, onPlay, onDetails, onToggleFavorite, onBack, note = '', onSaveNote, moods = [], onSetMoods }: VideoDetailsProps) {
  const [localNote, setLocalNote] = useState(note);
  const [noteSaved, setNoteSaved] = useState(false);
  const memory = memories.find((m) => m.id === memoryId) ?? memories[0];
  const watchedSec = watched.get(memory.id);
  const isPartial = watchedSec != null && watchedSec > 0 && watchedSec < memory.durationSec * 0.95;
  const isFav = favorites.has(memory.id);
  const related = memories.filter((m) => m.category === memory.category && m.id !== memory.id).slice(0, 4);

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Backdrop hero */}
      <div className="relative" style={{ height: '65vh', minHeight: '420px' }}>
        <img src={memory.backdropUrl} alt={memory.title} className="absolute inset-0 w-full h-full object-cover" style={{ transition: 'none' }} />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, rgba(9,9,9,0.95) 35%, rgba(9,9,9,0.5) 65%, transparent 100%), linear-gradient(to top, rgba(9,9,9,1) 0%, rgba(9,9,9,0.5) 40%, transparent 70%)',
          }}
        />

        <button
          onClick={onBack}
          className="absolute top-20 left-4 sm:left-8 lg:left-16 flex items-center gap-2 text-sm"
          style={{ color: 'rgba(255,255,255,0.55)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'white'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6" /></svg>
          Back
        </button>

        <div className="absolute inset-0 flex flex-col justify-end px-4 sm:px-8 lg:px-16 pb-8 sm:pb-12">
          <div className="text-xs font-semibold mb-2 tracking-widest" style={{ color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            {memory.category}
          </div>
          <h1 className="font-display font-bold leading-tight mb-3" style={{ color: 'var(--text-inverse)', fontSize: 'clamp(1.6rem, 4vw, 3.2rem)' }}>{memory.title}</h1>
          <div className="flex items-center gap-2 sm:gap-4 mb-4 text-xs sm:text-sm flex-wrap" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <span>{memory.date}</span><span>·</span><span>{memory.duration}</span>
            {memory.location && <><span>·</span><span className="hidden sm:inline">{memory.location}</span></>}
          </div>
          <p className="text-sm sm:text-base mb-6 max-w-xl leading-relaxed hidden sm:block" style={{ color: 'rgba(255,255,255,0.68)' }}>{memory.description}</p>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => onPlay(memory.id)}
              className="flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-sm font-semibold"
              style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--btn-primary-bg)'; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
              {isPartial ? `Resume` : 'Play'}
            </button>

            <button
              onClick={() => onToggleFavorite(memory.id)}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full text-sm font-medium"
              style={{
                background: isFav ? 'rgba(183,71,90,0.2)' : 'rgba(255,255,255,0.1)',
                color: isFav ? 'var(--accent)' : 'rgba(255,255,255,0.7)',
                border: isFav ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span className="hidden sm:inline">{isFav ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Below-hero */}
      <div className="px-4 sm:px-8 lg:px-16 py-8 sm:py-10">
        {/* Description on mobile (hidden in hero) */}
        <p className="text-sm leading-relaxed mb-6 sm:hidden" style={{ color: 'var(--text-secondary)' }}>{memory.description}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-16">
          <div>
            <h2 className="text-xs font-semibold mb-5 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>About This Memory</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                { label: 'Date', value: memory.date },
                { label: 'Category', value: memory.category },
                { label: 'Length', value: memory.duration },
                ...(memory.location ? [{ label: 'Location', value: memory.location }] : []),
              ].map((item) => (
                <div key={item.label}>
                  <div className="text-xs mb-1 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {isPartial && (
            <div>
              <h2 className="text-xs font-semibold mb-5 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Your Progress</h2>
              <div className="flex items-center gap-3 mb-2">
                <div style={{ flex: 1, height: '4px', background: 'var(--progress-remaining)', borderRadius: '2px' }}>
                  <div style={{ width: `${(watchedSec! / memory.durationSec) * 100}%`, height: '100%', background: 'var(--progress-played)', borderRadius: '2px' }} />
                </div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{Math.round((watchedSec! / memory.durationSec) * 100)}%</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatTime(watchedSec!)} watched · {formatTime(memory.durationSec - watchedSec!)} remaining</p>
            </div>
          )}
        </div>

        {/* Mood tags */}
        <div className="mt-10 pt-8" style={{ borderTop: '1px solid var(--border)' }}>
          <h2 className="text-xs font-semibold mb-4 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Mood</h2>
          <div className="flex flex-wrap gap-2">
            {MOOD_OPTIONS.map((mood) => {
              const active = moods.includes(mood);
              const color = MOOD_COLORS[mood] ?? 'var(--accent)';
              return (
                <button
                  key={mood}
                  onClick={() => {
                    const next = active ? moods.filter((m) => m !== mood) : [...moods, mood];
                    onSetMoods?.(memory.id, next);
                  }}
                  className="px-3.5 py-1.5 rounded-full text-sm font-medium"
                  style={{
                    background: active ? `${color}22` : 'var(--bg-card)',
                    color: active ? color : 'var(--text-secondary)',
                    border: active ? `1px solid ${color}66` : '1px solid var(--border)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {mood}
                </button>
              );
            })}
          </div>
        </div>

        {/* Personal note */}
        <div className="mt-8 pt-8" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Your Note</h2>
            {noteSaved && (
              <span className="text-xs flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12" /></svg>
                Saved
              </span>
            )}
          </div>
          <textarea
            value={localNote}
            onChange={(e) => { setLocalNote(e.target.value); setNoteSaved(false); }}
            onBlur={() => { if (onSaveNote) { onSaveNote(memory.id, localNote); setNoteSaved(true); setTimeout(() => setNoteSaved(false), 2500); } }}
            placeholder="Write something about this memory — how it felt, what you want to remember..."
            rows={4}
            className="w-full text-sm leading-relaxed rounded-xl resize-none outline-none px-4 py-3"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; }}
            onBlurCapture={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Saved automatically when you click away</p>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{localNote.length} chars</span>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-10 sm:mt-12">
            <h2 className="text-base font-semibold mb-5" style={{ color: 'var(--text-primary)', letterSpacing: '0.03em' }}>More Like This</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {related.map((m) => (
                <MemoryCard key={m.id} memory={m} isFavorite={favorites.has(m.id)} watchedSec={watched.get(m.id)} onPlay={onPlay} onDetails={onDetails} onToggleFavorite={onToggleFavorite} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useRef } from 'react';
import { Memory } from '@/data/memories';

interface TimelineProps {
  memories: Memory[];
  favorites: Set<string>;
  watched: Map<string, number>;
  onDetails: (id: string) => void;
  onPlay: (id: string) => void;
}

const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function groupByMonth(memories: Memory[]) {
  const sorted = [...memories].sort((a, b) => b.dateSort.localeCompare(a.dateSort));
  const groups: { key: string; year: string; month: string; memories: Memory[] }[] = [];
  for (const m of sorted) {
    const [year, monthIdx] = m.dateSort.split('-');
    const month = FULL_MONTHS[parseInt(monthIdx) - 1];
    const key = `${year}-${monthIdx}`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.memories.push(m);
    } else {
      groups.push({ key, year, month, memories: [m] });
    }
  }
  return groups;
}

const CATEGORY_COLORS: Record<string, string> = {
  Monthsaries: '#B7475A',
  Dates: '#7B68EE',
  Adventures: '#E08940',
  Messages: '#4A9B8E',
  'Funny Moments': '#D4A84B',
  'Special Days': '#C06BA0',
};

export default function Timeline({ memories, favorites, watched, onDetails, onPlay }: TimelineProps) {
  const groups = groupByMonth(memories);

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingTop: '3.5rem' }}>
      <div className="px-4 sm:px-8 lg:px-16 pt-10 pb-16">

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Our Story</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Timeline</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Every moment, in the order we lived them.</p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div
            className="absolute left-0 sm:left-28 top-0 bottom-0 w-px"
            style={{ background: 'linear-gradient(to bottom, var(--accent) 0%, var(--border) 40%, var(--border) 90%, transparent 100%)', opacity: 0.4 }}
          />

          <div className="flex flex-col gap-0">
            {groups.map((group, gi) => (
              <div key={group.key}>
                {/* Month / Year header */}
                <div className="relative flex items-center gap-4 mb-6" style={{ paddingTop: gi === 0 ? 0 : '2.5rem' }}>
                  {/* Left spacer for line */}
                  <div className="hidden sm:block flex-shrink-0" style={{ width: '112px' }} />

                  {/* Dot on the line */}
                  <div
                    className="absolute left-0 sm:left-28 -translate-x-1/2 w-3 h-3 rounded-full border-2 z-10"
                    style={{ background: 'var(--bg-primary)', borderColor: 'var(--accent)' }}
                  />

                  <div className="pl-6 sm:pl-0">
                    <span className="font-display text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {group.month}
                    </span>
                    {(gi === 0 || groups[gi - 1]?.year !== group.year) && (
                      <span className="ml-2 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{group.year}</span>
                    )}
                  </div>
                </div>

                {/* Memories in this month */}
                <div className="flex flex-col gap-3 pl-0 sm:pl-36">
                  {group.memories.map((m) => {
                    const watchedSec = watched.get(m.id);
                    const progress = watchedSec != null ? watchedSec / m.durationSec : null;
                    const completed = progress != null && progress >= 0.95;
                    const catColor = CATEGORY_COLORS[m.category] ?? 'var(--accent)';

                    return (
                      <TimelineCard
                        key={m.id}
                        memory={m}
                        isFavorite={favorites.has(m.id)}
                        progress={progress}
                        completed={completed}
                        catColor={catColor}
                        onDetails={onDetails}
                        onPlay={onPlay}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* End cap */}
          <div className="relative flex items-center mt-10">
            <div className="hidden sm:block flex-shrink-0" style={{ width: '112px' }} />
            <div
              className="absolute left-0 sm:left-28 -translate-x-1/2 w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: 'var(--accent-dim)', border: '2px solid var(--accent)' }}
            >
              <svg width="8" height="8" viewBox="0 0 24 24" fill="var(--accent)">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <p className="pl-8 sm:pl-4 text-sm" style={{ color: 'var(--text-muted)' }}>Where it all began ♡</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TimelineCardProps {
  memory: Memory;
  isFavorite: boolean;
  progress: number | null;
  completed: boolean;
  catColor: string;
  onDetails: (id: string) => void;
  onPlay: (id: string) => void;
}

function TimelineCard({ memory, isFavorite, progress, completed, catColor, onDetails, onPlay }: TimelineCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      onClick={() => onDetails(memory.id)}
      className="group cursor-pointer rounded-xl overflow-hidden flex gap-0"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-hover)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      {/* Accent stripe */}
      <div className="w-0.5 flex-shrink-0" style={{ background: catColor }} />

      {/* Thumbnail */}
      <div className="relative flex-shrink-0" style={{ width: '120px', height: '68px' }}>
        <img
          src={memory.thumbnail}
          alt={memory.title}
          className="w-full h-full object-cover"
          style={{ transition: 'none' }}
        />
        {/* Progress bar */}
        {progress != null && !completed && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'var(--progress-remaining)' }}>
            <div style={{ width: `${progress * 100}%`, height: '100%', background: 'var(--progress-played)' }} />
          </div>
        )}
        {completed && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12" /></svg>
          </div>
        )}
        {/* Play button on hover */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100"
          style={{ background: 'rgba(0,0,0,0.45)', transition: 'opacity 0.15s ease' }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onPlay(memory.id); }}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--accent)' }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 px-4 py-3 flex flex-col justify-between min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate leading-tight" style={{ color: 'var(--text-primary)' }}>{memory.title}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: `${catColor}20`, color: catColor }}
              >
                {memory.category}
              </span>
              {memory.location && (
                <span className="text-xs flex items-center gap-1 hidden sm:flex" style={{ color: 'var(--text-muted)' }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  {memory.location}
                </span>
              )}
            </div>
          </div>
          {isFavorite && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--accent)" stroke="none" className="flex-shrink-0 mt-0.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{memory.date}</span>
          <span style={{ color: 'var(--border-strong)', fontSize: '10px' }}>·</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{memory.duration}</span>
          {progress != null && !completed && (
            <>
              <span style={{ color: 'var(--border-strong)', fontSize: '10px' }}>·</span>
              <span className="text-xs" style={{ color: 'var(--accent)' }}>{Math.round(progress * 100)}% watched</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

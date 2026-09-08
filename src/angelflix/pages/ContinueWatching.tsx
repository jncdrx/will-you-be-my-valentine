import { Memory, formatTime } from '@/data/memories';
import { netflixSound } from '../../lib/netflixSound';

interface ContinueWatchingProps {
  memories: Memory[];
  favorites: Set<string>;
  watched: Map<string, number>;
  onPlay: (id: string) => void;
  onDetails: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export default function ContinueWatching({ memories, favorites, watched, onPlay, onDetails, onToggleFavorite }: ContinueWatchingProps) {
  const inProgress = memories.filter((m) => {
    const sec = watched.get(m.id);
    return sec != null && sec > 0 && sec < m.durationSec * 0.95;
  });
  const completed = memories.filter((m) => {
    const sec = watched.get(m.id);
    return sec != null && sec >= m.durationSec * 0.95;
  });

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingTop: '4rem' }}>
      <div className="px-4 sm:px-8 lg:px-16 pt-10 pb-16">
        <div className="mb-10">
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Continue Watching</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-base">Pick up where we left off.</p>
        </div>

        {inProgress.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12" /></svg>
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>You're all caught up</h3>
            <p style={{ color: 'var(--text-secondary)' }} className="text-sm">Start another memory whenever you feel like going back.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:gap-5 mb-12">
            {inProgress.map((m) => {
              const sec = watched.get(m.id) ?? 0;
              const progress = sec / m.durationSec;
              const remaining = m.durationSec - sec;

              return (
                <div key={m.id} className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  {/* Mobile: stacked; desktop: side-by-side */}
                  <div className="flex flex-col sm:flex-row">
                    {/* Thumbnail — mobile: top aspect-ratio block, desktop: fixed sidebar */}
                    <div className="relative flex-shrink-0 sm:w-72">
                      {/* Mobile */}
                      <div className="sm:hidden relative" style={{ paddingBottom: '56.25%' }}>
                        <img src={m.thumbnail} alt={m.title} className="absolute inset-0 w-full h-full object-cover" style={{ transition: 'none' }} />
                        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'var(--progress-remaining)' }}>
                          <div style={{ width: `${progress * 100}%`, height: '100%', background: 'var(--progress-played)' }} />
                        </div>
                      </div>
                      {/* Desktop */}
                      <div className="hidden sm:block" style={{ width: '288px', height: '162px', position: 'relative' }}>
                        <img src={m.thumbnail} alt={m.title} className="absolute inset-0 w-full h-full object-cover" style={{ transition: 'none' }} />
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, transparent 55%, var(--bg-card) 100%)' }} />
                        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'var(--progress-remaining)' }}>
                          <div style={{ width: `${progress * 100}%`, height: '100%', background: 'var(--progress-played)' }} />
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 p-4 sm:py-5 sm:pr-6 flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-medium mb-1" style={{ color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{m.category}</div>
                        <h3 className="font-display text-lg sm:text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{m.title}</h3>
                        <p style={{ color: 'var(--text-secondary)' }} className="text-sm mb-3">{m.date} · {m.duration}</p>

                        <div className="flex items-center gap-3 mb-4">
                          <div style={{ flex: 1, height: '3px', background: 'var(--progress-remaining)', borderRadius: '2px' }}>
                            <div style={{ width: `${progress * 100}%`, height: '100%', background: 'var(--progress-played)', borderRadius: '2px' }} />
                          </div>
                          <span className="text-xs flex-shrink-0 hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
                            {formatTime(sec)} · {formatTime(remaining)} left
                          </span>
                          <span className="text-xs flex-shrink-0 sm:hidden" style={{ color: 'var(--text-muted)' }}>
                            {formatTime(remaining)} left
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <button
                          onClick={() => {
                            netflixSound.playSelect();
                            onPlay(m.id);
                          }}
                          className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-sm font-semibold"
                          style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--btn-primary-bg)'; }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
                          Resume
                        </button>
                        <button
                          onClick={() => {
                            netflixSound.playSelect();
                            onPlay(m.id);
                          }}
                          className="px-4 sm:px-5 py-2.5 rounded-full text-sm font-medium"
                          style={{ background: 'var(--btn-secondary-bg)', color: 'var(--btn-secondary-text)', border: '1px solid var(--btn-secondary-border)' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--btn-secondary-text)'; }}
                        >
                          Start Again
                        </button>
                        <button
                          onClick={() => {
                            netflixSound.playSelect();
                            onDetails(m.id);
                          }}
                          className="px-4 py-2.5 rounded-full text-sm font-medium hidden sm:block"
                          style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
                        >
                          Details
                        </button>
                        <button
                          onClick={() => {
                            netflixSound.playPop();
                            onToggleFavorite(m.id);
                          }}
                          className="ml-auto w-9 h-9 flex items-center justify-center rounded-full"
                          style={{ color: favorites.has(m.id) ? 'var(--accent)' : 'var(--text-muted)', border: '1px solid var(--border)' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill={favorites.has(m.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {completed.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold mb-4 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
              Watched Recently
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {completed.map((m) => (
                <button key={m.id} onClick={() => onDetails(m.id)} className="relative rounded-xl overflow-hidden text-left group" style={{ border: '1px solid var(--border)' }}>
                  <div style={{ paddingBottom: '56.25%', position: 'relative' }}>
                    <img src={m.thumbnail} alt={m.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105" style={{ transition: 'transform 0.3s ease' }} />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }} />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium" style={{ background: 'rgba(0,0,0,0.45)', color: 'rgba(255,255,255,0.8)' }}>Watched</div>
                    <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'var(--progress-played)', opacity: 0.5 }} />
                  </div>
                  <div className="px-3 py-2.5" style={{ background: 'var(--bg-card)' }}>
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{m.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{m.duration}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

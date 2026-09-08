import { useRef, useState, useEffect } from 'react';
import { Memory } from '@/data/memories';
import MemoryCard from '@/components/MemoryCard';
import { Page } from '@/components/Navbar';
import { useInView } from '@/hooks/useInView';
import { useCountUp } from '@/hooks/useCountUp';
import { netflixSound } from '../../lib/netflixSound';

const START_DATE = new Date('2026-01-07');
const NEXT_MONTHSARY_DAY = 7;

const QUOTES = [
  { text: "In all the world, there is no heart for me like yours.", author: "Maya Angelou" },
  { text: "I love you not only for what you are, but for what I am when I am with you.", author: "Roy Croft" },
  { text: "Whatever our souls are made of, his and mine are the same.", author: "Emily Brontë" },
  { text: "You are my today and all of my tomorrows.", author: "Leo Christopher" },
  { text: "The best thing to hold onto in life is each other.", author: "Audrey Hepburn" },
  { text: "I choose you. And I'll choose you over and over. Without pause, without a doubt.", author: "Unknown" },
  { text: "You make ordinary moments feel like the most beautiful thing.", author: "Unknown" },
];

function daysUntilNextMonthsary() {
  const now = new Date();
  let next = new Date(now.getFullYear(), now.getMonth(), NEXT_MONTHSARY_DAY);
  if (next <= now) next = new Date(now.getFullYear(), now.getMonth() + 1, NEXT_MONTHSARY_DAY);
  return Math.ceil((next.getTime() - now.getTime()) / 86400000);
}

function daysTogether() {
  return Math.floor((Date.now() - START_DATE.getTime()) / 86400000);
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

function totalDuration(memories: Memory[]) {
  const sec = memories.reduce((s, m) => s + m.durationSec, 0);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

interface HomeProps {
  memories: Memory[];
  favorites: Set<string>;
  watched: Map<string, number>;
  onPlay: (id: string) => void;
  onDetails: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onNavigate: (page: Page) => void;
  onSurpriseMe?: () => void;
}

const CYCLE_MS = 6000;

export default function Home({ memories, favorites, watched, onPlay, onDetails, onToggleFavorite, onNavigate, onSurpriseMe }: HomeProps) {
  const hasMemories = memories.length > 0;
  const FEATURED = hasMemories ? [memories[0], memories[2], memories[6] ?? memories[0]].filter(Boolean) : [];
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [heroFading, setHeroFading] = useState(false);
  const cycleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const { ref: recentRef, inView: recentIn } = useInView();
  const { ref: continueRef, inView: continueIn } = useInView();
  const { ref: collectionsRef, inView: collectionsIn } = useInView();
  const { ref: statsRef, inView: statsIn } = useInView(0.3);

  const memoriesCount = useCountUp(memories.length, 800, statsIn);
  const daysCount = useCountUp(daysTogether(), 1200, statsIn);
  const monthsaryCount = useCountUp(daysUntilNextMonthsary(), 800, statsIn);

  const featured = FEATURED[featuredIdx] || (hasMemories ? memories[0] : null);

  const goTo = (idx: number) => {
    if (idx === featuredIdx || FEATURED.length === 0) return;
    setHeroFading(true);
    setTimeout(() => { setFeaturedIdx(idx); setHeroFading(false); }, 280);
  };

  const resetCycle = () => {
    if (cycleTimer.current) clearTimeout(cycleTimer.current);
    if (FEATURED.length > 1) {
      cycleTimer.current = setTimeout(() => { goTo((featuredIdx + 1) % FEATURED.length); }, CYCLE_MS);
    }
  };

  useEffect(() => {
    resetCycle();
    return () => { if (cycleTimer.current) clearTimeout(cycleTimer.current); };
  }, [featuredIdx, FEATURED.length]);

  const scroll = (dir: 'left' | 'right') => {
    rowRef.current?.scrollBy({ left: dir === 'right' ? 680 : -680, behavior: 'smooth' });
  };

  const [quoteIdx, setQuoteIdx] = useState(() => new Date().getDay() % QUOTES.length);

  const continueItems = Array.from(watched.entries()).filter(([id, sec]) => {
    const mem = memories.find((m) => m.id === id);
    return mem && sec > 0 && sec < mem.durationSec * 0.95;
  });

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Hero */}
      {!featured ? (
        <div className="relative flex flex-col justify-center items-center text-center px-4 sm:px-8 min-h-[65vh] pt-20"
          style={{
            background: 'linear-gradient(to bottom, rgba(183,71,90,0.12) 0%, transparent 100%)',
          }}
        >
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-3xl mb-4 shadow-xl">
            🎬
          </div>
          <div
            className="text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full mb-3"
            style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(183,71,90,0.3)' }}
          >
            ANGELFLIX CINEMA
          </div>
          <h1
            className="font-display font-bold leading-tight mb-3"
            style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.8rem, 4vw, 3.5rem)', letterSpacing: '-0.02em' }}
          >
            Our Private Cinema
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm sm:text-base max-w-lg mb-8 leading-relaxed">
            Your uploaded video memories and special moments will appear here.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('memories')}
              className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold shadow-lg transition-all hover:scale-105 active:scale-95"
              style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
            >
              <span>▦</span> Explore Memories
            </button>
            <button
              onClick={() => onNavigate('search')}
              className="px-5 py-3 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'var(--btn-secondary-bg)',
                color: 'var(--btn-secondary-text)',
                border: '1px solid var(--btn-secondary-border)',
              }}
            >
              Search
            </button>
          </div>
        </div>
      ) : (
        <div className="relative" style={{ height: '88vh', minHeight: '520px' }}>
          <img
            key={featured.id}
            src={featured.backdropUrl}
            alt={featured.title}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transition: 'none', opacity: heroFading ? 0 : 1, transitionProperty: 'opacity', transitionDuration: '280ms', transitionTimingFunction: 'ease' }}
          />

          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to right, rgba(9,9,9,0.93) 28%, rgba(9,9,9,0.35) 65%, transparent 100%), ' +
                'linear-gradient(to top, rgba(9,9,9,1) 0%, rgba(9,9,9,0.35) 38%, transparent 65%)',
            }}
          />

          <div
            className="absolute inset-0 flex flex-col justify-center px-4 sm:px-8 lg:px-16"
            style={{ paddingTop: '5rem', opacity: heroFading ? 0 : 1, transition: 'opacity 280ms ease' }}
          >
            <div className="text-sm font-medium mb-3 hidden sm:block" style={{ color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em' }}>
              {getGreeting()}, Angel ♡
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span
                className="text-xs font-semibold tracking-widest uppercase px-2.5 py-1 rounded-full"
                style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(183,71,90,0.3)' }}
              >
                {featured.category}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
              <span style={{ color: 'rgba(255,255,255,0.45)' }} className="text-sm hidden sm:inline">{featured.date}</span>
            </div>

          <h1
            className="font-display font-bold leading-tight mb-3 max-w-2xl"
            style={{ color: 'var(--text-inverse)', fontSize: 'clamp(1.8rem, 5vw, 4rem)', letterSpacing: '-0.02em' }}
          >
            {featured.title}
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.65)' }} className="text-sm sm:text-base max-w-lg mb-6 leading-relaxed hidden sm:block">
            {featured.description}
          </p>

          <div className="flex items-center gap-2 sm:gap-3 mb-8 flex-wrap">
            <button
              onClick={() => {
                netflixSound.playSelect();
                onPlay(featured.id);
              }}
              className="flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-sm font-semibold"
              style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--btn-primary-bg)'; (e.currentTarget as HTMLElement).style.color = 'var(--btn-primary-text)'; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
              Watch Now
            </button>

            <button
              onClick={() => {
                netflixSound.playSelect();
                onDetails(featured.id);
              }}
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.18)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Details
            </button>

            <button
              onClick={() => {
                netflixSound.playPop();
                onToggleFavorite(featured.id);
              }}
              className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: favorites.has(featured.id) ? 'var(--accent)' : 'rgba(255,255,255,0.6)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.14)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill={favorites.has(featured.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>

            {onSurpriseMe && (
              <button
                onClick={() => {
                  netflixSound.playClick();
                  onSurpriseMe();
                }}
                className="hidden sm:flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.1)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)'; }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
                </svg>
                Surprise Me
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {FEATURED.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  netflixSound.playClick();
                  goTo(i);
                  resetCycle();
                }}
                className="rounded-full"
                style={{ width: i === featuredIdx ? '24px' : '6px', height: '6px', background: i === featuredIdx ? 'var(--accent)' : 'rgba(255,255,255,0.3)', transition: 'width 300ms ease, background 300ms ease' }}
              />
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Scrollable content */}
      <div style={{ background: 'var(--bg-primary)' }} className={`relative ${featured ? '-mt-20' : 'mt-2'} z-10 pb-16`}>

        {/* Stats strip */}
        <div ref={statsRef} className="px-4 sm:px-8 lg:px-16 pt-8 pb-2">
          <div
            className="flex items-center justify-around gap-2 sm:gap-0 rounded-2xl flex-wrap"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '16px 24px' }}
          >
            {[
              { value: String(memoriesCount), label: 'Memories', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-4 0v2" /></svg> },
              { value: totalDuration(memories), label: 'Together', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></svg> },
              { value: String(daysCount), label: 'Days Together', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg> },
              { value: `${monthsaryCount}d`, label: 'To Next Monthsary', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
            ].map((stat, i, arr) => (
              <div key={stat.label} className="flex items-center gap-6">
                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center gap-1.5 mb-1" style={{ color: 'var(--accent)' }}>{stat.icon}</div>
                  <div className="font-display text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{stat.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
                </div>
                {i < arr.length - 1 && <div className="hidden sm:block h-8 w-px" style={{ background: 'var(--border)' }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Memories */}
        <div ref={recentRef} className={`px-4 sm:px-8 lg:px-16 pt-8 reveal ${recentIn ? 'visible' : ''}`}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold tracking-wider uppercase" style={{ color: 'var(--text-muted)', fontSize: '11px', letterSpacing: '0.1em' }}>
              Recent Memories
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={() => scroll('left')} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6" /></svg>
              </button>
              <button onClick={() => scroll('right')} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,18 15,12 9,6" /></svg>
              </button>
            </div>
          </div>
          <div ref={rowRef} className="flex gap-3 sm:gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {memories.slice(0, 8).map((m, i) => (
              <div key={m.id} style={{ width: 'clamp(200px, 50vw, 272px)', flexShrink: 0 }} className={`reveal reveal-d${Math.min(i + 1, 3) as 1|2|3} ${recentIn ? 'visible' : ''}`}>
                <MemoryCard memory={m} isFavorite={favorites.has(m.id)} watchedSec={watched.get(m.id)} onPlay={onPlay} onDetails={onDetails} onToggleFavorite={onToggleFavorite} />
              </div>
            ))}
          </div>
        </div>

        {/* Continue Watching */}
        {continueItems.length > 0 && (
          <div ref={continueRef} className={`px-4 sm:px-8 lg:px-16 pt-10 reveal ${continueIn ? 'visible' : ''}`}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold tracking-wider uppercase" style={{ color: 'var(--text-muted)', fontSize: '11px', letterSpacing: '0.1em' }}>Continue Watching</h2>
              <button onClick={() => onNavigate('continue')} style={{ color: 'var(--text-secondary)', fontSize: '12px' }} className="hover:underline">See all →</button>
            </div>
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {continueItems.map(([id, sec], i) => {
                const mem = memories.find((m) => m.id === id)!;
                return (
                  <div key={id} style={{ width: 'clamp(200px, 50vw, 272px)', flexShrink: 0 }} className={`reveal reveal-d${Math.min(i + 1, 3) as 1|2|3} ${continueIn ? 'visible' : ''}`}>
                    <MemoryCard memory={mem} isFavorite={favorites.has(id)} watchedSec={sec} onPlay={onPlay} onDetails={onDetails} onToggleFavorite={onToggleFavorite} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Collections */}
        <div ref={collectionsRef} className={`px-4 sm:px-8 lg:px-16 pt-10 reveal ${collectionsIn ? 'visible' : ''}`}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold tracking-wider uppercase" style={{ color: 'var(--text-muted)', fontSize: '11px', letterSpacing: '0.1em' }}>Browse Collections</h2>
            <button onClick={() => onNavigate('collections')} style={{ color: 'var(--text-secondary)', fontSize: '12px' }} className="hover:underline">See all →</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[
              { name: 'Our Monthsaries', img: 'https://images.unsplash.com/photo-1556229868-7b2d4b56b909?w=600&h=320&fit=crop', count: 2 },
              { name: 'Our Adventures',  img: 'https://images.unsplash.com/photo-1542460533-50ac46fb13d7?w=600&h=320&fit=crop', count: 2 },
              { name: 'Messages For You', img: 'https://images.unsplash.com/photo-1578660692094-da697dfc1c78?w=600&h=320&fit=crop', count: 1 },
            ].map((col, i) => (
              <button
                key={col.name}
                onClick={() => onNavigate('collections')}
                className={`relative rounded-xl overflow-hidden text-left group reveal reveal-d${Math.min(i + 1, 3) as 1|2|3} ${collectionsIn ? 'visible' : ''}`}
                style={{ height: '140px', border: '1px solid var(--border)' }}
              >
                <img src={col.img} alt={col.name} className="absolute inset-0 w-full h-full object-cover" style={{ transition: 'transform 0.5s ease' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.06)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'; }}
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.25) 60%, transparent 100%)' }} />
                <div className="absolute bottom-0 left-0 p-4">
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-inverse)' }}>{col.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{col.count} memories</div>
                </div>
              </button>
            ))}
          </div>
        </div>
        {/* Love quote */}
        <div className="px-4 sm:px-8 lg:px-16 pt-10">
          <div
            className="relative rounded-2xl overflow-hidden flex flex-col items-center justify-center text-center px-8 sm:px-16 py-12"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            {/* Decorative quotes */}
            <div className="absolute top-6 left-8 font-display text-7xl sm:text-9xl leading-none select-none" style={{ color: 'var(--accent)', opacity: 0.07 }}>&ldquo;</div>
            <div className="absolute bottom-2 right-8 font-display text-7xl sm:text-9xl leading-none select-none" style={{ color: 'var(--accent)', opacity: 0.07 }}>&rdquo;</div>

            <div className="flex items-center gap-2 mb-6">
              <div className="h-px w-8" style={{ background: 'var(--accent)', opacity: 0.5 }} />
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--accent)', opacity: 0.7 }}>Today's Quote</span>
              <div className="h-px w-8" style={{ background: 'var(--accent)', opacity: 0.5 }} />
            </div>

            <blockquote className="font-display text-lg sm:text-2xl font-medium leading-relaxed max-w-2xl mb-4 relative z-10" style={{ color: 'var(--text-primary)' }}>
              "{QUOTES[quoteIdx].text}"
            </blockquote>
            <cite className="text-sm not-italic" style={{ color: 'var(--text-muted)' }}>— {QUOTES[quoteIdx].author}</cite>

            {/* Next quote button */}
            <button
              onClick={() => setQuoteIdx((i) => (i + 1) % QUOTES.length)}
              className="mt-6 flex items-center gap-2 text-xs px-3 py-1.5 rounded-full"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17,1 21,5 17,9" /><path d="M3,11V9a4,4 0 0,1 4-4h14" /><polyline points="7,23 3,19 7,15" /><path d="M21,13v2a4,4 0 0,1-4,4H3" /></svg>
              Another quote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

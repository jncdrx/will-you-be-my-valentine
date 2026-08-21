import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme, ThemePreference } from '@/hooks/useTheme';
import { useScrolled } from '@/hooks/useScrolled';
import { MEMORIES, Memory } from '@/data/memories';
import { getCustomMemories } from '@/lib/store';
import Navbar, { Page } from '@/components/Navbar';
import Toast, { ToastData } from '@/components/Toast';
import Home from '@/pages/Home';
import OurMemories from '@/pages/OurMemories';
import ContinueWatching from '@/pages/ContinueWatching';
import Favorites from '@/pages/Favorites';
import Search from '@/pages/Search';
import VideoDetails from '@/pages/VideoDetails';
import VideoPlayer from '@/pages/VideoPlayer';
import Collections from '@/pages/Collections';
import Timeline from '@/pages/Timeline';

let toastCounter = 0;

const MOBILE_NAV: { page: Page; label: string; icon: (active: boolean) => React.ReactElement }[] = [
  {
    page: 'home',
    label: 'Home',
    icon: (a) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" /><polyline points="9,21 9,12 15,12 15,21" />
      </svg>
    ),
  },
  {
    page: 'memories',
    label: 'Memories',
    icon: (a) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-4 0v2" />
      </svg>
    ),
  },
  {
    page: 'continue',
    label: 'Continue',
    icon: (a) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polygon points="10,8 16,12 10,16" fill="currentColor" />
      </svg>
    ),
  },
  {
    page: 'favorites',
    label: 'Saved',
    icon: (a) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    page: 'search',
    label: 'Search',
    icon: (a) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
];

const FADE_MS = 140;

export default function App() {
  const { preference: themePref, setPreference: setThemePref } = useTheme();
  const scrolled = useScrolled(60);

  // `page` = what the navbar highlights (updates instantly).
  // `renderedPage` = what's actually rendered (updates after the fade-out).
  const [page, setPage] = useState<Page>('home');
  const [renderedPage, setRenderedPage] = useState<Page>('home');
  const [fading, setFading] = useState(false);

  const [memories, setMemories] = useState<Memory[]>(() => [...MEMORIES, ...getCustomMemories()]);

  // Re-merge when window regains focus (user may have uploaded in admin tab)
  useEffect(() => {
    const onFocus = () => setMemories([...MEMORIES, ...getCustomMemories()]);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const [selectedId, setSelectedId] = useState<string>('1');
  const [prevPage, setPrevPage] = useState<Page>('home');
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['1', '3']));
  const [watched, setWatched] = useState<Map<string, number>>(
    new Map([['2', 320], ['5', 600]])
  );
  const [toast, setToast] = useState<ToastData | null>(null);
  const [notes, setNotes] = useState<Map<string, string>>(new Map());
  const [moods, setMoods] = useState<Map<string, string[]>>(new Map());
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const transitionTo = useCallback((target: Page, extraSetup?: () => void) => {
    if (fadeTimer.current) clearTimeout(fadeTimer.current);

    // Navbar active indicator updates immediately
    setPage(target);

    setFading(true);
    fadeTimer.current = setTimeout(() => {
      extraSetup?.();
      setRenderedPage(target);
      window.scrollTo({ top: 0 });
      setFading(false);
    }, FADE_MS);
  }, []);

  // Cmd+K / Ctrl+K → search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        navigate('search');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const showToast = (message: string, icon: ToastData['icon']) => {
    toastCounter += 1;
    setToast({ id: toastCounter, message, icon });
  };

  const navigate = (target: Page) => {
    if (target === page && target === renderedPage) return;
    setPrevPage(page);
    transitionTo(target);
  };

  const handlePlay = (id: string) => {
    setSelectedId(id);
    setPrevPage(page);
    setPage('player');
    setRenderedPage('player');
  };

  const handleDetails = (id: string) => {
    setPrevPage(page);
    transitionTo('details', () => setSelectedId(id));
  };

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast('Removed from favorites', 'heart-off');
      } else {
        next.add(id);
        showToast('Saved to favorites', 'heart');
      }
      return next;
    });
  };

  const handleUpdateWatched = (id: string, sec: number) => {
    setWatched((prev) => new Map(prev).set(id, sec));
  };

  const handleSaveNote = (id: string, note: string) => {
    setNotes((prev) => new Map(prev).set(id, note));
  };

  const handleSetMoods = (id: string, tags: string[]) => {
    setMoods((prev) => new Map(prev).set(id, tags));
  };

  const handleBack = () => {
    const target = prevPage === 'player' ? 'home' : prevPage;
    transitionTo(target);
  };

  const handleSurpriseMe = () => {
    const random = memories[Math.floor(Math.random() * memories.length)];
    showToast(`How about "${random.title}"?`, 'heart');
    setPrevPage(page);
    transitionTo('details', () => setSelectedId(random.id));
  };

  const sharedCardProps = {
    memories,
    favorites,
    watched,
    onPlay: handlePlay,
    onDetails: handleDetails,
    onToggleFavorite: handleToggleFavorite,
  };

  const navTransparent = renderedPage === 'home' && !scrolled;
  const mobileNavPages: Page[] = ['home', 'memories', 'continue', 'favorites', 'search', 'timeline', 'collections'];
  const showMobileNav = mobileNavPages.includes(page);

  if (renderedPage === 'player') {
    return (
      <VideoPlayer
        memories={memories}
        memoryId={selectedId}
        watched={watched}
        onBack={handleBack}
        onUpdateWatched={handleUpdateWatched}
        onPlayNext={(id) => { setSelectedId(id); }}
      />
    );
  }

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Navbar
        currentPage={page}
        onNavigate={navigate}
        transparent={navTransparent}
        themePref={themePref}
        onThemeChange={(p: ThemePreference) => setThemePref(p)}
      />

      <div
        style={{
          opacity: fading ? 0 : 1,
          transition: `opacity ${FADE_MS}ms ease`,
          background: 'var(--bg-primary)',
          minHeight: '100vh',
        }}
        className={showMobileNav ? 'pb-20' : ''}
      >
        {renderedPage === 'home'        && <Home        {...sharedCardProps} onNavigate={navigate} onSurpriseMe={handleSurpriseMe} />}
        {renderedPage === 'memories'    && <OurMemories {...sharedCardProps} />}
        {renderedPage === 'continue'    && <ContinueWatching {...sharedCardProps} />}
        {renderedPage === 'favorites'   && <Favorites   {...sharedCardProps} onNavigate={navigate} />}
        {renderedPage === 'search'      && <Search      {...sharedCardProps} />}
        {renderedPage === 'details'     && <VideoDetails memoryId={selectedId} {...sharedCardProps} onBack={handleBack} note={notes.get(selectedId) ?? ''} onSaveNote={handleSaveNote} moods={moods.get(selectedId) ?? []} onSetMoods={handleSetMoods} />}
        {renderedPage === 'timeline'    && <Timeline memories={memories} favorites={favorites} watched={watched} onDetails={handleDetails} onPlay={handlePlay} />}
        {renderedPage === 'collections' && <Collections {...sharedCardProps} />}
      </div>

      <Toast toast={toast} />

      {/* Mobile bottom nav */}
      {showMobileNav && (
        <nav
          className="mobile-nav fixed bottom-0 left-0 right-0 z-50 items-center justify-around"
          style={{
            background: 'var(--nav-bg-solid)',
            borderTop: '1px solid var(--nav-border)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {MOBILE_NAV.map(({ page: p, label, icon }) => {
            const active = page === p;
            return (
              <button
                key={p}
                onClick={() => navigate(p)}
                className="flex flex-col items-center gap-1 py-2.5 px-3 flex-1"
                style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}
              >
                {icon(active)}
                <span style={{ fontSize: '10px', fontWeight: active ? 600 : 400 }}>{label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

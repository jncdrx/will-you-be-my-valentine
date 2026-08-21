import { useState } from 'react';
import { ThemePreference } from '@/hooks/useTheme';

export type Page = 'home' | 'memories' | 'continue' | 'favorites' | 'search' | 'details' | 'player' | 'collections' | 'timeline';

interface NavbarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  transparent?: boolean;
  themePref: ThemePreference;
  onThemeChange: (p: ThemePreference) => void;
  onBackToHub?: () => void;
  onOpenLetter?: () => void;
  onLogout?: () => void;
}

const ThemeIcon = ({ type }: { type: ThemePreference }) => {
  if (type === 'system') return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
  if (type === 'light') return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
};

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function Navbar({ currentPage, onNavigate, transparent = false, themePref, onThemeChange, onBackToHub, onOpenLetter, onLogout }: NavbarProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  const navItems: { label: string; page: Page }[] = [
    { label: 'Home', page: 'home' },
    { label: 'Our Memories', page: 'memories' },
    { label: 'Continue', page: 'continue' },
    { label: 'Timeline', page: 'timeline' },
    { label: 'Favorites', page: 'favorites' },
  ];

  const navText        = transparent ? 'rgba(255,255,255,0.65)' : 'var(--nav-text)';
  const navTextHover   = transparent ? 'white'                  : 'var(--nav-text-hover)';
  const navTextActive  = transparent ? 'white'                  : 'var(--nav-text-active)';
  const logoColor      = transparent ? 'white'                  : 'var(--text-primary)';
  const subtagColor    = transparent ? 'rgba(255,255,255,0.3)'  : 'var(--text-muted)';

  return (
    <nav
      style={{
        background: transparent
          ? 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%)'
          : 'var(--nav-bg-solid)',
        borderBottom: transparent ? 'none' : '1px solid var(--nav-border)',
        backdropFilter: transparent ? 'none' : 'blur(14px)',
        WebkitBackdropFilter: transparent ? 'none' : 'blur(14px)',
      }}
      className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 h-14 sm:h-16 flex items-center justify-between"
    >
      {/* Left */}
      <div className="flex items-center gap-3 sm:gap-6">
        <button
          onClick={() => { if (onBackToHub) onBackToHub(); else onNavigate('home'); }}
          style={{ color: navText }}
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium tracking-wide transition-all cursor-pointer"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = navTextHover; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = navText; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          TV Home
        </button>

        <button onClick={() => onNavigate('home')} className="flex items-baseline gap-2">
          <span style={{ color: logoColor, letterSpacing: '0.2em', fontWeight: 700, fontSize: '13px', fontFamily: "'Inter', sans-serif" }}>
            ANGELFLIX
          </span>
          <span style={{ color: subtagColor }} className="text-xs hidden sm:block">
            Our Private Cinema
          </span>
        </button>
      </div>

      {/* Center nav */}
      <div className="hidden md:flex items-center gap-1">
        {navItems.map((item) => {
          const active = currentPage === item.page;
          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className="relative px-3 py-1.5 text-sm flex flex-col items-center gap-0"
              style={{ color: active ? navTextActive : navText, fontWeight: active ? 600 : 500, background: 'transparent' }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = navTextHover; }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = navText; }}
            >
              {item.label}
              <span
                style={{
                  display: 'block', height: '2px',
                  width: active ? '100%' : '0%',
                  background: 'var(--nav-underline)',
                  borderRadius: '1px', marginTop: '3px',
                  transition: 'width 200ms ease',
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search */}
        <button
          onClick={() => onNavigate('search')}
          className="w-8 h-8 flex items-center justify-center rounded-full"
          style={{ color: currentPage === 'search' ? navTextActive : navText }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = navTextHover; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = currentPage === 'search' ? navTextActive : navText; }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>

        {/* Collections */}
        <button
          onClick={() => onNavigate('collections')}
          className="w-8 h-8 flex items-center justify-center rounded-full"
          style={{ color: currentPage === 'collections' ? navTextActive : navText }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = navTextHover; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = currentPage === 'collections' ? navTextActive : navText; }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
          </svg>
        </button>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            A
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
              <div
                className="absolute right-0 top-11 w-56 rounded-xl overflow-hidden shadow-2xl z-50"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              >
                <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0" style={{ background: 'var(--accent)', color: '#fff' }}>A</div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Angel</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Our Cinema</div>
                  </div>
                </div>

                <div className="p-2">
                  <button
                    onClick={() => { setProfileOpen(false); if (onBackToHub) onBackToHub(); else onNavigate('home'); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left font-semibold text-rose-400"
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--border-subtle)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <span>🏠</span>
                    <span>Experience Hub</span>
                  </button>

                  <button
                    onClick={() => { setProfileOpen(false); if (onOpenLetter) onOpenLetter(); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left font-semibold text-rose-300"
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--border-subtle)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <span>💌</span>
                    <span>The Love Letter</span>
                  </button>

                  <div style={{ height: '1px', background: 'var(--border)', margin: '4px 4px' }} />

                  {[
                    { label: 'Timeline', page: 'timeline' as Page, icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
                    { label: 'AngelFlix Home', page: 'home' as Page, icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5,3 19,12 5,21" /></svg> },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => { setProfileOpen(false); onNavigate(item.page); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--border-subtle)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
                    >
                      <span style={{ opacity: 0.55 }}>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}

                  <div style={{ height: '1px', background: 'var(--border)', margin: '6px 4px' }} />

                  <div className="px-3 py-2">
                    <div className="text-xs mb-2" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Theme</div>
                    <div className="flex flex-col gap-0.5">
                      {THEME_OPTIONS.map((opt) => {
                        const active = themePref === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => onThemeChange(opt.value)}
                            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-left"
                            style={{ background: active ? 'var(--accent-dim)' : 'transparent', color: active ? 'var(--accent)' : 'var(--text-secondary)' }}
                            onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'var(--border-subtle)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; } }}
                            onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; } }}
                          >
                            <span style={{ opacity: active ? 1 : 0.55, flexShrink: 0 }}><ThemeIcon type={opt.value} /></span>
                            <span className="flex-1">{opt.label}</span>
                            {active && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12" /></svg>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ height: '1px', background: 'var(--border)', margin: '6px 4px' }} />
                  <button
                    onClick={() => { setProfileOpen(false); onLogout?.(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left"
                    style={{ color: 'var(--accent)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-dim)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { netflixSound } from '../lib/netflixSound';
import { ExperienceHub } from '../components/ExperienceHub';
import NetflixIntroAnimation from '../angelflix/components/NetflixIntroAnimation';
import Home from '../angelflix/pages/Home';
import Search from '../angelflix/pages/Search';
import Favorites from '../angelflix/pages/Favorites';
import Timeline from '../angelflix/pages/Timeline';
import Collections from '../angelflix/pages/Collections';
import VideoPlayer from '../angelflix/pages/VideoPlayer';
import VideoDetails from '../angelflix/pages/VideoDetails';
import Admin from '../angelflix/pages/Admin';
import { Memory, Category } from '../angelflix/data/memories';
import { getCustomMemories, addCustomMemory, deleteCustomMemory } from '../angelflix/lib/store';

const TEST_MEMORIES: Memory[] = [
  {
    id: 'mem-1',
    title: 'First Date Coffee',
    date: 'Jan 7, 2026',
    dateSort: '2026-01-07',
    duration: '2m 30s',
    durationSec: 150,
    category: 'Dates' as Category,
    description: 'The first time we sat across each other laughing for hours.',
    thumbnail: 'https://example.com/coffee.jpg',
    backdropUrl: 'https://example.com/coffee-bg.jpg',
    videoSrc: 'https://example.com/coffee.mp4',
  },
  {
    id: 'mem-2',
    title: 'Stargazing Night',
    date: 'Feb 14, 2026',
    dateSort: '2026-02-14',
    duration: '4m 10s',
    durationSec: 250,
    category: 'Special Days' as Category,
    description: 'Looking up at the night sky talking about the future.',
    thumbnail: 'https://example.com/stars.jpg',
    backdropUrl: 'https://example.com/stars-bg.jpg',
  },
  {
    id: 'mem-3',
    title: 'Beach Roadtrip',
    date: 'Mar 20, 2026',
    dateSort: '2026-03-20',
    duration: '5m 00s',
    durationSec: 300,
    category: 'Adventures' as Category,
    description: 'Driving down the coast with windows down and our favorite songs.',
    thumbnail: 'https://example.com/beach.jpg',
    backdropUrl: 'https://example.com/beach-bg.jpg',
  },
];

describe('Comprehensive E2E Feature & Function Verification', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------
  // 1. Experience Hub Navigation & Functionality
  // -------------------------------------------------------------
  describe('1. Experience Hub System', () => {
    it('renders all branding, cards, and relationship counters', () => {
      const handleSelect = vi.fn();
      const handleLogout = vi.fn();

      render(
        <ExperienceHub
          onSelectExperience={handleSelect}
          onLogout={handleLogout}
          unclaimedVoucherCount={3}
        />
      );

      // Verify Netflix-style branding
      expect(screen.getAllByText('ANGELFLIX').length).toBeGreaterThan(0);
      expect(screen.getByText("Angel's Space")).toBeInTheDocument();
      expect(screen.getAllByText(/Happy 7th Monthsary/i).length).toBeGreaterThan(0);
      expect(screen.getByText('Choose Your Experience')).toBeInTheDocument();

      // Verify Cards
      expect(screen.getByText('The Love Letter')).toBeInTheDocument();
      expect(screen.getByText('AngelFlix Cinema')).toBeInTheDocument();
      expect(screen.getByText('Pharma Folio')).toBeInTheDocument();
      expect(screen.getByText('3 Vouchers')).toBeInTheDocument();
      expect(screen.getByText(/Days in Love/i)).toBeInTheDocument();
    });

    it('navigates to Love Letter, AngelFlix, and Pharma Folio on click', () => {
      const handleSelect = vi.fn();
      render(
        <ExperienceHub
          onSelectExperience={handleSelect}
          onLogout={vi.fn()}
          unclaimedVoucherCount={0}
        />
      );

      fireEvent.click(screen.getByText('The Love Letter'));
      expect(handleSelect).toHaveBeenCalledWith('letter');

      fireEvent.click(screen.getByText('AngelFlix Cinema'));
      expect(handleSelect).toHaveBeenCalledWith('angelflix');

      fireEvent.click(screen.getByText('Pharma Folio'));
      expect(handleSelect).toHaveBeenCalledWith('folio');
    });

    it('handles logout button click', () => {
      const handleLogout = vi.fn();
      render(
        <ExperienceHub
          onSelectExperience={vi.fn()}
          onLogout={handleLogout}
          unclaimedVoucherCount={0}
        />
      );

      const logoutBtn = screen.getByLabelText('Log out');
      fireEvent.click(logoutBtn);
      expect(handleLogout).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------
  // 2. Netflix Intro Animation & Sound Engine
  // -------------------------------------------------------------
  describe('2. Netflix Sound Engine & Intro Animation', () => {
    it('executes UI sound methods without error', () => {
      expect(() => {
        netflixSound.playClick();
        netflixSound.playSelect();
        netflixSound.playPop();
        netflixSound.playBack();
        netflixSound.playHover();
        netflixSound.playTudum();
      }).not.toThrow();
    });

    it('toggles sound on and off and preserves setting in localStorage', () => {
      const initial = netflixSound.isSoundEnabled();
      const toggled = netflixSound.toggleSound();
      expect(toggled).toBe(!initial);
      expect(localStorage.getItem('netflix_sound_enabled')).toBe(String(!initial));

      netflixSound.setSoundEnabled(true);
      expect(netflixSound.isSoundEnabled()).toBe(true);
    });

    it('renders 3D ribbon A, wordmark, and handles skip intro', () => {
      const handleComplete = vi.fn();
      render(<NetflixIntroAnimation onComplete={handleComplete} autoPlaySound={false} />);

      expect(screen.getByText('ANGELFLIX')).toBeInTheDocument();
      expect(screen.getByText('OUR PRIVATE CINEMA')).toBeInTheDocument();

      const skipBtn = screen.getByText('SKIP INTRO');
      expect(skipBtn).toBeInTheDocument();
      fireEvent.click(skipBtn);
    });
  });

  // -------------------------------------------------------------
  // 3. AngelFlix Full Application & Navigation Flow
  // -------------------------------------------------------------
  describe('3. AngelFlix Streaming Experience & Pages', () => {
    const defaultCardProps = {
      memories: TEST_MEMORIES,
      favorites: new Set<string>(['mem-1']),
      watched: new Map<string, number>([['mem-1', 45]]),
      onPlay: vi.fn(),
      onDetails: vi.fn(),
      onToggleFavorite: vi.fn(),
    };

    it('renders Home page with Hero Billboard and category rows', () => {
      render(
        <Home
          {...defaultCardProps}
          onNavigate={vi.fn()}
          onSurpriseMe={vi.fn()}
        />
      );

      expect(screen.getByText('Watch Now')).toBeInTheDocument();
      expect(screen.getByText('Details')).toBeInTheDocument();
    });

    it('renders Search page and filters memories dynamically by query', () => {
      render(<Search {...defaultCardProps} />);

      const searchInput = screen.getByPlaceholderText(/Search our memories/i);
      expect(searchInput).toBeInTheDocument();

      // Type search query
      fireEvent.change(searchInput, { target: { value: 'Coffee' } });
      expect(screen.getAllByText(/Coffee/i).length).toBeGreaterThan(0);
    });

    it('renders Saved / Favorites page with stored favorites', () => {
      render(<Favorites {...defaultCardProps} onNavigate={vi.fn()} />);
      expect(screen.getByText(/Our Favorites/i)).toBeInTheDocument();
      expect(screen.getByText('First Date Coffee')).toBeInTheDocument();
    });

    it('renders Interactive Timeline page', () => {
      render(
        <Timeline
          memories={TEST_MEMORIES}
          favorites={new Set()}
          watched={new Map()}
          onDetails={vi.fn()}
          onPlay={vi.fn()}
        />
      );

      expect(screen.getByText('Timeline')).toBeInTheDocument();
      expect(screen.getByText(/Every moment, in the order we lived them/i)).toBeInTheDocument();
      expect(screen.getByText('Beach Roadtrip')).toBeInTheDocument();
    });

    it('renders Collections view with memory groups', () => {
      render(<Collections {...defaultCardProps} />);
      expect(screen.getByText(/Our Monthsaries/i)).toBeInTheDocument();
      expect(screen.getByText(/Our Dates/i)).toBeInTheDocument();
    });

    it('renders VideoPlayer modal with player controls', () => {
      const memory = TEST_MEMORIES[0];
      const handleClose = vi.fn();
      render(
        <VideoPlayer
          memories={TEST_MEMORIES}
          memoryId={memory.id}
          watched={new Map()}
          onBack={handleClose}
          onUpdateWatched={vi.fn()}
          onPlayNext={vi.fn()}
        />
      );

      expect(screen.getByText(memory.title)).toBeInTheDocument();
      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    it('renders VideoDetails page with note editor and mood tag selector', () => {
      const handleSaveNote = vi.fn();
      const handleSetMoods = vi.fn();

      render(
        <VideoDetails
          {...defaultCardProps}
          memoryId={TEST_MEMORIES[0].id}
          onBack={vi.fn()}
          note="Our special dinner memory"
          onSaveNote={handleSaveNote}
          moods={['Romantic', 'Heartfelt']}
          onSetMoods={handleSetMoods}
        />
      );

      expect(screen.getByText(TEST_MEMORIES[0].title)).toBeInTheDocument();
      expect(screen.getByText(/Your Note/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Write something about this memory/i)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------
  // 4. Custom Memories & Store Persistence
  // -------------------------------------------------------------
  describe('4. AngelFlix Store & Memory Storage', () => {
    it('manages custom memories in local store', () => {
      const initialCount = getCustomMemories().length;
      const newMem: Memory = {
        id: 'test-custom-1',
        title: 'Sunset Beach Walk',
        description: 'Walking hand in hand at the golden hour',
        date: '2025-07-20',
        dateSort: '2025-07-20',
        category: 'Adventures' as Category,
        duration: '3m 45s',
        durationSec: 225,
        thumbnail: 'https://example.com/sunset.jpg',
        backdropUrl: 'https://example.com/sunset.jpg',
      };

      addCustomMemory(newMem);

      const updated = getCustomMemories();
      expect(updated.length).toBe(initialCount + 1);
      expect(updated.some((m) => m.title === 'Sunset Beach Walk')).toBe(true);

      deleteCustomMemory(newMem.id);
      expect(getCustomMemories().length).toBe(initialCount);
    });
  });

  // -------------------------------------------------------------
  // 5. AngelFlix Figma Studio Admin Panel
  // -------------------------------------------------------------
  describe('5. AngelFlix Figma Studio Admin Panel', () => {
    it('renders admin overview stats and allows tab switching', () => {
      render(<Admin />);

      expect(screen.getByText(/CMS/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /↑ Upload/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /▦ Library/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /◎ Stats/i })).toBeInTheDocument();

      // Switch to Library Tab
      const libraryTab = screen.getByRole('button', { name: /▦ Library/i });
      fireEvent.click(libraryTab);
      expect(screen.getByPlaceholderText(/Search…/i)).toBeInTheDocument();
    });
  });
});

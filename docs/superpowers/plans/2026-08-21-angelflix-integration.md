# AngelFlix Integration & Experience Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the AngelFlix Netflix-styled private cinema experience into the monthsarry project, complete with a romantic Home Experience Hub gateway ("The Letter" vs. "AngelFlix"), category carousels, and an interactive cinema player modal.

**Architecture:** A unified React state and route architecture where authenticated users land on a Netflix-style Experience Hub (`ExperienceHub.tsx`) to choose between 💌 The Love Letter experience and 🎬 AngelFlix (`AngelFlix.tsx`). Both experiences support instant switching, cinema playback modal (`AngelFlixPlayerModal.tsx`), and persistent background audio and real-time vouchers.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Framer Motion, Lucide React, Canvas Confetti, Sonner Toast, Vitest, React Testing Library.

## Global Constraints
- Do not break existing Supabase authentication or voucher redemption features.
- Preserve background audio player across switches between Hub, Letter, and AngelFlix.
- Fully responsive on mobile, tablet, and desktop viewports.
- Dark Netflix UI palette (#141414, #181818, #E50914, #be185d) with romantic crimson/rose accents.

---

### Task 1: Asset Preparation & AngelFlix Configuration

**Files:**
- Create: `public/angelflix/hero-banner.png`
- Create: `src/config/angelflixConfig.ts`
- Test: `src/config/__tests__/angelflixConfig.test.ts`

**Interfaces:**
- Produces: `angelflixConfig`, `AngelFlixItem`, `AngelFlixCategory` exported from `src/config/angelflixConfig.ts`.

- [ ] **Step 1: Copy and setup AngelFlix assets in public directory**
Copy `scratch/netflix_extracted/AngelFlix - Home.png` to `public/angelflix/hero-banner.png` or provide high quality fallback visual assets.

- [ ] **Step 2: Write test for `angelflixConfig.ts`**

```typescript
// src/config/__tests__/angelflixConfig.test.ts
import { describe, it, expect } from "vitest";
import { angelflixConfig } from "../angelflixConfig";

describe("angelflixConfig", () => {
  it("contains hero configuration with title and description", () => {
    expect(angelflixConfig.hero.title).toBe("A Love Worth Remembering");
    expect(angelflixConfig.hero.tags).toContain("Romance");
    expect(angelflixConfig.hero.tags).toContain("Memories");
    expect(angelflixConfig.hero.tags).toContain("Adventures");
  });

  it("contains recent memories categories and items", () => {
    expect(angelflixConfig.recentMemories.length).toBeGreaterThan(0);
    const first = angelflixConfig.recentMemories[0];
    expect(first.title).toBe("First Date");
    expect(first.description).toBeDefined();
  });

  it("contains chapters of us matching 7 months", () => {
    expect(angelflixConfig.chapters.length).toBe(7);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test src/config/__tests__/angelflixConfig.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 4: Implement `src/config/angelflixConfig.ts`**

```typescript
// src/config/angelflixConfig.ts
import { monthsaryConfig } from "./monthsaryConfig";

export interface AngelFlixItem {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  imageUrl: string;
  category: string;
  date?: string;
  photos?: { src: string; caption: string }[];
  videoUrl?: string;
  tags?: string[];
  isFavorite?: boolean;
}

export const angelflixConfig = {
  brand: {
    name: "ANGELFLIX",
    subtitle: "Our Private Cinema",
    since: "Since 2024",
    tagline: "Every moment matters · Forever yours",
  },
  hero: {
    title: "A Love Worth Remembering",
    tags: ["Romance", "Memories", "Adventures"],
    meta: "Since 2024 · Every moment matters · Forever yours",
    description:
      "A collection of our most precious moments together - first dates, monthsary highlights, trips, laughter, and quiet nights.",
    backdropImage: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1920&q=80",
    watchButtonText: "Watch Together",
    favoritesButtonText: "Our Favorites",
    loveButtonText: "Made with love",
  },
  recentMemories: [
    {
      id: "rm-1",
      title: "First Date",
      subtitle: "A quiet night that changed everything",
      description: "From our very first awkward smile to talking for hours and forgetting about time. The night where my whole world changed.",
      imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
      category: "First Dates",
      date: "Feb 4, 2026",
      tags: ["Beginning", "First Date", "Romantic"],
      photos: monthsaryConfig.monthDetails[0]?.photos || [],
      isFavorite: true,
    },
    {
      id: "rm-2",
      title: "Monthsary Highlights",
      subtitle: "Little moments that add up",
      description: "7 months of sweet surprises, cake decorating, silly selfies, and growing deeper in love every single day.",
      imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80",
      category: "Highlights",
      date: "Aug 4, 2026",
      tags: ["Highlights", "7 Months", "Milestone"],
      photos: monthsaryConfig.monthDetails[6]?.photos || [],
      isFavorite: true,
    },
    {
      id: "rm-3",
      title: "Travel Adventures",
      subtitle: "Exploring together",
      description: "Sunset views, mountain air, discovering new coffee shops, and exploring the world with my favorite person.",
      imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
      category: "Travel",
      date: "Jun 4, 2026",
      tags: ["Adventures", "Nature", "Mountains"],
      photos: monthsaryConfig.monthDetails[4]?.photos || [],
      isFavorite: true,
    },
    {
      id: "rm-4",
      title: "Funny Moments",
      subtitle: "Laughter is the best memory",
      description: "Unfiltered laughter, teasing each other, goofy face photos, and the cute giggles that make everything better.",
      imageUrl: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80",
      category: "Laughs",
      date: "May 4, 2026",
      tags: ["Laughter", "Joy", "Candids"],
      photos: monthsaryConfig.monthDetails[3]?.photos || [],
      isFavorite: false,
    },
    {
      id: "rm-5",
      title: "Sweet Messages",
      subtitle: "Words that stay forever",
      description: "Every love note, midnight text, sweet reassuring words, and love letters that keep our hearts connected.",
      imageUrl: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80",
      category: "Letters",
      date: "Apr 4, 2026",
      tags: ["Letters", "Sweet", "Heartfelt"],
      photos: monthsaryConfig.monthDetails[2]?.photos || [],
      isFavorite: true,
    },
    {
      id: "rm-6",
      title: "Our Favorites",
      subtitle: "The ones we replay most",
      description: "The memories we replay in our minds over and over because they hold the warmest hugs and sweetest smiles.",
      imageUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
      category: "Favorites",
      date: "Mar 4, 2026",
      tags: ["Favorites", "Warmth", "Love"],
      photos: monthsaryConfig.monthDetails[1]?.photos || [],
      isFavorite: true,
    },
  ] as AngelFlixItem[],
  chapters: monthsaryConfig.monthDetails.map((detail) => ({
    id: `chapter-${detail.monthIndex + 1}`,
    title: `Chapter ${detail.monthIndex + 1}: ${detail.title}`,
    subtitle: detail.month,
    description: detail.letterBody.join(" "),
    imageUrl: detail.photos[0]?.src || "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80",
    category: "Chapters of Us",
    date: detail.date,
    photos: detail.photos,
    tags: [detail.month, "Chapter"],
    isFavorite: true,
  })) as AngelFlixItem[],
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test src/config/__tests__/angelflixConfig.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/config/angelflixConfig.ts src/config/__tests__/angelflixConfig.test.ts
git commit -m "feat: add AngelFlix configuration and test"
```

---

### Task 2: Cinema Player Modal Component (`AngelFlixPlayerModal.tsx`)

**Files:**
- Create: `src/components/AngelFlixPlayerModal.tsx`
- Test: `src/components/__tests__/AngelFlixPlayerModal.test.tsx`

**Interfaces:**
- Consumes: `AngelFlixItem` from `src/config/angelflixConfig.ts`
- Produces: `<AngelFlixPlayerModal item={item} isOpen={isOpen} onClose={() => {}} onNext={() => {}} onPrev={() => {}} />`

- [ ] **Step 1: Write test for `AngelFlixPlayerModal`**

```typescript
// src/components/__tests__/AngelFlixPlayerModal.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AngelFlixPlayerModal } from "../AngelFlixPlayerModal";
import { angelflixConfig } from "../../config/angelflixConfig";

describe("AngelFlixPlayerModal", () => {
  const mockItem = angelflixConfig.recentMemories[0];

  it("renders memory details and title when open", () => {
    render(
      <AngelFlixPlayerModal
        item={mockItem}
        isOpen={true}
        onClose={vi.fn()}
        onNext={vi.fn()}
        onPrev={vi.fn()}
      />
    );
    expect(screen.getByText("First Date")).toBeInTheDocument();
    expect(screen.getByText(mockItem.subtitle!)).toBeInTheDocument();
  });

  it("triggers onClose when close button clicked", () => {
    const handleClose = vi.fn();
    render(
      <AngelFlixPlayerModal
        item={mockItem}
        isOpen={true}
        onClose={handleClose}
        onNext={vi.fn()}
        onPrev={vi.fn()}
      />
    );
    const closeBtn = screen.getByLabelText("Close cinema player");
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/components/__tests__/AngelFlixPlayerModal.test.tsx`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement `src/components/AngelFlixPlayerModal.tsx`**

```tsx
// src/components/AngelFlixPlayerModal.tsx
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Heart,
  Calendar,
  Sparkles,
  Maximize2,
  Minimize2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { AngelFlixItem } from "../config/angelflixConfig";

interface AngelFlixPlayerModalProps {
  item: AngelFlixItem | null;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export function AngelFlixPlayerModal({
  item,
  isOpen,
  onClose,
  onNext,
  onPrev,
}: AngelFlixPlayerModalProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const photos = item?.photos && item.photos.length > 0 ? item.photos : [{ src: item?.imageUrl || "", caption: item?.subtitle || "" }];

  // Reset photo index when item changes
  useEffect(() => {
    setCurrentPhotoIndex(0);
    setIsLiked(Boolean(item?.isFavorite));
  }, [item]);

  // Slideshow auto-advance timer
  useEffect(() => {
    if (!isOpen || !isPlaying || photos.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [isOpen, isPlaying, photos.length]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") {
        if (photos.length > 1) {
          setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
        } else if (onNext) {
          onNext();
        }
      }
      if (e.key === "ArrowLeft") {
        if (photos.length > 1) {
          setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
        } else if (onPrev) {
          onPrev();
        }
      }
      if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    },
    [isOpen, onClose, onNext, onPrev, photos.length]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen || !item) return null;

  const currentPhoto = photos[currentPhotoIndex] || photos[0];

  const handleToggleLike = () => {
    setIsLiked(!isLiked);
    if (!isLiked) {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#e50914", "#f43f5e", "#fda4af"],
      });
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-2 sm:p-6 overflow-hidden">
        {/* Animated Cinema Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative flex flex-col w-full max-w-5xl max-h-[92vh] bg-zinc-950 border border-zinc-800/80 rounded-2xl shadow-2xl overflow-hidden text-white"
        >
          {/* Top Control Bar */}
          <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
            <div className="flex items-center gap-2">
              <span className="bg-rose-600/90 text-white text-[11px] font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase shadow">
                ANGELFLIX CINEMA
              </span>
              {item.date && (
                <span className="flex items-center gap-1 text-xs text-zinc-300 font-medium">
                  <Calendar size={13} className="text-rose-400" />
                  {item.date}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                aria-label="Toggle fullscreen"
                className="p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                onClick={onClose}
                aria-label="Close cinema player"
                className="p-2 rounded-full bg-zinc-900/80 hover:bg-rose-600 text-zinc-300 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Main Media Screen with Ken Burns effect */}
          <div className="relative w-full flex-1 min-h-[320px] sm:min-h-[460px] bg-black flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentPhoto.src}
                src={currentPhoto.src}
                alt={currentPhoto.caption || item.title}
                initial={{ opacity: 0, scale: 1.06 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeInOut" }}
                className="max-h-[65vh] w-full object-contain select-none"
              />
            </AnimatePresence>

            {/* Dark Vignette Overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/30" />

            {/* Previous Photo Button */}
            {photos.length > 1 && (
              <button
                onClick={() => setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white backdrop-blur-md border border-white/10 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <ChevronLeft size={22} />
              </button>
            )}

            {/* Next Photo Button */}
            {photos.length > 1 && (
              <button
                onClick={() => setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white backdrop-blur-md border border-white/10 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <ChevronRight size={22} />
              </button>
            )}

            {/* Photo Slide Indicator */}
            {photos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
                {photos.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPhotoIndex(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentPhotoIndex ? "w-6 bg-rose-500" : "w-1.5 bg-zinc-600 hover:bg-zinc-400"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Cinema Details & Media Controls */}
          <div className="p-4 sm:p-6 bg-zinc-950/95 border-t border-zinc-800/80 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">
                    {item.title}
                  </h2>
                  {item.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {item.subtitle && (
                  <p className="text-sm font-semibold text-rose-400">{item.subtitle}</p>
                )}
              </div>

              {/* Playback Controls & Action Buttons */}
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                {photos.length > 1 && (
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-all border border-zinc-700"
                  >
                    {isPlaying ? <Pause size={14} className="text-rose-400" /> : <Play size={14} className="text-rose-400" />}
                    <span>{isPlaying ? "Auto Playing" : "Paused"}</span>
                  </button>
                )}

                <button
                  onClick={handleToggleLike}
                  aria-label="Like memory"
                  className={`p-2 rounded-full border transition-all ${
                    isLiked
                      ? "bg-rose-600/20 border-rose-500 text-rose-500"
                      : "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-400 hover:text-white"
                  }`}
                >
                  <Heart size={16} className={isLiked ? "fill-rose-500" : ""} />
                </button>
              </div>
            </div>

            {/* Description / Caption text */}
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans max-w-3xl">
              {currentPhoto.caption || item.description}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test src/components/__tests__/AngelFlixPlayerModal.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/AngelFlixPlayerModal.tsx src/components/__tests__/AngelFlixPlayerModal.test.tsx
git commit -m "feat: add AngelFlixPlayerModal component with cinema slideshow"
```

---

### Task 3: AngelFlix Homepage Component (`AngelFlix.tsx`)

**Files:**
- Create: `src/components/AngelFlix.tsx`
- Test: `src/components/__tests__/AngelFlix.test.tsx`

**Interfaces:**
- Consumes: `angelflixConfig` from `src/config/angelflixConfig.ts`, `AngelFlixPlayerModal`
- Produces: `<AngelFlix onBackToHub={() => {}} onOpenLetter={() => {}} onLogout={() => {}} />`

- [ ] **Step 1: Write test for `AngelFlix.tsx`**

```typescript
// src/components/__tests__/AngelFlix.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AngelFlix } from "../AngelFlix";

describe("AngelFlix", () => {
  it("renders brand name and billboard hero heading", () => {
    render(<AngelFlix onBackToHub={vi.fn()} onOpenLetter={vi.fn()} onLogout={vi.fn()} />);
    expect(screen.getByText("ANGELFLIX")).toBeInTheDocument();
    expect(screen.getByText("A Love Worth Remembering")).toBeInTheDocument();
  });

  it("renders recent memories category", () => {
    render(<AngelFlix onBackToHub={vi.fn()} onOpenLetter={vi.fn()} onLogout={vi.fn()} />);
    expect(screen.getByText("Recent Memories")).toBeInTheDocument();
    expect(screen.getByText("First Date")).toBeInTheDocument();
  });

  it("calls onOpenLetter when 'Love Letter' button is clicked", () => {
    const handleOpenLetter = vi.fn();
    render(<AngelFlix onBackToHub={vi.fn()} onOpenLetter={handleOpenLetter} onLogout={vi.fn()} />);
    const letterBtn = screen.getByText("Love Letter");
    fireEvent.click(letterBtn);
    expect(handleOpenLetter).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/components/__tests__/AngelFlix.test.tsx`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement `src/components/AngelFlix.tsx`**

```tsx
// src/components/AngelFlix.tsx
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Heart,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  LogOut,
  Mail,
  Home,
  Star,
  Film,
  Menu,
  X,
} from "lucide-react";
import confetti from "canvas-confetti";
import { angelflixConfig, AngelFlixItem } from "../config/angelflixConfig";
import { AngelFlixPlayerModal } from "./AngelFlixPlayerModal";

interface AngelFlixProps {
  onBackToHub: () => void;
  onOpenLetter: () => void;
  onLogout: () => void;
}

export function AngelFlix({ onBackToHub, onOpenLetter, onLogout }: AngelFlixProps) {
  const [selectedItem, setSelectedItem] = useState<AngelFlixItem | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [showLovePopup, setShowLovePopup] = useState(false);
  const [filterFavoriteOnly, setFilterFavoriteOnly] = useState(false);
  const recentScrollRef = useRef<HTMLDivElement>(null);
  const chaptersScrollRef = useRef<HTMLDivElement>(null);

  const handleCardClick = (item: AngelFlixItem) => {
    setSelectedItem(item);
    setIsPlayerOpen(true);
  };

  const handleWatchTogether = () => {
    setSelectedItem(angelflixConfig.recentMemories[0]);
    setIsPlayerOpen(true);
    confetti({
      particleCount: 40,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#e50914", "#f43f5e", "#fda4af"],
    });
  };

  const handleMadeWithLove = () => {
    setShowLovePopup(true);
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.5 },
      colors: ["#e50914", "#f43f5e", "#fb7185", "#ffd166"],
    });
  };

  const scrollContainer = (ref: React.RefObject<HTMLDivElement>, direction: "left" | "right") => {
    if (ref.current) {
      const scrollAmount = direction === "left" ? -400 : 400;
      ref.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const displayedRecentMemories = filterFavoriteOnly
    ? angelflixConfig.recentMemories.filter((m) => m.isFavorite)
    : angelflixConfig.recentMemories;

  return (
    <div className="relative min-h-screen w-full bg-zinc-950 text-white font-sans overflow-x-hidden pb-20">
      {/* Background Netflix Gradient */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-950/20 via-zinc-950 to-black" />

      {/* Top Navbar */}
      <header className="fixed top-0 inset-x-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHub}
              className="flex items-center gap-2 group text-left focus:outline-none"
              aria-label="AngelFlix Home"
            >
              <span className="text-2xl sm:text-3xl font-black tracking-wider text-rose-600 group-hover:text-rose-500 transition-colors font-display">
                ANGELFLIX
              </span>
              <span className="hidden sm:inline-block text-xs font-semibold tracking-wider text-zinc-400 pl-2 border-l border-zinc-700 uppercase">
                Our Private Cinema
              </span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-zinc-300">
            <button
              onClick={() => {
                setFilterFavoriteOnly(false);
                recentScrollRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
              className="hover:text-white transition-colors"
            >
              Memories
            </button>
            <button
              onClick={() => {
                chaptersScrollRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
              className="hover:text-white transition-colors"
            >
              Chapters of Us
            </button>
            <button
              onClick={() => {
                setFilterFavoriteOnly((prev) => !prev);
              }}
              className={`flex items-center gap-1 hover:text-white transition-colors ${
                filterFavoriteOnly ? "text-rose-400" : ""
              }`}
            >
              <Star size={14} className={filterFavoriteOnly ? "fill-rose-400" : ""} />
              <span>Favorites</span>
            </button>
          </nav>

          {/* Action Hub Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Switch to Letter Button */}
            <button
              onClick={onOpenLetter}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600/20 border border-rose-500/60 hover:bg-rose-600 text-rose-200 hover:text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Mail size={14} className="shrink-0" />
              <span>Love Letter</span>
            </button>

            {/* Back to Hub Gateway */}
            <button
              onClick={onBackToHub}
              title="Return to Experience Hub"
              className="p-2 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all active:scale-95"
              aria-label="Return to Hub"
            >
              <Home size={16} />
            </button>

            {/* Heart Burst Easter Egg */}
            <button
              onClick={handleMadeWithLove}
              title="Romantic surprise"
              className="p-2 rounded-full bg-rose-950/60 border border-rose-800/80 hover:bg-rose-600 text-rose-400 hover:text-white transition-all active:scale-95"
              aria-label="Romantic surprise"
            >
              <Heart size={16} className="fill-current" />
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              title="Log out"
              className="p-2 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-all active:scale-95"
              aria-label="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Billboard Banner */}
      <section className="relative z-10 pt-20 sm:pt-24 min-h-[580px] sm:min-h-[640px] flex items-center justify-start px-4 sm:px-12 max-w-7xl mx-auto">
        {/* Background Image Container with Gradient Fade */}
        <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl mx-2 sm:mx-4 my-2 border border-zinc-800/60">
          <img
            src={angelflixConfig.hero.backdropImage}
            alt="Hero Romantic Backdrop"
            className="w-full h-full object-cover object-center opacity-40 sm:opacity-50 scale-105 filter brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/60 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-2xl py-12 px-4 sm:px-8 space-y-4">
          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            {angelflixConfig.hero.tags.map((tag, idx) => (
              <span key={tag} className="text-xs font-black uppercase tracking-widest text-rose-400">
                {tag} {idx < angelflixConfig.hero.tags.length - 1 && "•"}
              </span>
            ))}
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white font-display drop-shadow-md leading-tight">
            {angelflixConfig.hero.title}
          </h1>

          {/* Subtitle Metadata */}
          <p className="text-xs sm:text-sm font-semibold text-zinc-300">
            {angelflixConfig.hero.meta}
          </p>

          {/* Description */}
          <p className="text-sm sm:text-base text-zinc-300/90 leading-relaxed font-sans">
            {angelflixConfig.hero.description}
          </p>

          {/* Action CTA Buttons */}
          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <button
              onClick={handleWatchTogether}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm sm:text-base transition-all shadow-lg hover:shadow-rose-600/30 hover:scale-105 active:scale-95"
            >
              <Play size={18} className="fill-white" />
              <span>{angelflixConfig.hero.watchButtonText}</span>
            </button>

            <button
              onClick={() => {
                setFilterFavoriteOnly(true);
                recentScrollRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 hover:text-white font-bold text-sm sm:text-base transition-all backdrop-blur-md active:scale-95"
            >
              <Star size={16} className="text-amber-400 fill-amber-400" />
              <span>{angelflixConfig.hero.favoritesButtonText}</span>
            </button>

            <button
              onClick={handleMadeWithLove}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 text-rose-300 hover:text-rose-200 font-bold text-sm sm:text-base transition-all backdrop-blur-md active:scale-95"
            >
              <Heart size={16} className="fill-rose-500 text-rose-500" />
              <span>{angelflixConfig.hero.loveButtonText}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Category Section: Recent Memories */}
      <section className="relative z-10 px-4 sm:px-12 max-w-7xl mx-auto mt-10" ref={recentScrollRef}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
              Recent Memories
            </h2>
            {filterFavoriteOnly && (
              <span className="text-xs bg-rose-600/30 border border-rose-500/50 text-rose-300 px-2 py-0.5 rounded-full font-bold">
                Filtered: Favorites
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollContainer(recentScrollRef, "left")}
              className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all active:scale-95"
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scrollContainer(recentScrollRef, "right")}
              className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all active:scale-95"
              aria-label="Scroll right"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Horizontal Carousel */}
        <div
          ref={recentScrollRef}
          className="flex items-stretch gap-4 overflow-x-auto scrollbar-none py-2 scroll-smooth"
        >
          {displayedRecentMemories.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.04, y: -4 }}
              transition={{ duration: 0.2 }}
              onClick={() => handleCardClick(item)}
              className="flex-none w-[240px] sm:w-[280px] bg-zinc-900/90 rounded-2xl overflow-hidden border border-zinc-800 hover:border-rose-500/60 shadow-xl cursor-pointer group flex flex-col"
            >
              <div className="relative h-40 w-full overflow-hidden bg-zinc-800">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play size={14} className="fill-white" />
                </div>
              </div>

              <div className="p-4 flex flex-col flex-1 justify-between space-y-1.5">
                <div>
                  <h3 className="font-bold text-white text-base group-hover:text-rose-400 transition-colors">
                    {item.title}
                  </h3>
                  {item.subtitle && (
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {item.subtitle}
                    </p>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-800/80">
                  <span>{item.category}</span>
                  {item.isFavorite && <Heart size={12} className="text-rose-500 fill-rose-500" />}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Category Section: Chapters of Us */}
      <section className="relative z-10 px-4 sm:px-12 max-w-7xl mx-auto mt-12" ref={chaptersScrollRef}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
            Chapters of Us (Months 1 to 7)
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollContainer(chaptersScrollRef, "left")}
              className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all active:scale-95"
              aria-label="Scroll chapters left"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scrollContainer(chaptersScrollRef, "right")}
              className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all active:scale-95"
              aria-label="Scroll chapters right"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Horizontal Carousel for Chapters */}
        <div
          ref={chaptersScrollRef}
          className="flex items-stretch gap-4 overflow-x-auto scrollbar-none py-2 scroll-smooth"
        >
          {angelflixConfig.chapters.map((chapter) => (
            <motion.div
              key={chapter.id}
              whileHover={{ scale: 1.04, y: -4 }}
              transition={{ duration: 0.2 }}
              onClick={() => handleCardClick(chapter)}
              className="flex-none w-[260px] sm:w-[300px] bg-zinc-900/90 rounded-2xl overflow-hidden border border-zinc-800 hover:border-rose-500/60 shadow-xl cursor-pointer group flex flex-col"
            >
              <div className="relative h-44 w-full overflow-hidden bg-zinc-800">
                <img
                  src={chapter.imageUrl}
                  alt={chapter.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-rose-300 border border-rose-500/30">
                  {chapter.subtitle}
                </div>
              </div>

              <div className="p-4 flex flex-col flex-1 justify-between space-y-1.5">
                <div>
                  <h3 className="font-bold text-white text-base group-hover:text-rose-400 transition-colors">
                    {chapter.title}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mt-1">
                    {chapter.description}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-800/80">
                  <span>{chapter.photos?.length || 1} Memories</span>
                  <span className="text-rose-400 font-semibold">{chapter.date}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Interactive Cinema Player Modal */}
      <AngelFlixPlayerModal
        item={selectedItem}
        isOpen={isPlayerOpen}
        onClose={() => setIsPlayerOpen(false)}
      />

      {/* Romantic "Made with Love" Modal */}
      <AnimatePresence>
        {showLovePopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-rose-500/40 rounded-3xl p-6 max-w-md w-full text-center shadow-2xl relative"
            >
              <button
                onClick={() => setShowLovePopup(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all"
                aria-label="Close message"
              >
                <X size={16} />
              </button>

              <div className="w-14 h-14 rounded-full bg-rose-600/20 border border-rose-500/40 flex items-center justify-center mx-auto mb-3 text-rose-500">
                <Heart size={26} className="fill-rose-500 animate-pulse" />
              </div>

              <h3 className="text-2xl font-bold font-display text-white mb-2">
                Made with Love for Angel
              </h3>

              <p className="text-sm text-zinc-300 leading-relaxed font-sans mb-6">
                Every single memory, pixel, and sound here is dedicated to our 7 months and the lifetime of love ahead of us. You are my favorite movie, my dearest baby angel.
              </p>

              <button
                onClick={() => setShowLovePopup(false)}
                className="w-full py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition-all shadow-md"
              >
                I Love You Too ❤️
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test src/components/__tests__/AngelFlix.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/AngelFlix.tsx src/components/__tests__/AngelFlix.test.tsx
git commit -m "feat: add AngelFlix Netflix-styled homepage component"
```

---

### Task 4: Home Experience Gateway Component (`ExperienceHub.tsx`)

**Files:**
- Create: `src/components/ExperienceHub.tsx`
- Test: `src/components/__tests__/ExperienceHub.test.tsx`

**Interfaces:**
- Produces: `<ExperienceHub onSelectExperience={(mode: "letter" | "angelflix") => {}} onLogout={() => {}} unclaimedVoucherCount={0} isPlayingMusic={false} onToggleMusic={() => {}} />`

- [ ] **Step 1: Write test for `ExperienceHub`**

```typescript
// src/components/__tests__/ExperienceHub.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ExperienceHub } from "../ExperienceHub";

describe("ExperienceHub", () => {
  it("renders both experience choices (Love Letter and AngelFlix)", () => {
    render(
      <ExperienceHub
        onSelectExperience={vi.fn()}
        onLogout={vi.fn()}
        unclaimedVoucherCount={2}
        isPlayingMusic={false}
        onToggleMusic={vi.fn()}
      />
    );
    expect(screen.getByText("The Love Letter")).toBeInTheDocument();
    expect(screen.getByText("AngelFlix Cinema")).toBeInTheDocument();
  });

  it("calls onSelectExperience with 'letter' when clicking love letter card", () => {
    const handleSelect = vi.fn();
    render(
      <ExperienceHub
        onSelectExperience={handleSelect}
        onLogout={vi.fn()}
        unclaimedVoucherCount={0}
        isPlayingMusic={false}
        onToggleMusic={vi.fn()}
      />
    );
    const letterCard = screen.getByText("The Love Letter").closest("button") || screen.getByText("The Love Letter");
    fireEvent.click(letterCard);
    expect(handleSelect).toHaveBeenCalledWith("letter");
  });

  it("calls onSelectExperience with 'angelflix' when clicking angelflix card", () => {
    const handleSelect = vi.fn();
    render(
      <ExperienceHub
        onSelectExperience={handleSelect}
        onLogout={vi.fn()}
        unclaimedVoucherCount={0}
        isPlayingMusic={false}
        onToggleMusic={vi.fn()}
      />
    );
    const angelflixCard = screen.getByText("AngelFlix Cinema").closest("button") || screen.getByText("AngelFlix Cinema");
    fireEvent.click(angelflixCard);
    expect(handleSelect).toHaveBeenCalledWith("angelflix");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/components/__tests__/ExperienceHub.test.tsx`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement `src/components/ExperienceHub.tsx`**

```tsx
// src/components/ExperienceHub.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Film, Heart, Volume2, VolumeX, LogOut, Ticket, Sparkles } from "lucide-react";
import { monthsaryConfig } from "../config/monthsaryConfig";

interface ExperienceHubProps {
  onSelectExperience: (mode: "letter" | "angelflix") => void;
  onLogout: () => void;
  unclaimedVoucherCount: number;
  isPlayingMusic: boolean;
  onToggleMusic: () => void;
}

export function ExperienceHub({
  onSelectExperience,
  onLogout,
  unclaimedVoucherCount,
  isPlayingMusic,
  onToggleMusic,
}: ExperienceHubProps) {
  const [relationshipDays, setRelationshipDays] = useState(230);

  useEffect(() => {
    const start = new Date(monthsaryConfig.startDate).getTime();
    const now = new Date().getTime();
    const days = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    setRelationshipDays(Math.max(days, 0));
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between p-4 sm:p-8 bg-zinc-950 text-white font-sans overflow-hidden">
      {/* Background Ambience Glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-rose-900/20 via-zinc-950 to-black" />

      {/* Top Header Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center text-white font-black text-xs shadow-md">
            A
          </div>
          <span className="font-bold text-sm text-zinc-300">Angel's Space</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMusic}
            aria-label={isPlayingMusic ? "Mute music" : "Play music"}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white transition-all shadow-md active:scale-95"
          >
            {isPlayingMusic ? <Volume2 size={14} className="text-rose-500 animate-pulse" /> : <VolumeX size={14} />}
            <span>{isPlayingMusic ? "Music Playing" : "Play Music"}</span>
          </button>

          <button
            onClick={onLogout}
            aria-label="Log out"
            className="p-2 rounded-full bg-zinc-900/90 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-all active:scale-95"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Center Gateway Selector */}
      <div className="w-full max-w-4xl flex flex-col items-center justify-center my-auto py-8 z-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-2 mb-8"
        >
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-600/20 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Heart size={13} className="fill-rose-400" />
            <span>Happy 7th Monthsary, My Baby Angel</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight">
            Choose Your Experience
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-lg mx-auto">
            A romantic space created just for you. Explore our love letter and milestones, or stream our private cinema memories.
          </p>
        </motion.div>

        {/* Dual Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* Card 1: The Monthsary Love Letter */}
          <motion.button
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectExperience("letter")}
            className="group relative flex flex-col items-start text-left p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-zinc-900/90 via-zinc-900/80 to-rose-950/20 border border-zinc-800 hover:border-rose-400 shadow-2xl transition-all overflow-hidden focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Mail size={120} className="text-rose-400" />
            </div>

            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-6 group-hover:scale-110 transition-transform">
              <Mail size={24} />
            </div>

            <div className="space-y-2 mb-6 z-10">
              <h2 className="text-2xl font-bold text-white group-hover:text-rose-400 transition-colors font-display">
                The Love Letter
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
                Our complete 7-month love letter, interactive chapter timeline, photo memories, reaction response, and redeemable couple vouchers.
              </p>
            </div>

            <div className="mt-auto w-full pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-semibold text-zinc-400 z-10">
              <span className="flex items-center gap-1.5 text-rose-400">
                <Heart size={14} className="fill-rose-500 text-rose-500" />
                {relationshipDays} Days in Love
              </span>
              {unclaimedVoucherCount > 0 && (
                <span className="flex items-center gap-1 text-amber-400">
                  <Ticket size={13} />
                  {unclaimedVoucherCount} Vouchers
                </span>
              )}
            </div>
          </motion.button>

          {/* Card 2: AngelFlix Private Cinema */}
          <motion.button
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectExperience("angelflix")}
            className="group relative flex flex-col items-start text-left p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-zinc-900/90 via-zinc-900/80 to-zinc-950 border border-zinc-800 hover:border-rose-600 shadow-2xl transition-all overflow-hidden focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Film size={120} className="text-rose-600" />
            </div>

            <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-600/40 flex items-center justify-center text-rose-500 mb-6 group-hover:scale-110 transition-transform">
              <Film size={24} />
            </div>

            <div className="space-y-2 mb-6 z-10">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white group-hover:text-rose-500 transition-colors font-display">
                  AngelFlix Cinema
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-rose-600 text-white shadow">
                  Cinema
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
                A Love Worth Remembering. Stream our private moments, recent memories, funny clips, and favorite photo reels in cinematic mode.
              </p>
            </div>

            <div className="mt-auto w-full pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-semibold text-zinc-400 z-10">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Sparkles size={14} className="text-rose-400" />
                Private Cinema Mode
              </span>
              <span className="text-rose-500 font-bold">Watch Now →</span>
            </div>
          </motion.button>
        </div>
      </div>

      {/* Bottom Footer Credits */}
      <footer className="w-full text-center text-xs text-zinc-400 py-2 z-20">
        Forever and always yours · Happy 7th Monthsary
      </footer>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test src/components/__tests__/ExperienceHub.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ExperienceHub.tsx src/components/__tests__/ExperienceHub.test.tsx
git commit -m "feat: add ExperienceHub gateway selection component"
```

---

### Task 5: App Integration & Navigation Updates (`App.tsx` & `PastMonthsaryNavbar.tsx`)

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/PastMonthsaryNavbar.tsx`

**Interfaces:**
- Synchronize experience mode (`"hub" | "letter" | "angelflix"`) in `App.tsx`
- Add `"🎬 AngelFlix"` and `"🏠 Hub"` navigation options in `PastMonthsaryNavbar.tsx`.

- [ ] **Step 1: Update `PastMonthsaryNavbar.tsx` with AngelFlix and Hub switch buttons**

Update `PastMonthsaryNavbar.tsx` to include `onOpenAngelFlix?: () => void` and `onBackToHub?: () => void`.

- [ ] **Step 2: Update `App.tsx` with View Mode Management**

Connect `ExperienceHub`, `AngelFlix`, and the existing Letter experience with smooth transitions and persistent state.

- [ ] **Step 3: Run all unit and integration tests**

Run: `npm test`
Expected: All test suites PASS

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/components/PastMonthsaryNavbar.tsx
git commit -m "feat: integrate ExperienceHub and AngelFlix into App navigation"
```

---

### Task 6: Final Verification & Smoke Testing

- [ ] **Step 1: Run TypeScript type check**
Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: Run full build**
Run: `npm run build`
Expected: Build successfully created in `dist/`

- [ ] **Step 3: Verify with end-to-end component tests**
Run: `npm test`
Expected: 100% tests passing

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Heart,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Mail,
  Home,
  Star,
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

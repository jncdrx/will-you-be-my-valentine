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

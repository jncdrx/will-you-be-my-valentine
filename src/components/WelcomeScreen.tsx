import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles, Volume2, VolumeX, Lock, Mail } from "lucide-react";
import confetti from "canvas-confetti";
import { monthsaryConfig } from "../config/monthsaryConfig";

interface WelcomeScreenProps {
  onOpenLetter: () => void;
  isPlayingMusic: boolean;
  onToggleMusic: () => void;
}

export function WelcomeScreen({ onOpenLetter, isPlayingMusic, onToggleMusic }: WelcomeScreenProps) {
  const [heartTapCount, setHeartTapCount] = useState(0);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [relationshipTime, setRelationshipTime] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Calculate elapsed duration
  useEffect(() => {
    const startDate = new Date(monthsaryConfig.startDate).getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      
      // Elapsed relationship duration
      const diff = Math.max(0, now - startDate);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setRelationshipTime({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Easter Egg: Tapping heart 7 times unlocks secret modal!
  const handleHeartTap = () => {
    const nextCount = heartTapCount + 1;
    setHeartTapCount(nextCount);

    confetti({
      particleCount: 20,
      spread: 40,
      origin: { y: 0.6 },
      colors: ["#be185d", "#ec4899", "#f43f5e"],
    });

    if (nextCount >= 7) {
      setShowSecretModal(true);
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
        colors: ["#be185d", "#ec4899", "#f59e0b", "#a855f7"],
      });
      setHeartTapCount(0);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center p-4 max-w-xl w-full my-auto text-center z-10"
    >
      {/* Top Floating Music Control */}
      <div className="w-full flex justify-end mb-2 px-2">
        <button
          onClick={onToggleMusic}
          className="flex items-center gap-1.5 rounded-full bg-white/80 px-3.5 py-1.5 text-xs font-bold text-rose-700 shadow-md backdrop-blur-md border border-rose-200 hover:bg-white transition-all min-h-[36px]"
          aria-label={isPlayingMusic ? "Mute music" : "Play music"}
        >
          {isPlayingMusic ? <Volume2 size={14} className="animate-pulse text-rose-500" /> : <VolumeX size={14} />}
          <span>{isPlayingMusic ? "Music Playing" : "Play Music"}</span>
        </button>
      </div>

      {/* Main Bear Illustration */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="relative mb-3 cursor-pointer"
        onClick={handleHeartTap}
      >
        <img
          src="https://gifdb.com/images/high/cute-love-bear-roses-ou7zho5oosxnpo6k.gif"
          alt="Romantic Love Bear"
          className="h-[210px] sm:h-[250px] w-auto drop-shadow-2xl mx-auto"
        />

        {/* Floating Heart Tap Counter badge */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-3.5 py-1 rounded-full border border-rose-200 shadow-md flex items-center gap-1.5">
          <Heart size={14} className="fill-rose-500 text-rose-500 animate-bounce" />
          <span className="text-[11px] font-extrabold text-rose-700">
            {heartTapCount > 0 ? `${heartTapCount} / 7 Taps` : "Tap heart for a secret"}
          </span>
        </div>
      </motion.div>

      {/* Main Title */}
      <h1 className="mt-4 text-4xl sm:text-6xl font-bold text-rose-600 font-display drop-shadow-sm leading-tight">
        {monthsaryConfig.monthsaryTitle}
      </h1>

      <p className="mt-3 text-base sm:text-lg text-rose-900/90 font-medium leading-relaxed max-w-md">
        {monthsaryConfig.shortGreeting}
      </p>

      {/* Relationship Duration Counter */}
      <div className="my-6 w-full bg-white/75 backdrop-blur-md p-4 rounded-3xl border border-white/90 shadow-xl">
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <Sparkles size={16} className="text-amber-400" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-rose-600 font-sans">
            In Love For 7 Months & Counting
          </span>
          <Sparkles size={16} className="text-amber-400" />
        </div>

        <div className="grid grid-cols-4 gap-2 text-rose-950 font-bold">
          <div className="bg-rose-50/80 rounded-2xl p-2 border border-rose-200">
            <span className="text-xl sm:text-3xl font-extrabold text-rose-600 block">{relationshipTime.days}</span>
            <span className="text-[10px] uppercase text-rose-500">Days</span>
          </div>
          <div className="bg-rose-50/80 rounded-2xl p-2 border border-rose-200">
            <span className="text-xl sm:text-3xl font-extrabold text-rose-600 block">{relationshipTime.hours}</span>
            <span className="text-[10px] uppercase text-rose-500">Hours</span>
          </div>
          <div className="bg-rose-50/80 rounded-2xl p-2 border border-rose-200">
            <span className="text-xl sm:text-3xl font-extrabold text-rose-600 block">{relationshipTime.minutes}</span>
            <span className="text-[10px] uppercase text-rose-500">Mins</span>
          </div>
          <div className="bg-rose-50/80 rounded-2xl p-2 border border-rose-200">
            <span className="text-xl sm:text-3xl font-extrabold text-rose-600 block">{relationshipTime.seconds}</span>
            <span className="text-[10px] uppercase text-rose-500">Secs</span>
          </div>
        </div>
      </div>

      {/* Open Letter CTA Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onOpenLetter}
        className="rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 px-8 py-4 text-lg font-bold text-white shadow-xl hover:shadow-2xl transition-all flex items-center gap-2.5 min-h-[52px]"
      >
        <Mail size={18} />
        <span>Open My Letter</span>
      </motion.button>

      {/* Secret Easter Egg Modal */}
      <AnimatePresence>
        {showSecretModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSecretModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 max-w-md w-full text-center shadow-2xl border-2 border-rose-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-3">
                <button
                  onClick={() => setShowSecretModal(false)}
                  className="rounded-full bg-rose-100 p-1.5 text-rose-600 font-bold hover:bg-rose-200"
                >
                  ✕
                </button>
              </div>

              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-3 text-rose-500">
                <Lock size={22} />
              </div>

              <h3 className="text-2xl font-bold font-display text-rose-600 mb-2 flex items-center justify-center gap-1.5">
                <span>Secret Note Unlocked</span>
                <Heart size={18} className="fill-rose-500 text-rose-500" />
              </h3>

              <p className="text-sm sm:text-base text-gray-700 font-serif leading-relaxed whitespace-pre-line mb-6 bg-rose-50/70 p-4 rounded-2xl border border-rose-200">
                {monthsaryConfig.secretEasterEggMessage}
              </p>

              <button
                onClick={() => setShowSecretModal(false)}
                className="rounded-full bg-rose-500 text-white font-bold px-6 py-2.5 shadow-md hover:bg-rose-600 transition-colors"
              >
                Close Secret Note
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

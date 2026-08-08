import { useState, useRef, useEffect } from "react";
import { Disc3, Pause, Play, Music2, RotateCcw, Volume2, VolumeX, ListMusic } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Howl } from "howler";
import { Song } from "../lib/supabase";

interface MusicPlayerProps {
  currentSong?: Song | null;
  onOpenSelector?: () => void;
}

export function MusicPlayer({ currentSong, onOpenSelector }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeControls, setShowVolumeControls] = useState(false);
  const soundRef = useRef<Howl | null>(null);

  const defaultUrl = `${import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`}music/nothing.mp3`;
  const activeUrl = currentSong?.mp3_url || defaultUrl;
  const activeTitle = currentSong ? `${currentSong.artist} — ${currentSong.title}` : "Bruno Major — Nothing";

  // Re-initialize Howl instance when active URL changes
  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.unload();
    }

    const sound = new Howl({
      src: [activeUrl],
      loop: true,
      volume: isMuted ? 0 : volume,
      html5: true,
      onplay: () => setIsPlaying(true),
      onpause: () => setIsPlaying(false),
      onstop: () => setIsPlaying(false),
    });

    soundRef.current = sound;

    // Autoplay rule: start on first pointer/key interaction
    const handleInteraction = () => {
      if (soundRef.current && !soundRef.current.playing()) {
        soundRef.current.play();
      }
      document.removeEventListener("pointerdown", handleInteraction);
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
    };

    document.addEventListener("pointerdown", handleInteraction);
    document.addEventListener("click", handleInteraction);
    document.addEventListener("keydown", handleInteraction);

    return () => {
      document.removeEventListener("pointerdown", handleInteraction);
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
      sound.unload();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUrl]);

  // Handle volume changes
  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.volume(isMuted ? 0 : volume);
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!soundRef.current) return;
    if (isPlaying) {
      soundRef.current.pause();
    } else {
      soundRef.current.play();
    }
  };

  const handleRestart = () => {
    if (!soundRef.current) return;
    soundRef.current.seek(0);
    if (!isPlaying) {
      soundRef.current.play();
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      {/* Expanding Control Bar */}
      <motion.div className="flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-rose-600 shadow-2xl backdrop-blur-md border border-rose-200 opacity-95 hover:opacity-100 transition-all duration-300">
        
        {/* Open Music Library Selector Modal */}
        {onOpenSelector && (
          <button
            onClick={onOpenSelector}
            aria-label="Choose Music Track"
            className="min-w-[44px] min-h-[44px] rounded-full hover:bg-rose-100 text-rose-600 transition flex items-center justify-center gap-1 font-bold text-[11px] active:scale-95"
            title="Choose Music Track"
          >
            <ListMusic size={16} />
            <span className="hidden md:inline">Playlist</span>
          </button>
        )}

        {/* Current Song Title & Visualizer */}
        <div className="flex items-center gap-2 px-2 border-x border-rose-100 max-w-[170px] sm:max-w-[240px] truncate">
          <Music2 size={13} className={isPlaying ? "animate-spin text-rose-500 shrink-0" : "text-gray-400 shrink-0"} />
          <span className="font-sans truncate text-[11px] sm:text-xs font-medium text-gray-800" title={activeTitle}>
            {activeTitle}
          </span>

          {/* Equalizer Visualizer */}
          {isPlaying && (
            <div className="flex items-end gap-0.5 h-3 shrink-0">
              <motion.span
                animate={{ height: ["20%", "100%", "40%", "80%"] }}
                transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }}
                className="w-0.5 bg-rose-500 rounded-full block"
              />
              <motion.span
                animate={{ height: ["60%", "30%", "100%", "50%"] }}
                transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut", delay: 0.1 }}
                className="w-0.5 bg-pink-500 rounded-full block"
              />
              <motion.span
                animate={{ height: ["40%", "90%", "20%", "100%"] }}
                transition={{ repeat: Infinity, duration: 0.7, ease: "easeInOut", delay: 0.2 }}
                className="w-0.5 bg-rose-600 rounded-full block"
              />
            </div>
          )}
        </div>

        {/* Restart Button */}
        <button
          onClick={handleRestart}
          aria-label="Restart song"
          className="min-w-[44px] min-h-[44px] rounded-full hover:bg-rose-100 text-gray-600 hover:text-rose-600 transition flex items-center justify-center active:scale-95"
          title="Restart song"
        >
          <RotateCcw size={15} />
        </button>

        {/* Volume Controls Toggle */}
        <div className="relative flex items-center">
          <button
            onClick={toggleMute}
            onMouseEnter={() => setShowVolumeControls(true)}
            aria-label={isMuted ? "Unmute sound" : "Mute sound"}
            className="min-w-[44px] min-h-[44px] rounded-full hover:bg-rose-100 text-gray-600 hover:text-rose-600 transition flex items-center justify-center active:scale-95"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted || volume === 0 ? <VolumeX size={15} className="text-red-500" /> : <Volume2 size={15} />}
          </button>

          {/* Volume Slider Tooltip */}
          <AnimatePresence>
            {showVolumeControls && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                onMouseLeave={() => setShowVolumeControls(false)}
                className="absolute bottom-12 right-0 bg-white p-2.5 rounded-2xl shadow-xl border border-rose-200 flex items-center gap-2 z-50 min-w-[130px]"
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setIsMuted(false);
                    setVolume(parseFloat(e.target.value));
                  }}
                  aria-label="Volume slider"
                  className="w-20 accent-rose-500 cursor-pointer h-1 bg-rose-100 rounded-lg"
                />
                <span className="text-[10px] font-mono text-gray-600 min-w-[28px]">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Main Play / Pause Disc Button */}
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={togglePlay}
        aria-label={isPlaying ? "Pause music" : "Play music"}
        className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 p-3 text-white shadow-2xl backdrop-blur-md transition-all hover:shadow-rose-300 min-h-[48px] min-w-[48px] justify-center shrink-0 active:scale-95"
      >
        <motion.div
          animate={{ rotate: isPlaying ? 360 : 0 }}
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
        >
          <Disc3 size={24} className="text-white" />
        </motion.div>
        {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
      </motion.button>
    </div>
  );
}

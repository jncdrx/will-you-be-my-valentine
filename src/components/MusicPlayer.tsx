import { useState, useRef, useEffect } from "react";
import { Disc3, Pause, Play, Music2 } from "lucide-react";
import { motion } from "framer-motion";

export function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const baseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const songUrl = `${baseUrl}music/nothing.mp3`;

  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((e) => console.error("Playback failed", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.5;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.log("Auto-play prevented:", error);
          setIsPlaying(false);
        });
    }

    const handleInteraction = () => {
      if (audio.paused) {
        audio.play()
          .then(() => setIsPlaying(true))
          .catch(e => console.error("Play failed after interaction:", e));
      }
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };

    if (audio.paused) {
      document.addEventListener('click', handleInteraction);
      document.addEventListener('keydown', handleInteraction);
    }

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <audio ref={audioRef} src={songUrl} loop autoPlay />
      <div className="relative group flex items-center gap-2">
        {/* Animated Song Title & Audio Equalizer Badge */}
        <div className="flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-2 text-xs font-semibold text-rose-600 shadow-xl backdrop-blur-md border border-rose-200 opacity-90 hover:opacity-100 transition-all duration-300">
          <Music2 size={13} className={isPlaying ? "animate-spin text-rose-500" : "text-gray-400"} />
          <span className="hidden sm:inline font-sans">Bruno Major — Nothing</span>

          {/* Equalizer Visualizer Bars */}
          {isPlaying && (
            <div className="flex items-end gap-0.5 h-3 ml-1">
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

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause music" : "Play music"}
          className="flex items-center gap-2 rounded-full bg-white/95 p-3 text-rose-600 shadow-xl backdrop-blur-md border border-rose-200 transition-all hover:bg-white hover:text-rose-700 min-h-[48px] min-w-[48px] justify-center"
        >
          <motion.div
            animate={{ rotate: isPlaying ? 360 : 0 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          >
            <Disc3 size={24} className={isPlaying ? "text-rose-500" : "text-gray-400"} />
          </motion.div>
          {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </motion.button>
      </div>
    </div>
  );
}

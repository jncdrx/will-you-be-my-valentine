import { useState, useRef, useEffect } from "react";
import { Music, Pause, Play } from "lucide-react";
import { motion } from "framer-motion";

export function MusicPlayer() {
    const [isPlaying, setIsPlaying] = useState(false);
    // Song: "Nothing" by Bruno Major
    // Ensure properly formatted URL handling for base path
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

        // Attempt auto-play
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

        // Global click listener for fallback
        const handleInteraction = () => {
            if (audio.paused) {
                audio.play()
                    .then(() => setIsPlaying(true))
                    .catch(e => console.error("Play failed after interaction:", e));
            }
            // Once we've tried to play, remove this listener
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
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={togglePlay}
                className="flex items-center gap-2 rounded-full bg-white/80 p-3 text-rose-600 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:text-rose-700 hover:shadow-xl"
            >
                <Music size={20} className={isPlaying ? "animate-pulse" : ""} />
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </motion.button>
        </div>
    );
}

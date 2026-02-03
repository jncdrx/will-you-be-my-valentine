import { useState, useRef, useEffect } from "react";
import { Music, Pause, Play } from "lucide-react";
import { motion } from "framer-motion";

export function MusicPlayer() {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Song: "Can't Help Falling In Love" (Cover or similar romantic instrumental)
    // Using a royalty-free placeholder for now that feels romantic
    const songUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

    useEffect(() => {
        audioRef.current = new Audio(songUrl);
        audioRef.current.loop = true;
        audioRef.current.volume = 0.5;

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch((e) => console.log("Playback failed", e));
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
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

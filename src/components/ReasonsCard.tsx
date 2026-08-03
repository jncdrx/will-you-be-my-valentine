import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

const reasons = [
    "Your beautiful smile that lights up my day",
    "How you make everyone around you feel special",
    "The way you laugh at my silly jokes",
    "Your kindness and pure heart",
    "How you look at me with those pretty eyes",
    "Being the best thing that ever happened to me",
    "Just being YOU, Angelica ❤️"
];

export function ReasonsCard() {
    const [index, setIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (isPaused) return;
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % reasons.length);
        }, 4500);
        return () => clearInterval(timer);
    }, [isPaused]);

    const triggerHeartBurst = () => {
        confetti({
            particleCount: 25,
            spread: 40,
            origin: { y: 0.7 },
            colors: ["#be185d", "#ec4899", "#f43f5e"],
        });
    };

    const handleNext = () => {
        setIndex((prev) => (prev + 1) % reasons.length);
        triggerHeartBurst();
    };

    const handlePrev = () => {
        setIndex((prev) => (prev - 1 + reasons.length) % reasons.length);
        triggerHeartBurst();
    };

    return (
        <div className="my-8 w-full max-w-md px-4 mx-auto select-none">
            <div
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                className="relative overflow-hidden rounded-3xl bg-white/70 p-6 md:p-8 shadow-xl backdrop-blur-md border border-white/80 transition-all duration-300 hover:shadow-2xl"
            >
                <div className="absolute top-0 right-0 -mt-6 -mr-6 h-28 w-28 rounded-full bg-rose-200/60 blur-xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -mb-6 -ml-6 h-28 w-28 rounded-full bg-purple-200/60 blur-xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col items-center text-center">
                    <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="cursor-pointer"
                        onClick={triggerHeartBurst}
                    >
                        <Heart className="mb-2 text-rose-500 fill-rose-500 drop-shadow-sm" size={36} />
                    </motion.div>

                    <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles size={14} className="text-amber-400" />
                        <h3 className="text-xs font-bold text-rose-600 uppercase tracking-widest font-sans">
                            Reason I Love You #{index + 1}
                        </h3>
                        <Sparkles size={14} className="text-amber-400" />
                    </div>

                    <div className="h-28 flex items-center justify-center px-2">
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={index}
                                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -15, scale: 0.95 }}
                                transition={{ duration: 0.35 }}
                                className="text-xl md:text-2xl font-serif text-rose-800 italic font-semibold leading-snug"
                            >
                                "{reasons[index]}"
                            </motion.p>
                        </AnimatePresence>
                    </div>

                    {/* Navigation buttons */}
                    <div className="mt-4 flex items-center justify-between w-full px-4">
                        <button
                            onClick={handlePrev}
                            className="flex items-center justify-center w-9 h-9 rounded-full bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors shadow-sm min-h-[36px] min-w-[36px]"
                            aria-label="Previous reason"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        <div className="flex gap-1.5">
                            {reasons.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setIndex(i);
                                        triggerHeartBurst();
                                    }}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                        i === index ? "w-6 bg-rose-500" : "w-1.5 bg-rose-200 hover:bg-rose-300"
                                    }`}
                                    aria-label={`Reason ${i + 1}`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={handleNext}
                            className="flex items-center justify-center w-9 h-9 rounded-full bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors shadow-sm min-h-[36px] min-w-[36px]"
                            aria-label="Next reason"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}


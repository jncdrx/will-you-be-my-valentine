import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";

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

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % reasons.length);
        }, 4000); // Change every 4 seconds
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="my-8 w-full max-w-md px-4">
            <div className="relative overflow-hidden rounded-2xl bg-white/40 p-6 md:p-8 shadow-xl backdrop-blur-md border border-white/50">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-rose-200/50 blur-xl"></div>
                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-purple-200/50 blur-xl"></div>

                <div className="relative z-10 flex flex-col items-center text-center">
                    <Heart className="mb-4 text-rose-500 animate-pulse" fill="#f43f5e" size={32} />
                    <h3 className="mb-4 text-xl font-bold text-gray-800 uppercase tracking-wider">Reason I Love You #{index + 1}</h3>

                    <div className="h-24 flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="text-2xl font-serif text-rose-700 italic font-semibold"
                            >
                                "{reasons[index]}"
                            </motion.p>
                        </AnimatePresence>
                    </div>

                    <div className="mt-4 flex gap-2">
                        {reasons.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'w-8 bg-rose-500' : 'w-2 bg-rose-200'}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

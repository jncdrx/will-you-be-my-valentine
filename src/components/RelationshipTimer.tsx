import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

const START_DATE = new Date("2026-01-04");

export function RelationshipTimer() {
    const [time, setTime] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    });

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const difference = now.getTime() - START_DATE.getTime();

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);

            setTime({ days, hours, minutes, seconds });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="my-8 text-center px-4 max-w-xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-3">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>
                    <Heart className="text-rose-500 fill-rose-500" size={20} />
                </motion.div>
                <h3 className="text-lg md:text-xl font-bold text-rose-700 font-display">
                    Falling in love for...
                </h3>
            </div>

            <div className="grid grid-cols-4 gap-2 md:gap-4 text-rose-900">
                <TimeUnit value={time.days} label="Days" />
                <TimeUnit value={time.hours} label="Hours" />
                <TimeUnit value={time.minutes} label="Mins" />
                <TimeUnit value={time.seconds} label="Secs" />
            </div>
        </div>
    );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col items-center">
            <div className="relative w-full rounded-2xl bg-gradient-to-b from-white/90 to-rose-50/80 p-[1.5px] shadow-lg border border-white/80 backdrop-blur-md">
                <motion.div
                    key={value}
                    initial={{ y: -8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center justify-center text-2xl md:text-4xl font-extrabold text-rose-600 py-2.5 md:py-3.5 px-2"
                >
                    {value.toString().padStart(2, "0")}
                </motion.div>
            </div>
            <span className="text-[10px] md:text-xs mt-1.5 font-bold uppercase tracking-wider text-rose-500">
                {label}
            </span>
        </div>
    );
}


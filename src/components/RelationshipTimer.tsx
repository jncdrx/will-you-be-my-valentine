import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export function RelationshipTimer() {
    const [time, setTime] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    });

    // START DATE: Change this to your actual anniversary date!
    // Format: YYYY-MM-DD
    const startDate = new Date("2026-01-04");

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const difference = now.getTime() - startDate.getTime();

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);

            setTime({ days, hours, minutes, seconds });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="my-8 text-center px-4">
            <h3 className="mb-4 text-xl font-bold text-rose-600 font-display">Falling in love for...</h3>
            <div className="flex justify-center gap-2 md:gap-4 text-rose-800 flex-wrap">
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
            <motion.div
                key={value}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-2xl md:text-3xl font-bold bg-white/50 backdrop-blur-sm rounded-lg p-2 md:p-3 min-w-[60px] md:min-w-[70px] shadow-sm"
            >
                {value}
            </motion.div>
            <span className="text-xs mt-1 font-semibold uppercase tracking-wide opacity-70">{label}</span>
        </div>
    );
}

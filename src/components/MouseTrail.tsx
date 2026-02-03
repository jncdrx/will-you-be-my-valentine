import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface HeartTrail {
    id: number;
    x: number;
    y: number;
}

export function MouseTrail() {
    const [trail, setTrail] = useState<HeartTrail[]>([]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent | TouchEvent) => {
            let clientX, clientY;
            if ('touches' in e) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = (e as MouseEvent).clientX;
                clientY = (e as MouseEvent).clientY;
            }

            // Add heart to trail
            // Use performance.now() + random to ensure uniqueness
            const newHeart = { id: performance.now() + Math.random(), x: clientX, y: clientY };
            setTrail((prev) => [...prev.slice(-15), newHeart]); // Keep last 15 hearts
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("touchmove", handleMouseMove);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("touchmove", handleMouseMove);
        };
    }, []);

    return (
        <>
            {trail.map((t) => (
                <motion.div
                    key={t.id}
                    initial={{ opacity: 1, scale: 1 }}
                    animate={{ opacity: 0, scale: 0, y: -20 }}
                    transition={{ duration: 0.8 }}
                    className="pointer-events-none fixed text-rose-500 z-50 text-xl"
                    style={{ left: t.x, top: t.y }}
                >
                    ❤️
                </motion.div>
            ))}
        </>
    );
}

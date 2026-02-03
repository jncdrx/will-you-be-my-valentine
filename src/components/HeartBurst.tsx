import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Burst {
    id: number;
    x: number;
    y: number;
}

export function HeartBurst() {
    const [bursts, setBursts] = useState<Burst[]>([]);

    useEffect(() => {
        const handleClick = (e: MouseEvent | TouchEvent) => {
            let clientX, clientY;
            if ('touches' in e) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = (e as MouseEvent).clientX;
                clientY = (e as MouseEvent).clientY;
            }

            const newBurst = { id: Date.now(), x: clientX, y: clientY };
            setBursts((prev) => [...prev, newBurst]);

            // clean up after animation
            setTimeout(() => {
                setBursts((prev) => prev.filter((b) => b.id !== newBurst.id));
            }, 1000);
        };

        window.addEventListener("click", handleClick);
        // removing touchstart to avoid double firing with click on some devices, 
        // or we can debounce. 'click' usually covers tap on mobile too for this purpose.
        // simpler is better for "bursts". 

        return () => {
            window.removeEventListener("click", handleClick);
        };
    }, []);

    return (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
            <AnimatePresence>
                {bursts.map((burst) => (
                    <BurstParticles key={burst.id} x={burst.x} y={burst.y} />
                ))}
            </AnimatePresence>
        </div>
    );
}

function BurstParticles({ x, y }: { x: number; y: number }) {
    // Generate a few particles
    const particles = Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * 360;
        return {
            id: i,
            angle,
            distance: Math.random() * 50 + 30, // Random distance 30-80px
        };
    });

    return (
        <>
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    initial={{ opacity: 1, x, y, scale: 0.5 }}
                    animate={{
                        opacity: 0,
                        x: x + Math.cos(p.angle * Math.PI / 180) * p.distance,
                        y: y + Math.sin(p.angle * Math.PI / 180) * p.distance,
                        scale: 0
                    }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute text-rose-500 text-lg"
                >
                    ❤️
                </motion.div>
            ))}
        </>
    );
}

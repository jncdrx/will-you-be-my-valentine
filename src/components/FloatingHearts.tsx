import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export function FloatingHearts() {
    // Use a ref or local state for mouse position if needed, but for background hearts, 
    // relying on a simpler animation or a less frequent update is better for performance.
    // The original used mousePos to slightly shift the hearts. We can keep that listener local here.

    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Throttle potential if needed, but React state updates batching might handle it reasonably well for this simple case
            // However, updating state on every mouse move is what caused the original lag.
            // Let's optimize by not binding this purely to React state for the *entire* app.
            // Since this is just this component now, it's better.
            setMousePos({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: "110vh", x: Math.random() * 100 + "vw" }}
                    animate={{
                        opacity: [0, 0.8, 0],
                        y: "-10vh",
                        x: Math.random() * 100 + "vw",
                        rotate: [0, 180, 360],
                    }}
                    transition={{
                        duration: Math.random() * 15 + 10,
                        repeat: Infinity,
                        delay: Math.random() * 10,
                        ease: "linear",
                    }}
                    style={{
                        translateX: (mousePos.x * 0.02 * (i % 2 === 0 ? 1 : -1)),
                        translateY: (mousePos.y * 0.02 * (i % 2 === 0 ? 1 : -1)),
                    }}
                    className="absolute text-5xl text-rose-300/30 blur-[2px]"
                >
                    ❤
                </motion.div>
            ))}
        </div>
    );
}

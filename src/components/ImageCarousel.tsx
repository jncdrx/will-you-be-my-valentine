import { useRef } from "react";
import { motion } from "framer-motion";

const photos = [
    "/will-you-be-my-valentine/images/us1.jpg",
    "/will-you-be-my-valentine/images/us2.jpg",
    "/will-you-be-my-valentine/images/us3.jpg",
    "/will-you-be-my-valentine/images/us4.jpg"
];

export function ImageCarousel() {
    const containerRef = useRef<HTMLDivElement>(null);
    // const { scrollXProgress } = useScroll({ container: containerRef });

    return (
        <div className="my-8 w-full max-w-3xl">
            <h3 className="mb-4 text-center text-3xl text-rose-600 font-bold font-display">Our Memories</h3>

            {/* Scrollable Container */}
            <div
                ref={containerRef}
                className="flex gap-4 overflow-x-auto pb-8 px-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-rose-300 scrollbar-track-transparent"
                style={{ scrollBehavior: 'smooth' }}
            >
                {photos.map((src, index) => (
                    <motion.div
                        key={index}
                        className="relative flex-shrink-0 snap-center"
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="h-64 w-48 overflow-hidden rounded-xl shadow-lg border-4 border-white/50 rotate-1 odd:-rotate-1 hover:rotate-0 transition-transform duration-300">
                            <img src={src} alt={`Memory ${index + 1}`} className="h-full w-full object-cover" />
                        </div>
                    </motion.div>
                ))}
            </div>
            <p className="text-center text-sm text-gray-500 italic mt-2 animate-pulse">Swipe to see more...</p>
        </div>
    );
}

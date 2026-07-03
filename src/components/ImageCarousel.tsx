import { useRef, useState } from "react";
import { motion } from "framer-motion";

const baseUrl = import.meta.env.BASE_URL;
const withBase = (path: string) => `${baseUrl.replace(/\/?$/, "/")}${path.replace(/^\//, "")}`;

type MemoryItem = {
    src: string;
    caption: string;
};

const firstMemories: MemoryItem[] = [
    {
        src: withBase("images/first_memories/us1.jpg"),
        caption: "Our beginning, forever special 💖"
    },
    {
        src: withBase("images/first_memories/us2.jpg"),
        caption: "The smiles that started it all ✨"
    },
    {
        src: withBase("images/first_memories/us3.jpg"),
        caption: "First memories, same favorite person 🥰"
    },
    {
        src: withBase("images/first_memories/us4.jpg"),
        caption: "Every first with you is magic 💌"
    }
];

const secondMemories: MemoryItem[] = [
    {
        src: withBase("images/seond_memories/367dff07-ffbb-411d-8f91-b03a57cc49a0.jpg"),
        caption: "A moment I'll always keep close 💗"
    },
    {
        src: withBase("images/seond_memories/36fd68b4-846b-484b-a83c-0f4b5845b726.jpg"),
        caption: "Tofi, our fourth rabbit — so cute and special to us 🐰✨"
    },
    {
        src: withBase("images/seond_memories/4a5d4778-b71c-456e-88fb-94283270d9a6.jpg"),
        caption: "One smile from you, complete day 🥰"
    },
    {
        src: withBase("images/seond_memories/5bf162c1-388a-41cb-9afe-2f39a19ca1c8.jpg"),
        caption: "Favorite person, favorite memory 📸"
    },
    {
        src: withBase("images/seond_memories/b3b7a383-87e9-4692-aa0e-b2f189ab8e66.jpg"),
        caption: "Still my happiest place — you 💞"
    },
    {
        src: withBase("images/seond_memories/dc10f935-4701-4f8f-9f8f-07d9b9a4b1d9.jpg"),
        caption: "More memories, more love, always 💌"
    }
];

const thirdMemories: MemoryItem[] = [
    {
        src: withBase("images/third_memories/couple_watercolor.png"),
        caption: "Our love story in color, sweet and beautiful 🎨💖"
    },
    {
        src: withBase("images/third_memories/starlit_walk.png"),
        caption: "Under the stars, holding the one who lights up my world 🌌💞"
    },
    {
        src: withBase("images/third_memories/cherry_blossom.png"),
        caption: "Caught in a shower of pink blossoms and pure happiness 🌸✨"
    },
    {
        src: withBase("images/third_memories/milkshake_share.png"),
        caption: "Sharing sweet sips and even sweeter moments together 🥤💕"
    }
];

const fourthMemories: MemoryItem[] = [
    {
        src: withBase("images/fourth_memories/couple_sleeping.png"),
        caption: "Leaning on you is my absolute favorite comfort 💖"
    },
    {
        src: withBase("images/fourth_memories/bunny.png"),
        caption: "Another cute bunny to join our sweet adventure 🐰✨"
    },
    {
        src: withBase("images/fourth_memories/city_view.png"),
        caption: "Looking at the beautiful city lights, but my eyes are only on you 🌃✨"
    },
    {
        src: withBase("images/fourth_memories/sunset_walk.png"),
        caption: "Walking hand in hand into our bright, sweet future 🌅💞"
    }
];

function SwipeSection({
    chapter,
    memories,
}: {
    chapter: string;
    memories: MemoryItem[];
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeMemory, setActiveMemory] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        const container = containerRef.current;
        if (!container) return;
        setIsDragging(true);
        startX.current = e.pageX - container.offsetLeft;
        scrollLeft.current = container.scrollLeft;
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const container = containerRef.current;
        if (!container) return;
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX.current) * 1.1; // scroll speed multiplier
        container.scrollLeft = scrollLeft.current - walk;
    };

    const scrollToIndex = (index: number) => {
        const container = containerRef.current;
        if (!container) return;

        const nextIndex = Math.max(0, Math.min(index, memories.length - 1));
        const target = container.children[nextIndex] as HTMLElement | undefined;

        if (!target) return;

        const left = target.offsetLeft - (container.clientWidth - target.clientWidth) / 2;
        container.scrollTo({ left, behavior: "smooth" });
        setActiveMemory(nextIndex);
    };

    const goPrevious = () => {
        scrollToIndex(activeMemory - 1);
    };

    const goNext = () => {
        scrollToIndex(activeMemory + 1);
    };

    const handleScroll = () => {
        const container = containerRef.current;
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        const containerCenter = containerRect.left + containerRect.width / 2;

        let closestIndex = 0;
        let closestDistance = Number.POSITIVE_INFINITY;

        Array.from(container.children).forEach((child, index) => {
            const childRect = child.getBoundingClientRect();
            const childCenter = childRect.left + childRect.width / 2;
            const distance = Math.abs(containerCenter - childCenter);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;
            }
        });

        setActiveMemory(closestIndex);
    };

    return (
        <div className="mb-8 w-full select-none">
            <div
                ref={containerRef}
                onScroll={handleScroll}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                className={`flex gap-4 overflow-x-auto pb-8 px-4 scrollbar-thin scrollbar-thumb-rose-300 scrollbar-track-transparent ${isDragging ? "" : "snap-x snap-mandatory"}`}
                style={{ cursor: isDragging ? "grabbing" : "grab" }}
            >
                {memories.map((memory, index) => (
                    <motion.div
                        key={index}
                        className="relative flex-shrink-0 snap-center"
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: false, amount: 0.55 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="h-64 w-[170px] md:w-48 overflow-hidden rounded-xl shadow-lg border-4 border-white/50 rotate-1 odd:-rotate-1 hover:rotate-0 transition-transform duration-300 pointer-events-none">
                            <img src={memory.src} alt={`${chapter} memory ${index + 1}`} className="h-full w-full object-cover" draggable="false" />
                        </div>
                        <motion.p
                            initial={{ opacity: 0, y: 8, filter: "blur(2px)" }}
                            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            viewport={{ once: false, amount: 0.8 }}
                            transition={{ duration: 0.45, delay: 0.1 }}
                            className="mt-2 min-h-[38px] w-[170px] md:w-48 px-1 text-center text-xs leading-4 text-rose-500 font-medium italic"
                        >
                            {memory.caption}
                        </motion.p>
                    </motion.div>
                ))}
            </div>

            <p className="mt-1 text-center text-xs text-rose-500 font-semibold mb-2">
                Memory {activeMemory + 1} / {memories.length}
            </p>

            <div className="mb-3 flex items-center justify-center gap-2">
                <button
                    onClick={goPrevious}
                    disabled={activeMemory === 0}
                    className="rounded-full border border-rose-200 bg-white/80 px-3 py-1 text-xs font-semibold text-rose-600 shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                >
                    ← Prev
                </button>
                <button
                    onClick={goNext}
                    disabled={activeMemory === memories.length - 1}
                    className="rounded-full border border-rose-200 bg-white/80 px-3 py-1 text-xs font-semibold text-rose-600 shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Next →
                </button>
            </div>

            <div className="mb-2 flex items-center justify-center gap-1.5">
                {memories.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => scrollToIndex(index)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                            index === activeMemory ? "w-5 bg-rose-500" : "w-1.5 bg-rose-200"
                        }`}
                        aria-label={`Go to memory ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}

export function ImageCarousel({ activeChapter = 2 }: { activeChapter?: number }) {
    return (
        <div className="my-8 w-full max-w-3xl mx-auto">
            <h3 className="mb-4 text-center text-3xl text-rose-600 font-bold font-display">Our Memories</h3>

            {activeChapter === 2 && (
                <>
                    <div className="mb-2 text-center">
                        <p className="text-xs uppercase tracking-[0.2em] text-rose-400 font-semibold">Chapter 1: Our Beginning</p>
                    </div>
                    <SwipeSection chapter="Chapter 1" memories={firstMemories} />

                    <div className="mb-2 text-center mt-6">
                        <p className="text-xs uppercase tracking-[0.2em] text-rose-400 font-semibold">Chapter 2: 2nd Monthsary</p>
                    </div>
                    <SwipeSection chapter="Chapter 2" memories={secondMemories} />
                </>
            )}

            {activeChapter === 3 && (
                <>
                    <div className="mb-2 text-center">
                        <p className="text-xs uppercase tracking-[0.2em] text-rose-400 font-semibold">Chapter 3: 3rd Monthsary</p>
                    </div>
                    <SwipeSection chapter="Chapter 3" memories={thirdMemories} />
                </>
            )}

            {activeChapter === 4 && (
                <>
                    <div className="mb-2 text-center">
                        <p className="text-xs uppercase tracking-[0.2em] text-rose-400 font-semibold">Chapter 4: 4th Monthsary</p>
                    </div>
                    <SwipeSection chapter="Chapter 4" memories={fourthMemories} />
                </>
            )}
            <p className="text-center text-sm text-gray-500 italic mt-2 animate-pulse">Swipe to see more...</p>
        </div>
    );
}

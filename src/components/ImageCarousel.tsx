import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Maximize2, Heart, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import useEmblaCarousel from "embla-carousel-react";

const baseUrl = import.meta.env.BASE_URL;
const withBase = (path: string) => `${baseUrl.replace(/\/?$/, "/")}${path.replace(/^\//, "")}`;

type MemoryItem = {
    id: string;
    src: string;
    caption: string;
    chapterName: string;
};

const firstMemories: MemoryItem[] = [
    {
        id: "m1-1",
        src: withBase("images/first_memories/us1.jpg"),
        caption: "Our beginning, forever special",
        chapterName: "Chapter 1: Our Beginning",
    },
    {
        id: "m1-2",
        src: withBase("images/first_memories/us2.jpg"),
        caption: "The smiles that started it all",
        chapterName: "Chapter 1: Our Beginning",
    },
    {
        id: "m1-3",
        src: withBase("images/first_memories/us3.jpg"),
        caption: "First memories, same favorite person",
        chapterName: "Chapter 1: Our Beginning",
    },
    {
        id: "m1-4",
        src: withBase("images/first_memories/us4.jpg"),
        caption: "Every first with you is magic",
        chapterName: "Chapter 1: Our Beginning",
    }
];

const secondMemories: MemoryItem[] = [
    {
        id: "m2-1",
        src: withBase("images/seond_memories/367dff07-ffbb-411d-8f91-b03a57cc49a0.jpg"),
        caption: "A moment I'll always keep close",
        chapterName: "Chapter 2: 2nd Monthsary",
    },
    {
        id: "m2-2",
        src: withBase("images/seond_memories/36fd68b4-846b-484b-a83c-0f4b5845b726.jpg"),
        caption: "Tofi, our fourth rabbit — so cute and special to us",
        chapterName: "Chapter 2: 2nd Monthsary",
    },
    {
        id: "m2-3",
        src: withBase("images/seond_memories/4a5d4778-b71c-456e-88fb-94283270d9a6.jpg"),
        caption: "One smile from you, complete day",
        chapterName: "Chapter 2: 2nd Monthsary",
    },
    {
        id: "m2-4",
        src: withBase("images/seond_memories/5bf162c1-388a-41cb-9afe-2f39a19ca1c8.jpg"),
        caption: "Favorite person, favorite memory",
        chapterName: "Chapter 2: 2nd Monthsary",
    },
    {
        id: "m2-5",
        src: withBase("images/seond_memories/b3b7a383-87e9-4692-aa0e-b2f189ab8e66.jpg"),
        caption: "Still my happiest place — you",
        chapterName: "Chapter 2: 2nd Monthsary",
    },
    {
        id: "m2-6",
        src: withBase("images/seond_memories/dc10f935-4701-4f8f-9f8f-07d9b9a4b1d9.jpg"),
        caption: "More memories, more love, always",
        chapterName: "Chapter 2: 2nd Monthsary",
    }
];

const thirdMemories: MemoryItem[] = [
    {
        id: "m3-1",
        src: withBase("images/third_memories/couple_watercolor.png"),
        caption: "Our love story in color, sweet and beautiful",
        chapterName: "Chapter 3: 3rd Monthsary",
    },
    {
        id: "m3-2",
        src: withBase("images/third_memories/starlit_walk.png"),
        caption: "Under the stars, holding the one who lights up my world",
        chapterName: "Chapter 3: 3rd Monthsary",
    },
    {
        id: "m3-3",
        src: withBase("images/third_memories/cherry_blossom.png"),
        caption: "Caught in a shower of pink blossoms and pure happiness",
        chapterName: "Chapter 3: 3rd Monthsary",
    },
    {
        id: "m3-4",
        src: withBase("images/third_memories/milkshake_share.png"),
        caption: "Sharing sweet sips and even sweeter moments together",
        chapterName: "Chapter 3: 3rd Monthsary",
    }
];

const fourthMemories: MemoryItem[] = [
    {
        id: "m4-1",
        src: withBase("images/fourth_memories/couple_selfie.jpg"),
        caption: "Pressed close, warm smiles, and pure happiness together",
        chapterName: "Chapter 4: 4th Monthsary",
    },
    {
        id: "m4-2",
        src: withBase("images/fourth_memories/japanese_food.jpg"),
        caption: "Delicious Japanese food dates with you",
        chapterName: "Chapter 4: 4th Monthsary",
    },
    {
        id: "m4-3",
        src: withBase("images/fourth_memories/oishidon_sign.jpg"),
        caption: "Oishidon Japanese Restaurant, another lovely memory captured",
        chapterName: "Chapter 4: 4th Monthsary",
    },
    {
        id: "m4-4",
        src: withBase("images/fourth_memories/arternative_shop.jpg"),
        caption: "Exploring art supply stores and creative dates together",
        chapterName: "Chapter 4: 4th Monthsary",
    }
];

const fifthMemories: MemoryItem[] = [
    {
        id: "m5-1",
        src: withBase("images/fifth_memories/mountain.jpg"),
        caption: "Beautiful mountains and skies, but nothing is as beautiful as us",
        chapterName: "Chapter 5: 5th Monthsary",
    },
    {
        id: "m5-2",
        src: withBase("images/fifth_memories/coffee_time.jpg"),
        caption: "Candid coffee dates and your cute smiles",
        chapterName: "Chapter 5: 5th Monthsary",
    },
    {
        id: "m5-3",
        src: withBase("images/fifth_memories/mirror_selfie.jpg"),
        caption: "Rooted in love, rooted in legacy — forever with you mirror selfie",
        chapterName: "Chapter 5: 5th Monthsary",
    },
    {
        id: "m5-4",
        src: withBase("images/fifth_memories/cafe_sign.jpg"),
        caption: "Café 10/23, finding cute new spots to love with you",
        chapterName: "Chapter 5: 5th Monthsary",
    }
];

function SwipeSection({
    chapter,
    memories,
    onSelectMemory,
    likes,
    onToggleLike,
}: {
    chapter: string;
    memories: MemoryItem[];
    onSelectMemory: (index: number) => void;
    likes: Record<string, number>;
    onToggleLike: (id: string, e: React.MouseEvent) => void;
}) {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "center" });
    const [activeMemory, setActiveMemory] = useState(0);

    useEffect(() => {
        if (!emblaApi) return;
        const onSelect = () => setActiveMemory(emblaApi.selectedScrollSnap());
        emblaApi.on("select", onSelect);
        return () => {
            emblaApi.off("select", onSelect);
        };
    }, [emblaApi]);

    const goPrevious = () => emblaApi?.scrollPrev();
    const goNext = () => emblaApi?.scrollNext();
    const scrollToIndex = (index: number) => emblaApi?.scrollTo(index);

    return (
        <div className="mb-8 w-full select-none">
            <div ref={emblaRef} className="overflow-hidden px-4">
                <div className="flex gap-5 py-3">
                {memories.map((memory, index) => {
                    const isActive = index === activeMemory;
                    const count = likes[memory.id] || 0;

                    return (
                        <motion.div
                            key={memory.id}
                            className="relative flex-shrink-0 snap-center group cursor-pointer"
                            initial={{ opacity: 0, scale: 0.85 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: false, amount: 0.5 }}
                            transition={{ duration: 0.4 }}
                            onClick={() => onSelectMemory(index)}
                        >
                            {/* Tape sticker simulation */}
                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 w-12 h-4 bg-rose-200/70 border border-white/60 shadow-sm rotate-[-3deg] rounded-sm pointer-events-none" />

                            <div
                                className={`h-72 w-[200px] md:w-56 bg-white p-3 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                                    isActive
                                        ? "shadow-2xl border-rose-300 scale-[1.04] ring-2 ring-rose-300/60"
                                        : "shadow-md border-rose-100/80 rotate-1 odd:-rotate-1 opacity-90 group-hover:opacity-100 group-hover:rotate-0 group-hover:shadow-xl"
                                }`}
                            >
                                <div className="relative h-52 w-full overflow-hidden rounded-xl bg-rose-50">
                                    <img
                                        src={memory.src}
                                        alt={`${chapter} memory ${index + 1}`}
                                        className="h-full w-full object-cover group-hover:scale-108 transition-transform duration-500"
                                        draggable="false"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2.5 text-white">
                                        <div className="rounded-full bg-white/30 backdrop-blur-md p-1.5">
                                            <Maximize2 size={16} />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-500/80 px-2 py-0.5 rounded-full">
                                            Expand
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-1 flex items-center justify-between px-1">
                                    <p className="text-[11px] font-medium text-rose-800 italic truncate flex-1 pr-1">
                                        {memory.caption}
                                    </p>

                                    <button
                                        onClick={(e) => onToggleLike(memory.id, e)}
                                        className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-full transition-colors border border-rose-200 min-h-[44px] active:scale-95 focus:outline-none focus:ring-2 focus:ring-rose-400"
                                        aria-label="Send love"
                                    >
                                        <Heart size={13} className={count > 0 ? "fill-rose-500 text-rose-500" : ""} />
                                        <span>{count}</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
                </div>
            </div>

            <div className="flex items-center justify-between px-6 max-w-sm mx-auto mt-2">
                <button
                    onClick={goPrevious}
                    disabled={activeMemory === 0}
                    aria-label="Previous memory"
                    className="flex items-center gap-1 rounded-full border border-rose-200 bg-white/90 px-3.5 py-1.5 text-xs font-bold text-rose-700 shadow-sm hover:bg-rose-50 transition-colors disabled:cursor-not-allowed disabled:opacity-40 min-h-[44px] active:scale-95 focus:outline-none focus:ring-2 focus:ring-rose-400"
                >
                    <ChevronLeft size={16} /> Prev
                </button>

                <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-rose-600 font-bold">
                        {activeMemory + 1} of {memories.length}
                    </span>
                    <div className="flex items-center justify-center gap-1.5">
                        {memories.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => scrollToIndex(index)}
                                className={`h-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-rose-400 ${
                                    index === activeMemory ? "w-6 bg-rose-500" : "w-2 bg-rose-200 hover:bg-rose-300"
                                }`}
                                aria-label={`Go to memory ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>

                <button
                    onClick={goNext}
                    disabled={activeMemory === memories.length - 1}
                    aria-label="Next memory"
                    className="flex items-center gap-1 rounded-full border border-rose-200 bg-white/90 px-3.5 py-1.5 text-xs font-bold text-rose-700 shadow-sm hover:bg-rose-50 transition-colors disabled:cursor-not-allowed disabled:opacity-40 min-h-[44px] active:scale-95 focus:outline-none focus:ring-2 focus:ring-rose-400"
                >
                    Next <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}

export function ImageCarousel({ activeChapter = 2 }: { activeChapter?: number }) {
    const [selectedChapterTab, setSelectedChapterTab] = useState<number>(activeChapter);
    const [likes, setLikes] = useState<Record<string, number>>({});
    const [lightboxItem, setLightboxItem] = useState<{ memories: MemoryItem[]; index: number } | null>(null);

    useEffect(() => {
        setSelectedChapterTab(activeChapter);
    }, [activeChapter]);

    // Lock background scroll when Lightbox is active
    useEffect(() => {
        if (lightboxItem) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [lightboxItem]);

    const handleToggleLike = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setLikes((prev) => ({
            ...prev,
            [id]: (prev[id] || 0) + 1,
        }));
        confetti({
            particleCount: 20,
            spread: 40,
            origin: { y: 0.7 },
            colors: ["#be185d", "#ec4899", "#f43f5e"],
        });
    };

    const openLightbox = (memories: MemoryItem[], index: number) => {
        setLightboxItem({ memories, index });
    };

    const closeLightbox = () => {
        setLightboxItem(null);
    };

    useEffect(() => {
        if (!lightboxItem) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setLightboxItem(null);
            if (e.key === "ArrowRight") {
                setLightboxItem((prev) =>
                    prev ? { ...prev, index: (prev.index + 1) % prev.memories.length } : null
                );
            }
            if (e.key === "ArrowLeft") {
                setLightboxItem((prev) =>
                    prev
                        ? { ...prev, index: (prev.index - 1 + prev.memories.length) % prev.memories.length }
                        : null
                );
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [lightboxItem]);

    const activeMemories =
        selectedChapterTab === 1
            ? firstMemories
            : selectedChapterTab === 2
            ? secondMemories
            : selectedChapterTab === 3
            ? thirdMemories
            : selectedChapterTab === 4
            ? fourthMemories
            : fifthMemories;

    const activeChapterTitle =
        selectedChapterTab === 1
            ? "Chapter 1: Our Beginning"
            : selectedChapterTab === 2
            ? "Chapter 2: 2nd Monthsary"
            : selectedChapterTab === 3
            ? "Chapter 3: 3rd Monthsary"
            : selectedChapterTab === 4
            ? "Chapter 4: 4th Monthsary"
            : "Chapter 5: 5th Monthsary";

    return (
        <div className="my-8 w-full max-w-3xl mx-auto px-2">
            <div className="text-center mb-6">
                <h3 className="text-3xl md:text-4xl text-rose-600 font-bold font-display flex items-center justify-center gap-2">
                    <Sparkles size={24} className="text-rose-400 shrink-0" />
                    <span>Our Photo Memories</span>
                    <Sparkles size={24} className="text-rose-400 shrink-0" />
                </h3>
                <p className="text-xs text-rose-500 font-semibold mt-1">
                    Select a chapter below or swipe through our memory frames
                </p>
            </div>

            {/* Chapter Quick Switcher Tabs */}
            <div className="mb-6 flex flex-wrap items-center justify-center gap-1.5 bg-white/70 p-2 rounded-2xl border border-rose-200 shadow-md backdrop-blur-md max-w-xl mx-auto">
                {[1, 2, 3, 4, 5].map((ch) => (
                    <button
                        key={ch}
                        onClick={() => setSelectedChapterTab(ch)}
                        aria-label={`Switch to Chapter ${ch}`}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 min-h-[44px] active:scale-95 focus:outline-none focus:ring-2 focus:ring-rose-400 ${
                            selectedChapterTab === ch
                                ? "bg-rose-500 text-white shadow-sm scale-105"
                                : "text-rose-700 hover:bg-rose-100/60"
                        }`}
                    >
                        Ch. {ch}
                    </button>
                ))}
            </div>

            {/* Active Chapter Header */}
            <div className="mb-3 text-center">
                <p className="text-xs uppercase tracking-[0.25em] text-rose-600 font-extrabold bg-rose-100/70 py-1 px-4 rounded-full inline-block border border-rose-200">
                    {activeChapterTitle}
                </p>
            </div>

            {/* Swipeable Photo Section */}
            <SwipeSection
                chapter={activeChapterTitle}
                memories={activeMemories}
                onSelectMemory={(i) => openLightbox(activeMemories, i)}
                likes={likes}
                onToggleLike={handleToggleLike}
            />

            <p className="text-center text-xs text-rose-500 font-medium italic mt-1 animate-pulse flex items-center justify-center gap-1">
                <Sparkles size={12} className="inline text-rose-400 shrink-0" />
                <span>Click any polaroid frame to enter full Lightbox mode with thumbnail strip</span>
            </p>

            {/* Lightbox Modal with Interactive Thumbnail Strip */}
            <AnimatePresence>
                {lightboxItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeLightbox}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.94, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.94, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative max-w-3xl w-full bg-white rounded-3xl p-4 md:p-6 shadow-2xl overflow-hidden flex flex-col items-center border border-rose-100 max-h-[92vh]"
                        >
                            {/* Close button */}
                            <button
                                onClick={closeLightbox}
                                className="absolute top-4 right-4 z-20 rounded-full bg-rose-100 p-2 text-rose-600 hover:bg-rose-200 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shadow-sm active:scale-95 focus:outline-none focus:ring-2 focus:ring-rose-400"
                                aria-label="Close modal"
                            >
                                <X size={20} />
                            </button>

                            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-widest mb-3">
                                {lightboxItem.memories[lightboxItem.index].chapterName}
                            </span>

                            {/* Image Container */}
                            <div className="relative w-full max-h-[50vh] md:max-h-[58vh] flex items-center justify-center bg-rose-50/50 rounded-2xl overflow-hidden mb-3 p-2">
                                <img
                                    src={lightboxItem.memories[lightboxItem.index].src}
                                    alt="Expanded memory photo"
                                    className="max-h-[50vh] md:max-h-[55vh] w-auto object-contain rounded-xl shadow-md"
                                />

                                {/* Prev / Next inside modal */}
                                <button
                                    onClick={() =>
                                        setLightboxItem({
                                            ...lightboxItem,
                                            index: (lightboxItem.index - 1 + lightboxItem.memories.length) % lightboxItem.memories.length,
                                        })
                                    }
                                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur-md p-2.5 text-rose-600 shadow-lg hover:bg-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95 focus:outline-none focus:ring-2 focus:ring-rose-400"
                                    aria-label="Previous photo"
                                >
                                    <ChevronLeft size={22} />
                                </button>
                                <button
                                    onClick={() =>
                                        setLightboxItem({
                                            ...lightboxItem,
                                            index: (lightboxItem.index + 1) % lightboxItem.memories.length,
                                        })
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur-md p-2.5 text-rose-600 shadow-lg hover:bg-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95 focus:outline-none focus:ring-2 focus:ring-rose-400"
                                    aria-label="Next photo"
                                >
                                    <ChevronRight size={22} />
                                </button>
                            </div>

                            {/* Caption & Like Row */}
                            <div className="flex flex-col md:flex-row items-center justify-between w-full px-2 gap-2 mb-4">
                                <p className="text-center md:text-left font-serif text-base md:text-lg text-rose-900 font-semibold italic flex-1">
                                    "{lightboxItem.memories[lightboxItem.index].caption}"
                                </p>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={(e) => handleToggleLike(lightboxItem.memories[lightboxItem.index].id, e)}
                                        className="flex items-center gap-1.5 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3.5 py-1.5 text-xs font-bold text-rose-600 transition-colors shadow-sm min-h-[44px] active:scale-95 focus:outline-none focus:ring-2 focus:ring-rose-400"
                                        aria-label="Send love"
                                    >
                                        <Heart
                                            size={14}
                                            className={
                                                (likes[lightboxItem.memories[lightboxItem.index].id] || 0) > 0
                                                    ? "fill-rose-500 text-rose-500"
                                                    : ""
                                            }
                                        />
                                        <span>Send Love ({likes[lightboxItem.memories[lightboxItem.index].id] || 0})</span>
                                    </button>

                                    <span className="text-xs font-bold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-200">
                                        {lightboxItem.index + 1} / {lightboxItem.memories.length}
                                    </span>
                                </div>
                            </div>

                            {/* Interactive Thumbnail Filmstrip */}
                            <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 pt-1 px-2 border-t border-rose-100 w-full justify-center">
                                {lightboxItem.memories.map((thumb, idx) => (
                                    <button
                                        key={thumb.id}
                                        onClick={() => setLightboxItem({ ...lightboxItem, index: idx })}
                                        aria-label={`View thumbnail ${idx + 1}`}
                                        className={`relative h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-rose-400 ${
                                            idx === lightboxItem.index
                                                ? "border-rose-500 scale-110 shadow-md ring-2 ring-rose-200"
                                                : "border-transparent opacity-60 hover:opacity-100"
                                        }`}
                                    >
                                        <img src={thumb.src} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

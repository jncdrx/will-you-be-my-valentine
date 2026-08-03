import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles, Clock, ChevronRight, ChevronLeft, X, Maximize2, Camera, Sprout, Cake, Utensils, Coffee, Crown, MessageCircle } from "lucide-react";
import { monthsaryConfig, MemoryItem, TimelineEvent } from "../config/monthsaryConfig";

interface MemoriesSectionProps {
  onGoToReaction: () => void;
}

// Minimalist vector icon mapper for timeline
function renderTimelineIcon(iconName: TimelineEvent["iconName"]) {
  switch (iconName) {
    case "Sprout":
      return <Sprout size={16} className="text-emerald-600" />;
    case "Cake":
      return <Cake size={16} className="text-pink-500" />;
    case "Sparkles":
      return <Sparkles size={16} className="text-amber-500" />;
    case "Utensils":
      return <Utensils size={16} className="text-rose-500" />;
    case "Coffee":
      return <Coffee size={16} className="text-amber-700" />;
    case "Heart":
      return <Heart size={16} className="text-rose-500 fill-rose-500" />;
    case "Crown":
      return <Crown size={16} className="text-amber-500 fill-amber-400" />;
    default:
      return <Sparkles size={16} className="text-rose-500" />;
  }
}

export function MemoriesSection({ onGoToReaction }: MemoriesSectionProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [lightboxPhoto, setLightboxPhoto] = useState<MemoryItem | null>(null);

  const memories = monthsaryConfig.memories;

  const nextPhoto = () => {
    setActivePhotoIndex((prev) => (prev + 1) % memories.length);
  };

  const prevPhoto = () => {
    setActivePhotoIndex((prev) => (prev - 1 + memories.length) % memories.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center p-3 sm:p-4 max-w-4xl w-full my-auto z-10"
    >
      {/* Header Banner */}
      <div className="text-center mb-6">
        <span className="text-xs font-extrabold uppercase tracking-widest text-rose-600 bg-rose-100/80 px-4 py-1.5 rounded-full border border-rose-200 inline-flex items-center gap-1.5 shadow-sm mb-2">
          <Camera size={14} className="text-rose-500" />
          <span>Step 3: Our Memories & Timeline</span>
        </span>
        <h2 className="text-3xl sm:text-5xl font-bold text-rose-600 font-display flex items-center justify-center gap-2">
          <span>Our Journey Over 7 Months</span>
          <Heart size={28} className="fill-rose-500 text-rose-500" />
        </h2>
      </div>

      {/* Interactive Photo Carousel with Polaroid Frame & Tape Sticker */}
      <div className="relative w-full max-w-xl bg-white/90 backdrop-blur-md p-5 sm:p-7 rounded-3xl shadow-2xl border border-rose-200 mb-8 flex flex-col items-center">
        {/* Analog Tape Sticker Overlay */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-amber-100/80 backdrop-blur-sm border border-amber-200/60 shadow-sm rotate-1 z-20 rounded-sm pointer-events-none" />

        <div className="w-full flex justify-between items-center mb-2.5 px-1">
          <span className="text-xs font-extrabold text-rose-600 uppercase tracking-wider bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
            {memories[activePhotoIndex].chapterName}
          </span>
          <span className="text-xs font-bold text-gray-500">
            {activePhotoIndex + 1} / {memories.length} Photos
          </span>
        </div>

        <div
          className="relative w-full aspect-[4/3] bg-rose-50/70 rounded-2xl overflow-hidden shadow-inner mb-3.5 group cursor-pointer border-2 border-rose-100"
          onClick={() => setLightboxPhoto(memories[activePhotoIndex])}
        >
          <motion.img
            key={activePhotoIndex}
            src={memories[activePhotoIndex].src}
            alt={memories[activePhotoIndex].caption}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
          />

          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
            <div className="rounded-full bg-white/30 backdrop-blur-md p-3 flex items-center gap-1.5 font-bold text-xs shadow-lg">
              <Maximize2 size={18} />
              <span>Tap to Zoom</span>
            </div>
          </div>
        </div>

        {/* Photo Caption */}
        <p className="text-center font-serif text-base sm:text-xl text-rose-900 italic font-semibold mb-4 px-2">
          "{memories[activePhotoIndex].caption}"
        </p>

        {/* Thumbnail Filmstrip */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto max-w-full p-1 scrollbar-none">
          {memories.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setActivePhotoIndex(idx)}
              className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                idx === activePhotoIndex
                  ? "border-rose-500 scale-110 shadow-md ring-2 ring-rose-300"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img src={item.src} alt={item.caption} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between w-full px-1">
          <button
            onClick={prevPhoto}
            className="flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 shadow-sm hover:bg-rose-100 transition-colors min-h-[40px]"
          >
            <ChevronLeft size={16} /> Prev Photo
          </button>

          <button
            onClick={nextPhoto}
            className="flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 shadow-sm hover:bg-rose-100 transition-colors min-h-[40px]"
          >
            Next Photo <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 7th Monthsary Milestone Timeline */}
      <div className="w-full max-w-2xl bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-white/90 shadow-xl mb-8">
        <h3 className="text-xl sm:text-2xl font-bold text-rose-600 font-display text-center mb-6 flex items-center justify-center gap-2">
          <Clock size={20} className="text-rose-500" />
          <span>7 Months Milestone Timeline</span>
        </h3>

        <div className="relative border-l-2 border-rose-200 ml-4 sm:ml-6 space-y-6">
          {monthsaryConfig.timelineEvents.map((evt, idx) => (
            <div key={idx} className="relative pl-6 sm:pl-8">
              {/* Minimalist Vector Timeline Icon Badge */}
              <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-white border-2 border-rose-400 flex items-center justify-center shadow-md">
                {renderTimelineIcon(evt.iconName)}
              </div>

              <div className="bg-white/85 p-4 rounded-2xl border border-rose-100 shadow-sm text-left">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-extrabold text-rose-600 uppercase tracking-wider">
                    {evt.month} • {evt.date}
                  </span>
                </div>
                <h4 className="text-base font-bold text-gray-800">{evt.title}</h4>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">{evt.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Final Message Banner */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-600 p-6 rounded-3xl text-white text-center shadow-xl max-w-xl w-full mb-8">
        <Heart size={30} className="mx-auto mb-2 fill-white animate-pulse" />
        <h3 className="text-2xl sm:text-4xl font-extrabold font-display leading-tight">
          Seven months down, many more to go
        </h3>
        <p className="text-xs sm:text-sm mt-2 text-rose-100 font-medium">
          I love you more than ever, my sweet baby angel. Ready to write your response to me?
        </p>
      </div>

      {/* Share Reaction CTA */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onGoToReaction}
        className="rounded-full bg-gradient-to-r from-purple-500 via-rose-500 to-pink-600 px-8 py-4 text-base sm:text-lg font-bold text-white shadow-xl hover:shadow-2xl transition-all flex items-center gap-2.5 min-h-[52px]"
      >
        <MessageCircle size={20} />
        <span>Write Your Reaction, My Sweet Baby Angel</span>
      </motion.button>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxPhoto(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full bg-white rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col items-center border border-rose-100"
            >
              <button
                onClick={() => setLightboxPhoto(null)}
                className="absolute top-4 right-4 rounded-full bg-rose-100 p-2 text-rose-600 hover:bg-rose-200 transition-colors"
              >
                <X size={20} />
              </button>

              <img
                src={lightboxPhoto.src}
                alt={lightboxPhoto.caption}
                className="max-h-[60vh] w-auto object-contain rounded-2xl mb-3 shadow-md"
              />

              <p className="text-center font-serif text-lg text-rose-900 font-semibold italic">
                "{lightboxPhoto.caption}"
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

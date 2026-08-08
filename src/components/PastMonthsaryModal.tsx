import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, ChevronLeft, ChevronRight, Sprout, Cake, Sparkles, Utensils, Coffee, Heart, Crown, BookOpen, Camera } from "lucide-react";
import { monthsaryConfig, MonthDetail } from "../config/monthsaryConfig";
import { Itinerary } from "./Itinerary";

interface PastMonthsaryModalProps {
  initialMonthIndex: number;
  onClose: () => void;
}

// Icon mapper for timeline events
function renderTimelineIcon(iconName: string, size = 20) {
  switch (iconName) {
    case "Sprout":
      return <Sprout size={size} />;
    case "Cake":
      return <Cake size={size} />;
    case "Sparkles":
      return <Sparkles size={size} />;
    case "Utensils":
      return <Utensils size={size} />;
    case "Coffee":
      return <Coffee size={size} />;
    case "Heart":
      return <Heart size={size} fill="currentColor" />;
    case "Crown":
      return <Crown size={size} />;
    default:
      return <Heart size={size} />;
  }
}

export function PastMonthsaryModal({ initialMonthIndex, onClose }: PastMonthsaryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialMonthIndex);
  const [showFullImage, setShowFullImage] = useState<string | null>(null);

  const monthDetail: MonthDetail = monthsaryConfig.monthDetails[currentIndex] || monthsaryConfig.monthDetails[0];
  const totalMonths = monthsaryConfig.monthDetails.length;

  const triggerHaptic = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handlePrev = () => {
    triggerHaptic();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalMonths - 1));
  };

  const handleNext = () => {
    triggerHaptic();
    setCurrentIndex((prev) => (prev < totalMonths - 1 ? prev + 1 : 0));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-rose-950/40 backdrop-blur-xl p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 15 }}
        transition={{ duration: 0.35 }}
        className="relative w-full max-w-2xl bg-white/95 backdrop-blur-2xl p-5 sm:p-7 rounded-3xl border border-white/90 shadow-2xl text-left my-auto max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-rose-100 pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${monthDetail.color} text-white flex items-center justify-center shadow-md`}>
              {renderTimelineIcon(monthDetail.iconName, 16)}
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                Chapter {currentIndex + 1} of {totalMonths}
              </span>
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mt-0.5">
                <span>{monthDetail.month}</span>
                <span className="text-gray-300">•</span>
                <span className="text-xs text-rose-500 font-medium flex items-center gap-1">
                  <Calendar size={12} />
                  {monthDetail.date}
                </span>
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 flex items-center justify-center transition-colors min-w-[36px] min-h-[36px]"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto pr-1 space-y-5 flex-1">
          {/* Main Banner Card */}
          <div className={`p-5 rounded-2xl bg-gradient-to-r ${monthDetail.color} text-white shadow-lg relative overflow-hidden`}>
            <div className="relative z-10">
              <span className="text-xs font-extrabold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full text-white backdrop-blur-sm inline-block mb-2">
                {monthDetail.month} Memory Highlight
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display">
                {monthDetail.title}
              </h2>
              <p className="text-xs sm:text-sm text-white/90 mt-1 font-medium leading-relaxed">
                {monthDetail.date} • {monthDetail.month} Celebration
              </p>
            </div>
          </div>

          {/* Dedicated Love Letter Card for this Month */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-rose-200 shadow-md relative overflow-hidden">
            <div className="flex items-center gap-1.5 mb-3 text-rose-600 font-bold text-xs uppercase tracking-wider">
              <BookOpen size={15} />
              <span>Personal Love Letter • {monthDetail.month}</span>
            </div>

            <h3 className="text-lg font-extrabold text-rose-700 font-display mb-2">
              {monthDetail.letterTitle}
            </h3>

            <div className="space-y-2 text-xs sm:text-sm text-gray-700 leading-relaxed font-serif italic bg-rose-50/50 p-4 rounded-xl border border-rose-100">
              {monthDetail.letterBody.map((paragraph, pIdx) => (
                <p key={pIdx}>"{paragraph}"</p>
              ))}
            </div>

            <p className="mt-3 text-right text-xs font-bold text-rose-600 italic">
              — Always & Forever, Your Baby
            </p>
          </div>

          {/* ALL Photo Gallery for this Month */}
          <div className="bg-rose-50/40 p-4 rounded-2xl border border-rose-100">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                <Camera size={15} className="text-rose-500" />
                <span>All Memory Photos ({monthDetail.photos.length})</span>
              </span>
              <span className="text-[10px] text-gray-400 font-medium">Tap photo to enlarge</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
              {monthDetail.photos.map((photo, pIdx) => (
                <div
                  key={pIdx}
                  onClick={() => setShowFullImage(photo.src)}
                  className="relative aspect-video rounded-xl overflow-hidden border border-rose-200 shadow-md cursor-pointer group"
                >
                  <img
                    src={photo.src}
                    alt={photo.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2.5">
                    <p className="text-[11px] font-semibold text-white italic font-serif leading-tight line-clamp-2">
                      "{photo.caption}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Special Itinerary Embed for 2nd Month */}
          {currentIndex === 1 && (
            <div className="border-t border-rose-100 pt-4">
              <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 text-left mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <Cake size={15} className="text-amber-600" />
                  <span>2nd Month Birthday + Monthsary Date Itinerary</span>
                </span>
                <p className="text-xs text-amber-900/80 mt-1">
                  Below is our memorable date schedule from SM Megamall & Ortigas!
                </p>
              </div>
              <Itinerary />
            </div>
          )}
        </div>

        {/* Modal Pagination Footer */}
        <div className="mt-4 pt-3 border-t border-rose-100 flex items-center justify-between shrink-0 gap-2">
          <button
            onClick={handlePrev}
            className="flex items-center gap-1 px-3.5 py-2.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all min-h-[40px]"
          >
            <ChevronLeft size={16} />
            <span>Prev Month</span>
          </button>

          {/* Month Indicator Dots */}
          <div className="flex items-center gap-1.5">
            {monthsaryConfig.monthDetails.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2.5 rounded-full transition-all ${
                  idx === currentIndex ? "w-6 bg-rose-500" : "w-2.5 bg-rose-200 hover:bg-rose-300"
                }`}
                aria-label={`Go to month ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-3.5 py-2.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all min-h-[40px]"
          >
            <span>Next Month</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </motion.div>

      {/* Fullscreen Photo Lightbox Preview */}
      <AnimatePresence>
        {showFullImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFullImage(null)}
            className="fixed inset-0 z-60 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4"
          >
            <img
              src={showFullImage}
              alt="Full Preview"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border-2 border-white/20"
            />
            <button
              onClick={() => setShowFullImage(null)}
              className="absolute top-4 right-4 text-white bg-white/20 hover:bg-white/40 p-2.5 rounded-full backdrop-blur-md transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

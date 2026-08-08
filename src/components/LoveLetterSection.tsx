import { useState, useRef } from "react";
import { motion } from "framer-motion";
import Typewriter from "typewriter-effect";
import { Sparkles, Heart, Mail, Copy, Check, Share2 } from "lucide-react";
import { monthsaryConfig } from "../config/monthsaryConfig";
import { captureElementImage } from "../lib/imageSaver";
import { ImagePreviewModal } from "./ImagePreviewModal";

interface LoveLetterSectionProps {
  onContinue: () => void;
}

export function LoveLetterSection({ onContinue }: LoveLetterSectionProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const letterRef = useRef<HTMLDivElement>(null);

  // Preview Modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    imageUrl: string | null;
    filename: string;
    blob: Blob | null;
  }>({
    isOpen: false,
    imageUrl: null,
    filename: "",
    blob: null,
  });

  const triggerHaptic = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(15);
    }
  };

  const handleSaveLetterImage = async () => {
    if (!letterRef.current || isDownloading) return;
    triggerHaptic();
    setIsDownloading(true);

    const safeName = (monthsaryConfig.girlfriendName || "My_Love").replace(/\s+/g, "_");
    const filename = `Love_Letter_For_${safeName}.png`;

    try {
      const result = await captureElementImage(letterRef.current, filename, {
        backgroundColor: "#fffcf5",
        scale: 2,
      });

      setModalState({
        isOpen: true,
        imageUrl: result.dataUrl,
        filename,
        blob: result.blob,
      });
    } catch (err) {
      console.error("Failed to capture love letter image:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyText = () => {
    triggerHaptic();
    const fullText = `${monthsaryConfig.letterTitle}\n\n${monthsaryConfig.letterParagraphs.join("\n\n")}\n\n${monthsaryConfig.letterClosing}`;
    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col items-center justify-center p-3 sm:p-4 max-w-2xl w-full my-auto z-10"
      >
        <div className="w-full text-center mb-4">
          <span className="text-xs font-extrabold uppercase tracking-widest text-rose-600 bg-rose-100/80 px-4 py-1.5 rounded-full border border-rose-200 inline-flex items-center gap-1.5 shadow-sm">
            <Mail size={14} className="text-rose-500 shrink-0" />
            <span>Step 2: My Personal Love Letter</span>
          </span>
        </div>

        {/* Envelope Card Container */}
        <div
          ref={letterRef}
          data-export-id="love-letter-card"
          className="relative w-full rounded-3xl bg-[#fffcf5] p-6 sm:p-10 shadow-2xl border-2 border-rose-200 overflow-hidden text-center backdrop-blur-sm"
        >
          {/* Subtle Paper Texture */}
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none" />

          {/* Graphic Heart Badge */}
          <div className="relative z-10 flex flex-col items-center mb-4">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 mb-2 shadow-sm border border-rose-200"
            >
              <Heart size={22} className="fill-rose-500" />
            </motion.div>
            <h2 className="text-3xl sm:text-5xl font-bold text-rose-600 font-display min-h-[1.2em]">
              <Typewriter
                onInit={(typewriter) => {
                  typewriter.typeString(monthsaryConfig.letterTitle).start();
                }}
              />
            </h2>
          </div>

          {/* Letter Paragraphs */}
          <div className="relative z-10 space-y-4 text-left text-base sm:text-lg text-gray-800 leading-relaxed font-serif px-1 sm:px-4">
            {monthsaryConfig.letterParagraphs.map((para, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.15, duration: 0.4 }}
              >
                {para}
              </motion.p>
            ))}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="pt-4 text-right italic font-semibold text-rose-700 whitespace-pre-line"
            >
              {monthsaryConfig.letterClosing}
            </motion.div>
          </div>
        </div>

        {/* Bottom Action Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full">
          <button
            onClick={handleCopyText}
            aria-label="Copy letter text"
            className="flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-3 text-xs sm:text-sm font-bold text-rose-700 border border-rose-200 shadow-md hover:bg-rose-50 transition-all min-h-[48px] active:scale-95 focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            {isCopied ? <Check size={16} className="text-emerald-600 shrink-0" /> : <Copy size={16} className="shrink-0" />}
            <span>{isCopied ? "Copied Letter!" : "Copy Letter"}</span>
          </button>

          <button
            onClick={handleSaveLetterImage}
            disabled={isDownloading}
            aria-label="Save letter as image"
            className="flex items-center gap-2 rounded-full bg-white/90 px-5 py-3 text-xs sm:text-sm font-bold text-rose-700 border border-rose-200 shadow-md hover:bg-rose-50 transition-all disabled:opacity-50 min-h-[48px] active:scale-95 focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            {isDownloading ? (
              <>
                <Sparkles size={16} className="animate-spin text-rose-500 shrink-0" />
                <span>Preparing Image...</span>
              </>
            ) : (
              <>
                <Share2 size={16} className="shrink-0" />
                <span>Save Letter as Image</span>
              </>
            )}
          </button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              triggerHaptic();
              onContinue();
            }}
            aria-label="Continue to memories"
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-7 py-3 text-sm sm:text-base font-bold text-white shadow-xl hover:shadow-2xl transition-all min-h-[52px] active:scale-95 focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            <Sparkles size={18} className="shrink-0" />
            <span>Continue, my love</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Cross-Device Image Save Modal */}
      <ImagePreviewModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        imageUrl={modalState.imageUrl}
        filename={modalState.filename}
        blob={modalState.blob}
      />
    </>
  );
}

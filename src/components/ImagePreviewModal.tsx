import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share2, Heart, CheckCircle2, Smartphone } from "lucide-react";
import { useState } from "react";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  filename: string;
  blob?: Blob | null;
}

export function ImagePreviewModal({
  isOpen,
  onClose,
  imageUrl,
  filename,
  blob,
}: ImagePreviewModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !imageUrl) return null;

  const handleShare = async () => {
    if (blob && typeof navigator !== "undefined" && typeof navigator.share === "function" && typeof navigator.canShare === "function") {
      try {
        const file = new File([blob], filename, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: filename.replace(/_/g, " ").replace(".png", ""),
            text: "Saved with love! 💕",
          });
          return;
        }
      } catch (err: unknown) {
        const error = err as Error;
        if (error.name !== "AbortError") {
          console.warn("Share failed:", err);
        }
      }
    }

    // Fallback: Copy link or trigger download
    handleDownload();
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.download = filename;
    link.href = imageUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-rose-950/60 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-rose-200 shadow-2xl text-center my-auto flex flex-col items-center max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="w-full flex items-center justify-between border-b border-rose-100 pb-3 mb-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-600 flex items-center gap-1.5 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              <Heart size={14} className="fill-rose-500 text-rose-500" />
              <span>Your Image is Ready! 📸</span>
            </span>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-rose-100/70 hover:bg-rose-200 text-rose-700 flex items-center justify-center transition-colors min-w-[36px] min-h-[36px]"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Mobile Tap-and-Hold Instructions Banner */}
          <div className="w-full bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50 p-3 rounded-2xl border border-rose-200 mb-4 text-left flex items-start gap-2.5 shadow-sm">
            <Smartphone size={20} className="text-rose-500 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-900/90 leading-relaxed font-medium">
              <strong className="font-bold text-rose-700">Mobile & iOS Tip:</strong> Tap and hold the image below to save directly to your <strong>Photos / Gallery</strong> or share with your baby! 📲
            </p>
          </div>

          {/* High-Res Image Preview Box */}
          <div className="relative w-full rounded-2xl overflow-hidden border border-rose-200 shadow-md bg-rose-50/50 mb-5 group max-h-[50vh] flex items-center justify-center">
            <img
              src={imageUrl}
              alt="Generated Ticket / Card"
              className="max-h-[50vh] w-auto object-contain rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>

          {/* Actions */}
          <div className="w-full flex flex-wrap items-center justify-center gap-3">
            {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
              <button
                onClick={handleShare}
                className="flex-1 min-w-[140px] px-4 py-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 text-white text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Share2 size={16} />
                <span>Share / Save to Photos</span>
              </button>
            )}

            <button
              onClick={handleDownload}
              className="flex-1 min-w-[140px] px-4 py-3 rounded-full bg-white text-rose-700 border border-rose-300 text-xs sm:text-sm font-bold shadow-md hover:bg-rose-50 transition-all flex items-center justify-center gap-2 min-h-[44px]"
            >
              {copied ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Download size={16} />}
              <span>{copied ? "Downloaded! ✨" : "Download File"}</span>
            </button>

            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold transition-colors min-h-[40px]"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

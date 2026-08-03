import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Edit3, CheckCircle, Heart, Download } from "lucide-react";
import confetti from "canvas-confetti";
import html2canvas from "html2canvas";
import { MonthsaryResponse } from "../lib/supabase";

interface SubmissionConfirmationProps {
  responseData: MonthsaryResponse;
  onEdit: () => void;
}

export function SubmissionConfirmation({ responseData, onEdit }: SubmissionConfirmationProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.5 },
      colors: ["#be185d", "#ec4899", "#f43f5e", "#f59e0b"],
    });
  }, []);

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `Reply_From_${responseData.name.replace(/\s+/g, "_")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download receipt card:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center p-3 sm:p-4 max-w-xl w-full my-auto z-10 text-center"
    >
      {/* Success Icon */}
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="w-16 h-16 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-xl mb-4"
      >
        <CheckCircle size={36} />
      </motion.div>

      {/* Confirmation Heading */}
      <h2 className="text-3xl sm:text-5xl font-bold text-rose-600 font-display mb-2 flex items-center justify-center gap-2">
        <span>Reply Received</span>
        <Heart size={28} className="fill-rose-500 text-rose-500" />
      </h2>

      <p className="text-base sm:text-xl font-serif italic text-rose-900 leading-relaxed font-semibold max-w-md mb-6 bg-white/70 p-4 rounded-2xl border border-rose-200 shadow-md">
        "Your reply has been saved, my love, my dearest baby angel. I can't wait to read it. I love you."
      </p>

      {/* Submitted Content Summary Card */}
      <div ref={cardRef} className="w-full bg-white p-6 sm:p-8 rounded-3xl border border-rose-200 shadow-xl text-left mb-6 relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-rose-100 pb-3 mb-4">
          <span className="text-xs font-extrabold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
            <Heart size={14} className="fill-rose-500 text-rose-500" />
            Submitted Reply Details
          </span>
          <span className="text-[10px] text-gray-400 font-medium">
            {new Date(responseData.created_at || Date.now()).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div className="mb-4">
          <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">From</span>
          <p className="text-base font-bold text-gray-800 capitalize">{responseData.name}</p>
        </div>

        <div className="mb-4">
          <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Message</span>
          <p className="text-sm text-gray-700 whitespace-pre-wrap font-serif italic bg-rose-50/50 p-4 rounded-2xl border border-rose-100 mt-1">
            "{responseData.message}"
          </p>
        </div>

        {/* Uploaded Pictures Preview */}
        {responseData.image_urls && responseData.image_urls.length > 0 && (
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-400 block mb-2 tracking-wider">
              Uploaded Reaction Photos ({responseData.image_urls.length})
            </span>
            <div className="grid grid-cols-3 gap-2">
              {responseData.image_urls.map((url, idx) => (
                <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-rose-200 shadow-sm">
                  <img src={url} alt={`Reaction ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Controls (Save Receipt Card + Edit Reply) */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={handleDownloadCard}
          disabled={isDownloading}
          className="flex items-center gap-2 rounded-full bg-white/90 px-5 py-3 text-xs sm:text-sm font-bold text-rose-700 border border-rose-200 shadow-md hover:bg-rose-50 transition-all min-h-[44px]"
        >
          <Download size={16} />
          <span>{isDownloading ? "Saving..." : "Save My Reply Card 📸"}</span>
        </button>

        <button
          onClick={onEdit}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all min-h-[44px]"
        >
          <Edit3 size={16} />
          <span>Edit My Reply</span>
        </button>
      </div>
    </motion.div>
  );
}

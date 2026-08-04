import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit3, CheckCircle, Heart, Download, Ticket, Sparkles, MessageCircle, Calendar, Gift, Camera, Upload, X } from "lucide-react";
import confetti from "canvas-confetti";
import html2canvas from "html2canvas";
import { MonthsaryResponse } from "../lib/supabase";
import { monthsaryConfig } from "../config/monthsaryConfig";

interface SubmissionConfirmationProps {
  responseData: MonthsaryResponse;
  onEdit: () => void;
}

export function SubmissionConfirmation({ responseData, onEdit }: SubmissionConfirmationProps) {
  const [activeTab, setActiveTab] = useState<"next" | "reply">("next");
  const [isDownloadingReply, setIsDownloadingReply] = useState(false);
  const [isDownloadingTicket, setIsDownloadingTicket] = useState(false);
  const [ticketClaimed, setTicketClaimed] = useState(false);

  // Kissing photo state saved in localStorage
  const [kissingPhoto, setKissingPhoto] = useState<string | null>(() => {
    try {
      return localStorage.getItem("monthsary_angel_kissing_photo");
    } catch {
      return null;
    }
  });

  const cardRef = useRef<HTMLDivElement>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.5 },
      colors: ["#be185d", "#ec4899", "#f43f5e", "#f59e0b"],
    });
  }, []);

  const triggerHaptic = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleClaimTicket = () => {
    triggerHaptic();
    setTicketClaimed(true);
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#ec4899", "#f43f5e", "#f59e0b", "#10b981"],
    });
  };

  const handleKissingPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Please upload an image smaller than 5MB.");
      return;
    }

    triggerHaptic();
    const reader = new FileReader();
    reader.onloadend = () => {
      const resultStr = reader.result as string;
      setKissingPhoto(resultStr);
      localStorage.setItem("monthsary_angel_kissing_photo", resultStr);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#be185d", "#ec4899", "#f43f5e"],
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveKissingPhoto = () => {
    triggerHaptic();
    setKissingPhoto(null);
    localStorage.removeItem("monthsary_angel_kissing_photo");
  };

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    setIsDownloadingReply(true);
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
      console.error("Failed to download reply card:", err);
    } finally {
      setIsDownloadingReply(false);
    }
  };

  const handleDownloadTicket = async () => {
    if (!ticketRef.current) return;
    setIsDownloadingTicket(true);
    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        backgroundColor: "#fff0f5",
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `Nail_Care_Session_Pass_${responseData.name.replace(/\s+/g, "_")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download ticket:", err);
    } finally {
      setIsDownloadingTicket(false);
    }
  };

  const handleSendNotification = () => {
    triggerHaptic();
    const text = encodeURIComponent(
      `Hi baby! 💕 I just submitted my 7th Monthsary reply on our website and claimed my Nail Care ticket! Go check it out! 🥰✨`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-start p-3 sm:p-4 max-w-xl w-full my-auto z-10 text-center"
    >
      {/* Top Animated Success Badge */}
      <motion.div
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
        className="w-16 h-16 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-xl mb-3 shadow-rose-500/30"
      >
        <CheckCircle size={36} />
      </motion.div>

      {/* Confirmation Heading */}
      <h2 className="text-3xl sm:text-4xl font-extrabold text-rose-600 font-display mb-1 flex items-center justify-center gap-2">
        <span>Reply Received!</span>
        <Heart size={26} className="fill-rose-500 text-rose-500" />
      </h2>

      <p className="text-xs sm:text-sm text-rose-900/80 font-medium max-w-md mb-5">
        Your reply has been saved to our database, my love! Here's what happens next... ✨
      </p>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md p-1.5 rounded-full border border-rose-200 shadow-md mb-6 w-full max-w-md">
        <button
          onClick={() => setActiveTab("next")}
          className={`flex-1 py-2.5 px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "next"
              ? "bg-rose-500 text-white shadow-md"
              : "text-rose-700 hover:bg-rose-100/50"
          }`}
        >
          <Sparkles size={14} />
          <span>What Happens Next?</span>
        </button>

        <button
          onClick={() => setActiveTab("reply")}
          className={`flex-1 py-2.5 px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "reply"
              ? "bg-rose-500 text-white shadow-md"
              : "text-rose-700 hover:bg-rose-100/50"
          }`}
        >
          <Heart size={14} />
          <span>My Submitted Reply</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* TAB 1: WHAT HAPPENS NEXT */}
        {activeTab === "next" && (
          <motion.div
            key="tab-next"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full flex flex-col gap-5 text-left"
          >
            {/* Step Roadmap */}
            <div className="bg-white/90 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-rose-200 shadow-xl">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600 bg-rose-100/80 px-3 py-1 rounded-full border border-rose-200 inline-flex items-center gap-1.5 mb-4">
                <Calendar size={13} className="text-rose-500" />
                <span>What Happens Next Roadmap</span>
              </span>

              <div className="space-y-4">
                {/* Roadmap Item 1 */}
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Your Baby Receives & Reads Your Reply 💌</h4>
                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                      Your message and photos are safely saved in our Supabase database. Your baby is reading every single word right now with a warm smile!
                    </p>
                  </div>
                </div>

                {/* Roadmap Item 2 */}
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Claim Your Sponsored Nail Care & Nail Art Session 💅🎟️</h4>
                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                      You've unlocked an exclusive 100% sponsored Nail Care & Nail Art Session pass below! Claim it for your next pamper day.
                    </p>
                  </div>
                </div>

                {/* Roadmap Item 3 */}
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Send Me a Kissing Selfie / Photo 💋📸</h4>
                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                      Upload a photo of yourself kissing or a cute sweet selfie below so I can keep your sweetest kiss close to my heart!
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick WhatsApp Share Button */}
              <div className="mt-5 pt-4 border-t border-rose-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs font-semibold text-rose-800">Want to notify your baby right now?</span>
                <button
                  onClick={handleSendNotification}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <MessageCircle size={15} />
                  <span>Notify Baby on WhatsApp 💬</span>
                </button>
              </div>
            </div>

            {/* STEP 2: Claimable Sponsored Nail Care Session Ticket */}
            <div
              ref={ticketRef}
              className="relative w-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 p-0.5 rounded-3xl shadow-2xl overflow-hidden group"
            >
              <div className="bg-gradient-to-br from-pink-50 via-white to-rose-50 p-6 sm:p-7 rounded-[23px] relative">
                {/* Decorative Ticket Circles (Stubs) */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-rose-100/90 border border-rose-200" />
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-rose-100/90 border border-rose-200" />

                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-pink-800 bg-pink-100 px-3 py-1 rounded-full border border-pink-200 inline-flex items-center gap-1">
                    <Ticket size={12} className="text-pink-600" />
                    <span>Sponsored Pamper Voucher</span>
                  </span>
                  <span className="text-[10px] font-extrabold text-rose-600 tracking-wider">
                    NO EXPIRATION • FOREVER VALID
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-rose-700 font-display">
                  1x Premium Nail Care & Nail Art Session 💅✨
                </h3>

                <p className="text-xs text-gray-600 mt-1.5 font-medium leading-relaxed">
                  This voucher entitles <strong className="text-rose-700 font-bold capitalize">{monthsaryConfig.girlfriendName}</strong> to one luxury nail care & nail art pamper session — <strong className="text-pink-600">100% FULLY SPONSORED BY YOUR BABY</strong>! 💕
                </p>

                <div className="mt-4 pt-3 border-t border-dashed border-rose-300 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Issued To</span>
                    <span className="text-xs font-bold text-gray-800 capitalize">{responseData.name}</span>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Sponsor</span>
                    <span className="text-xs font-extrabold text-rose-600">Your Baby 💕</span>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Status</span>
                    <span className={`text-xs font-extrabold ${ticketClaimed ? "text-emerald-600" : "text-amber-600"}`}>
                      {ticketClaimed ? "CLAIMED & RESERVED 💅" : "UNCLAIMED VOUCHER 🎟️"}
                    </span>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto mt-1 sm:mt-0">
                    {!ticketClaimed ? (
                      <button
                        onClick={handleClaimTicket}
                        className="flex-1 sm:flex-initial px-4 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-extrabold shadow-md hover:scale-105 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Gift size={14} />
                        <span>Claim Nail Ticket 💅</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleDownloadTicket}
                        disabled={isDownloadingTicket}
                        className="flex-1 sm:flex-initial px-4 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <Download size={14} />
                        <span>{isDownloadingTicket ? "Saving..." : "Save Ticket Image 📸"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 3: Upload Kissing Selfie / Photo */}
            <div className="bg-white/90 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-rose-200 shadow-xl">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                  <Camera size={15} className="text-rose-500" />
                  <span>Step 3: Send Me a Kissing Photo 💋</span>
                </span>
                <span className="text-[10px] text-gray-400 font-medium">Sweet Kiss Selfie</span>
              </div>

              <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                Upload a photo of yourself kissing (or a sweet selfie) so your baby can keep your sweetest kiss saved forever! 💋
              </p>

              {!kissingPhoto ? (
                <label className="flex flex-col items-center justify-center w-full h-36 rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50/40 hover:bg-rose-100/50 cursor-pointer p-4 transition-all group">
                  <Upload size={24} className="text-rose-500 mb-2 group-hover:scale-110 transition-transform animate-bounce" />
                  <span className="text-xs font-bold text-rose-700">Upload Kissing Selfie / Photo</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">JPG, PNG, WEBP (Max 5MB)</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleKissingPhotoUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border-2 border-rose-300 shadow-lg group max-w-sm mx-auto">
                  <div className="aspect-square w-full">
                    <img src={kissingPhoto} alt="Kissing Selfie" className="w-full h-full object-cover" />
                  </div>

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 text-white flex items-center justify-between">
                    <span className="text-xs font-semibold flex items-center gap-1">
                      <Heart size={14} className="fill-rose-400 text-rose-400" />
                      <span>Your Sweet Kiss 💋</span>
                    </span>
                    <button
                      onClick={handleRemoveKissingPhoto}
                      className="px-2.5 py-1 rounded-full bg-red-500/80 hover:bg-red-600 text-[10px] font-bold text-white backdrop-blur-sm transition-colors flex items-center gap-1"
                    >
                      <X size={12} /> Change
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 2: MY SUBMITTED REPLY SUMMARY */}
        {activeTab === "reply" && (
          <motion.div
            key="tab-reply"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full flex flex-col items-center text-left"
          >
            {/* Submitted Content Summary Card */}
            <div ref={cardRef} className="w-full bg-white p-6 sm:p-8 rounded-3xl border border-rose-200 shadow-xl mb-6 relative overflow-hidden">
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

            {/* Action Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleDownloadCard}
                disabled={isDownloadingReply}
                className="flex items-center gap-2 rounded-full bg-white/90 px-5 py-3 text-xs sm:text-sm font-bold text-rose-700 border border-rose-200 shadow-md hover:bg-rose-50 transition-all min-h-[44px]"
              >
                <Download size={16} />
                <span>{isDownloadingReply ? "Saving..." : "Save My Reply Card 📸"}</span>
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
        )}
      </AnimatePresence>
    </motion.div>
  );
}

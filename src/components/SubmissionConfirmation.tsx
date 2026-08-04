import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  CheckCircle,
  Heart,
  Sparkles,
  Upload,
  X,
  Gift,
  Download,
  Edit3,
  Camera,
  Share2,
  Award,
  Star,
  AlertCircle,
} from "lucide-react";
import { monthsaryConfig } from "../config/monthsaryConfig";
import {
  MonthsaryResponse,
  saveAngelUserData,
  getLoggedInUserId,
  checkUserTicketClaimStatus,
  claimTicketForUser,
  updateResponseTicketAndPhoto,
} from "../lib/supabase";
import { captureElementImage } from "../lib/imageSaver";
import { ImagePreviewModal } from "./ImagePreviewModal";

interface SubmissionConfirmationProps {
  responseData: MonthsaryResponse;
  onEdit: () => void;
}

export function SubmissionConfirmation({ responseData, onEdit }: SubmissionConfirmationProps) {
  const [activeTab, setActiveTab] = useState<"next" | "reply">("next");

  const currentUserId = getLoggedInUserId(responseData);

  const [ticketClaimed, setTicketClaimed] = useState<boolean>(() => {
    return localStorage.getItem(`monthsary_ticket_claimed_${currentUserId}`) === "true";
  });

  const [kissingPhoto, setKissingPhoto] = useState<string | null>(() => {
    return localStorage.getItem("monthsary_angel_kissing_photo") || null;
  });

  // Verify ticket claim status asynchronously for the logged-in user ID
  useEffect(() => {
    let isMounted = true;
    checkUserTicketClaimStatus(currentUserId).then((isClaimed) => {
      if (isMounted && isClaimed) {
        setTicketClaimed(true);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [currentUserId]);

  const [isCapturingTicket, setIsCapturingTicket] = useState(false);
  const [isCapturingReply, setIsCapturingReply] = useState(false);

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

  const [photoError, setPhotoError] = useState<string | null>(null);
  const [highlightStep3, setHighlightStep3] = useState(false);

  const step3Ref = useRef<HTMLDivElement>(null);
  const ticketRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const triggerHaptic = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(15);
    }
  };

  const scrollToStep3WithWarning = (msg: string) => {
    setPhotoError(msg);
    setHighlightStep3(true);
    setTimeout(() => setHighlightStep3(false), 3500);
    step3Ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleClaimTicket = async () => {
    triggerHaptic();
    if (ticketClaimed) return;

    if (!kissingPhoto) {
      toast.error("Please upload your sweet kissing selfie/photo first!");
      scrollToStep3WithWarning("You need to do thisss before claiming the ticket! Please upload your sweet kissing selfie / photo below first 💋📸");
      return;
    }

    setPhotoError(null);
    setTicketClaimed(true);
    const targetToken = responseData.response_token || responseData.id || currentUserId;
    await claimTicketForUser(targetToken);
    toast.success("Nail Care Pamper Voucher Claimed & Reserved! ✨");
  };

  const handleKissingPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerHaptic();
    setPhotoError(null);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setKissingPhoto(base64String);
      localStorage.setItem("monthsary_angel_kissing_photo", base64String);

      const targetToken = responseData.response_token || responseData.id || currentUserId;
      await updateResponseTicketAndPhoto(targetToken, { kissing_photo_url: base64String });
      await saveAngelUserData({ kissing_photo_url: base64String });
      toast.success("Photo uploaded successfully! 💕");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveKissingPhoto = async () => {
    triggerHaptic();
    setKissingPhoto(null);
    localStorage.removeItem("monthsary_angel_kissing_photo");

    const targetToken = responseData.response_token || responseData.id || currentUserId;
    await updateResponseTicketAndPhoto(targetToken, { kissing_photo_url: "" });
    await saveAngelUserData({ kissing_photo_url: "" });
  };

  const handleSaveTicketImage = async () => {
    if (!ticketRef.current || isCapturingTicket) return;
    triggerHaptic();

    if (!kissingPhoto) {
      scrollToStep3WithWarning("You need to do thisss before claiming or saving your ticket image! Please upload your sweet kissing selfie / photo below first 💋📸");
      return;
    }

    setPhotoError(null);
    setIsCapturingTicket(true);

    const safeName = (responseData.name || "Angel").replace(/\s+/g, "_");
    const filename = `Nail_Care_Pamper_Pass_${safeName}.png`;

    try {
      const result = await captureElementImage(ticketRef.current, filename, {
        backgroundColor: "#2e0817",
        scale: 3,
      });

      setModalState({
        isOpen: true,
        imageUrl: result.dataUrl,
        filename,
        blob: result.blob,
      });
    } catch (err) {
      console.error("Failed to capture ticket image:", err);
    } finally {
      setIsCapturingTicket(false);
    }
  };

  const handleSaveReplyCard = async () => {
    if (!cardRef.current || isCapturingReply) return;
    triggerHaptic();
    setIsCapturingReply(true);

    const safeName = (responseData.name || "Angel").replace(/\s+/g, "_");
    const filename = `Reply_Summary_${safeName}.png`;

    try {
      const result = await captureElementImage(cardRef.current, filename, {
        backgroundColor: "#ffffff",
        scale: 2,
      });

      setModalState({
        isOpen: true,
        imageUrl: result.dataUrl,
        filename,
        blob: result.blob,
      });
    } catch (err) {
      console.error("Failed to capture reply card image:", err);
    } finally {
      setIsCapturingReply(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col items-center justify-start p-3 sm:p-5 max-w-xl w-full my-auto z-10 text-center"
      >
        {/* Top Animated Badge */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2.8 }}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 flex items-center justify-center text-white shadow-xl mb-3 shadow-rose-500/30 ring-4 ring-rose-100"
        >
          <CheckCircle size={36} />
        </motion.div>

        {/* Confirmation Heading */}
        <h2 className="text-3xl sm:text-4xl font-extrabold text-rose-600 font-display mb-1 flex items-center justify-center gap-2">
          <span>Reply Received!</span>
          <Heart size={26} className="fill-rose-500 text-rose-500 animate-pulse" />
        </h2>

        <p className="text-xs sm:text-sm text-rose-900/80 font-medium max-w-md mb-5 leading-relaxed">
          Your reply has been saved, my love! Here's what happens next... ✨
        </p>

        {/* Navigation Tabs - Minimum 44px touch targets */}
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md p-1.5 rounded-full border border-rose-200 shadow-md mb-6 w-full max-w-md">
          <button
            onClick={() => {
              triggerHaptic();
              setActiveTab("next");
            }}
            className={`flex-1 py-3 px-3 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 min-h-[44px] ${
              activeTab === "next"
                ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md"
                : "text-rose-700 hover:bg-rose-100/50"
            }`}
          >
            <Sparkles size={16} />
            <span>What Happens Next?</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic();
              setActiveTab("reply");
            }}
            className={`flex-1 py-3 px-3 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 min-h-[44px] ${
              activeTab === "reply"
                ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md"
                : "text-rose-700 hover:bg-rose-100/50"
            }`}
          >
            <Heart size={16} />
            <span>My Submitted Reply</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* TAB 1: WHAT HAPPENS NEXT */}
          {activeTab === "next" && (
            <motion.div
              key="tab-next"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col gap-5 text-left"
            >
              {/* Sponsored Nail Care Session Ticket Card Container */}
              <div className="flex flex-col gap-3 w-full">
                {/* Exportable Ticket Element */}
                <div
                  ref={ticketRef}
                  data-export-id="pamper-ticket"
                  className="relative w-full rounded-[24px] bg-gradient-to-br from-amber-200/60 via-pink-400/30 to-amber-300/60 p-[2px] shadow-[0_16px_40px_rgba(76,5,25,0.3)] transition-all duration-300"
                >
                  <div
                    className="relative text-white p-5 sm:p-7 rounded-[22px] overflow-hidden border border-amber-200/15 font-sans"
                    style={{
                      background: "linear-gradient(135deg, #3d0313 0%, #690a29 50%, #3d0313 100%)",
                    }}
                  >
                    {/* Ambient Decorative Accents */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

                    {/* Top Header */}
                    <div className="flex flex-wrap justify-between items-center gap-2 mb-4 pb-3.5 border-b border-amber-300/20 font-sans">
                      <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-200 bg-amber-400/15 border border-amber-300/35 px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-sm">
                        <Award size={14} className="text-amber-300 shrink-0" />
                        <span>Official VIP Pamper Pass</span>
                      </span>
                      <span className="text-[11px] sm:text-xs font-mono font-bold text-amber-100/90 tracking-wider">
                        NO. #804-2026-VAL <span className="opacity-40">•</span> FOREVER VALID
                      </span>
                    </div>

                    {/* Ticket Title & Description */}
                    <div className="mb-4 text-left font-sans">
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-normal font-display text-amber-200 leading-snug tracking-wide mb-2">
                        1x Premium Nail Care & Nail Art Session
                      </h3>
                      <p className="text-xs sm:text-sm text-rose-100/90 leading-relaxed font-sans font-medium">
                        This voucher entitles{" "}
                        <strong className="text-amber-300 font-bold capitalize">
                          {monthsaryConfig.girlfriendName}
                        </strong>{" "}
                        to one luxury nail care & nail art pamper treatment —{" "}
                        <strong className="text-pink-300 font-bold">
                          100% FULLY SPONSORED BY YOUR BABY!
                        </strong>
                      </p>
                    </div>

                    {/* Voucher Details & Redemption Divider with Integrated Side Cutouts */}
                    <div className="relative my-4 flex items-center justify-center font-sans">
                      {/* Symmetrical Left & Right Ticket Cutout Notches (Glued to tear line vertical center) */}
                      <div className="absolute -left-5 sm:-left-7 inset-y-0 my-auto h-6 w-4 sm:w-5 rounded-r-full bg-[#fdf2f8] border-r border-y border-rose-300/30 shadow-inner z-10" />
                      <div className="absolute -right-5 sm:-right-7 inset-y-0 my-auto h-6 w-4 sm:w-5 rounded-l-full bg-[#fdf2f8] border-l border-y border-rose-300/30 shadow-inner z-10" />

                      <div className="w-full flex items-center justify-center gap-2 sm:gap-3">
                        <div className="flex-1 border-t border-dashed border-rose-400/30" />
                        <span className="text-[10px] sm:text-xs font-bold text-amber-200/90 tracking-widest uppercase px-3 py-1 bg-rose-950/90 rounded-full border border-amber-300/20 shrink-0 font-sans shadow-sm text-center">
                          Voucher Details & Redemption
                        </span>
                        <div className="flex-1 border-t border-dashed border-rose-400/30" />
                      </div>
                    </div>

                    {/* Metadata Detail Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-5 text-left font-sans">
                      <div className="bg-rose-950/60 backdrop-blur-sm p-3 sm:p-3.5 rounded-xl border border-rose-400/20 flex flex-col justify-between h-full min-h-[76px]">
                        <span className="text-[10px] sm:text-[11px] font-bold text-rose-300/80 uppercase tracking-wider block mb-1">
                          Issued To
                        </span>
                        <span className="text-xs sm:text-sm font-extrabold text-white leading-snug break-words block capitalize">
                          {responseData.name}
                        </span>
                      </div>

                      <div className="bg-rose-950/60 backdrop-blur-sm p-3 sm:p-3.5 rounded-xl border border-rose-400/20 flex flex-col justify-between h-full min-h-[76px]">
                        <span className="text-[10px] sm:text-[11px] font-bold text-rose-300/80 uppercase tracking-wider block mb-1">
                          Sponsor
                        </span>
                        <span className="text-xs sm:text-sm font-extrabold text-amber-300">
                          Your Baby
                        </span>
                      </div>

                      <div className="bg-rose-950/60 backdrop-blur-sm p-3 sm:p-3.5 rounded-xl border border-rose-400/20 flex flex-col justify-between h-full min-h-[76px]">
                        <span className="text-[10px] sm:text-[11px] font-bold text-rose-300/80 uppercase tracking-wider block mb-1">
                          Validity
                        </span>
                        <span className="text-xs sm:text-sm font-extrabold text-rose-100">
                          Forever Valid
                        </span>
                      </div>

                      <div className="bg-rose-950/60 backdrop-blur-sm p-3 sm:p-3.5 rounded-xl border border-rose-400/20 flex flex-col justify-between h-full min-h-[76px]">
                        <span className="text-[10px] sm:text-[11px] font-bold text-rose-300/80 uppercase tracking-wider block mb-1">
                          Status
                        </span>
                        <span
                          className={`text-xs sm:text-sm font-extrabold ${
                            ticketClaimed ? "text-emerald-300" : "text-amber-300"
                          }`}
                        >
                          {ticketClaimed ? "CLAIMED & RESERVED" : "UNCLAIMED"}
                        </span>
                      </div>
                    </div>

                    {/* Footer / Barcode & Badge */}
                    <div className="flex flex-row items-center justify-between gap-3 pt-3.5 border-t border-rose-400/20 text-xs font-sans">
                      <div className="flex flex-col items-start text-left shrink-0">
                        <div className="font-mono text-xs sm:text-sm tracking-wider text-rose-200/90 font-bold select-none leading-none mb-1 whitespace-nowrap">
                          |||| | ||||| || | |||| ||| |||||
                        </div>
                        <div className="text-[9px] sm:text-[10px] font-mono text-rose-300/70 tracking-wider uppercase whitespace-nowrap">
                          AUTH-804-ANGEL-PAMPER
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-1.5 bg-amber-400/15 border border-amber-300/35 px-3 py-1.5 rounded-full text-amber-200 text-[10px] sm:text-xs font-bold shadow-sm shrink-0">
                        <Star size={13} className="fill-amber-300 text-amber-300 shrink-0" />
                        <span>100% FREE & PAID BY BABY</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ticket Interactive Action Buttons (Outside Exportable Container) */}
                <div className="flex flex-wrap items-center justify-center gap-3 w-full mt-1">
                  {!ticketClaimed ? (
                    <button
                      onClick={handleClaimTicket}
                      className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white text-sm font-extrabold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 min-h-[48px] active:scale-95"
                    >
                      {!kissingPhoto ? <Camera size={18} className="animate-bounce" /> : <Gift size={18} />}
                      <span>{kissingPhoto ? "Claim Nail Ticket" : "You need to do thisss first to claim ticket!"}</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveTicketImage}
                      disabled={isCapturingTicket}
                      className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-sm font-extrabold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-50 active:scale-95"
                    >
                      {isCapturingTicket ? (
                        <>
                          <Sparkles size={18} className="animate-spin" />
                          <span>Generating High-Res Ticket...</span>
                        </>
                      ) : (
                        <>
                          <Share2 size={18} />
                          <span>Save Ticket Image</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Kissing Photo Upload Section */}
              <div
                ref={step3Ref}
                className={`bg-white/90 backdrop-blur-md p-5 sm:p-6 rounded-3xl border transition-all duration-300 shadow-xl ${
                  highlightStep3
                    ? "border-rose-500 ring-4 ring-rose-300 bg-rose-50/90 scale-[1.01]"
                    : "border-rose-200"
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                    <Camera size={16} className="text-rose-500" />
                    <span>SEND ME A KISSING PHOTO 💋</span>
                  </span>
                  <span className="text-[10px] text-rose-600 font-bold bg-rose-100/80 px-2 py-0.5 rounded-full">
                    Required to Claim
                  </span>
                </div>

                <p className="text-xs text-gray-600 mb-3 leading-relaxed font-medium">
                  Upload a photo of yourself kissing (or a sweet selfie) — <strong className="text-rose-600 font-bold">You need to do thisss before claiming your ticket! 💋</strong>
                </p>

                {/* Photo Upload Requirement Error Alert Banner */}
                {photoError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-2xl bg-rose-100/90 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2 shadow-sm"
                  >
                    <AlertCircle size={18} className="text-rose-600 shrink-0" />
                    <span>{photoError}</span>
                  </motion.div>
                )}

                {!kissingPhoto ? (
                  <label className="flex flex-col items-center justify-center w-full h-36 rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50/40 hover:bg-rose-100/60 cursor-pointer p-4 transition-all group active:scale-[0.99]">
                    <Upload size={26} className="text-rose-500 mb-2 group-hover:scale-110 transition-transform animate-bounce" />
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

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-white flex items-center justify-between">
                      <span className="text-xs font-semibold flex items-center gap-1">
                        <Heart size={14} className="fill-rose-400 text-rose-400" />
                        <span>Your Sweet Kiss 💋</span>
                      </span>
                      <button
                        onClick={handleRemoveKissingPhoto}
                        className="px-3 py-1.5 rounded-full bg-red-500/90 hover:bg-red-600 text-[10px] font-bold text-white backdrop-blur-sm transition-colors flex items-center gap-1 min-h-[36px]"
                      >
                        <X size={14} /> Change
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
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col items-center text-left"
            >
              <div
                ref={cardRef}
                data-export-id="reply-summary-card"
                className="w-full bg-white p-6 sm:p-8 rounded-3xl border border-rose-200 shadow-xl mb-6 relative overflow-hidden"
              >
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
                  <p className="text-sm text-gray-700 whitespace-pre-wrap font-serif italic bg-rose-50/50 p-4 rounded-2xl border border-rose-100 mt-1 leading-relaxed">
                    "{responseData.message}"
                  </p>
                </div>

                {/* Uploaded Photos Preview */}
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
              <div className="flex flex-wrap items-center justify-center gap-3 w-full">
                <button
                  onClick={handleSaveReplyCard}
                  disabled={isCapturingReply}
                  className="flex-1 min-w-[160px] flex items-center justify-center gap-2 rounded-full bg-white/95 px-5 py-3 text-xs sm:text-sm font-bold text-rose-700 border border-rose-200 shadow-md hover:bg-rose-50 transition-all min-h-[44px] active:scale-95"
                >
                  {isCapturingReply ? (
                    <>
                      <Sparkles size={16} className="animate-spin" />
                      <span>Preparing Card...</span>
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      <span>Save Reply Card 📸</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    triggerHaptic();
                    onEdit();
                  }}
                  className="flex-1 min-w-[160px] flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all min-h-[44px] active:scale-95"
                >
                  <Edit3 size={16} />
                  <span>Edit My Reply</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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

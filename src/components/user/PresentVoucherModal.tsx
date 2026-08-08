import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import {
  X,
  Sparkles,
  Award,
  Heart,
  CheckCircle2,
  Gift,
} from "lucide-react";
import { Voucher, redeemVoucher, VOUCHER_TYPE_LABELS } from "../../lib/vouchers";
import { monthsaryConfig } from "../../config/monthsaryConfig";

interface PresentVoucherModalProps {
  voucher: Voucher | null;
  isOpen: boolean;
  onClose: () => void;
  onRedeemed?: (updatedVoucher: Voucher) => void;
}

export function PresentVoucherModal({
  voucher,
  isOpen,
  onClose,
  onRedeemed,
}: PresentVoucherModalProps) {
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !voucher) return null;

  const voucherNo = `#${voucher.id.slice(0, 4).toUpperCase()}-${new Date(voucher.created_at).getFullYear()}`;
  const authCode = `AUTH-${voucher.id.slice(0, 8).toUpperCase()}`;
  const isAlreadyRedeemed = voucher.status === "redeemed";

  const triggerHaptic = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([30, 50, 30]);
    }
  };

  const handleRedeem = async () => {
    if (isRedeeming || isAlreadyRedeemed) return;
    triggerHaptic();
    setIsRedeeming(true);

    try {
      // Fire confetti burst!
      confetti({
        particleCount: 140,
        spread: 100,
        origin: { y: 0.6 },
        colors: ["#f43f5e", "#ec4899", "#fbbf24", "#a855f7"],
      });

      // Call database RPC to record redemption
      const updated = await redeemVoucher(voucher.id);
      toast.success("Voucher presented and redeemed successfully!", {
        description: `${voucher.title} has been marked as redeemed and fulfilled!`,
      });

      const nextVoucher: Voucher = {
        ...voucher,
        status: updated.status || "redeemed",
      };

      if (onRedeemed) {
        onRedeemed(nextVoucher);
      }
    } catch (err: unknown) {
      console.error("Failed to redeem voucher:", err);
      const message = err instanceof Error ? err.message : "Failed to redeem voucher. Please try again.";
      toast.error(message);
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-lg bg-gradient-to-br from-rose-950 via-purple-950 to-slate-950 text-white rounded-3xl p-5 sm:p-7 border border-amber-300/35 shadow-[0_25px_60px_rgba(244,63,94,0.35)] overflow-hidden font-sans my-auto max-h-[92vh] flex flex-col justify-between"
        >
          {/* Close button */}
          <button
            onClick={() => {
              triggerHaptic();
              onClose();
            }}
            aria-label="Close ticket modal"
            className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-rose-200 transition-colors z-20 active:scale-95"
          >
            <X size={20} />
          </button>

          {/* Ambient Background Glow */}
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-rose-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

          {/* Modal Content Wrapper with clean scroll */}
          <div className="overflow-y-auto pr-1 flex-1">
            {/* Header Badge */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-400/20 via-rose-500/20 to-amber-400/20 border border-amber-300/40 text-amber-200 text-[11px] font-extrabold uppercase tracking-widest mb-2.5 shadow-md">
                <Sparkles size={14} className="text-amber-300 animate-spin shrink-0" />
                <span>PRESENTING TO BABY</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-amber-200 font-display flex items-center justify-center gap-2 break-words leading-tight">
                <span>{voucher.title}</span>
                <Heart size={22} className="fill-rose-500 text-rose-500 animate-bounce shrink-0" />
              </h2>
              <p className="text-xs text-rose-200/80 mt-1 font-medium leading-relaxed">
                Present this ticket to {monthsaryConfig.authorName} to redeem your special reward!
              </p>
            </div>

            {/* VIP Ticket Card Display */}
            <div className="relative rounded-2xl bg-gradient-to-br from-rose-900/90 via-purple-900/90 to-rose-950/90 p-4 sm:p-5 border border-amber-300/30 shadow-2xl mb-5">
              {/* Top Bar */}
              <div className="flex justify-between items-center text-xs font-mono font-bold text-amber-200/90 pb-2.5 border-b border-amber-300/20 mb-3">
                <span className="flex items-center gap-1.5">
                  <Award size={14} className="text-amber-300 shrink-0" />
                  <span className="uppercase">{VOUCHER_TYPE_LABELS[voucher.voucher_type]}</span>
                </span>
                <span className="tracking-wider">{voucherNo}</span>
              </div>

              {/* Description & Instructions */}
              {voucher.description && (
                <p className="text-xs sm:text-sm text-rose-100/95 leading-relaxed font-sans mb-3 bg-black/35 p-3 rounded-xl border border-rose-400/20 break-words">
                  "{voucher.description}"
                </p>
              )}

              {voucher.instructions && (
                <div className="text-xs text-rose-200/90 mb-3 bg-amber-950/40 p-3 rounded-xl border border-amber-300/20 break-words">
                  <span className="font-bold text-amber-300 block mb-1 uppercase tracking-wider text-[10px]">
                    How to Use:
                  </span>
                  {voucher.instructions}
                </div>
              )}

              {/* Barcode & Auth Details */}
              <div className="bg-black/60 p-3.5 rounded-xl border border-rose-400/20 flex flex-col items-center justify-center text-center my-3 relative overflow-hidden">
                <div className="font-mono text-sm sm:text-base tracking-widest text-amber-200 font-bold select-none mb-1">
                  |||| | ||||| || | |||| ||| |||||
                </div>
                <div className="text-[10px] font-mono text-rose-300 tracking-widest uppercase">
                  {authCode}
                </div>

                {/* Scanning Animation Line */}
                {!isAlreadyRedeemed && (
                  <motion.div
                    animate={{ y: [-18, 18, -18] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                    className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_8px_#fbbf24]"
                  />
                )}
              </div>

              {/* Details Footer */}
              <div className="grid grid-cols-2 gap-2 text-left text-xs font-sans mt-3">
                <div>
                  <span className="text-[10px] uppercase text-rose-300/70 font-bold block">Issued To</span>
                  <span className="font-extrabold text-white capitalize">{monthsaryConfig.girlfriendName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-rose-300/70 font-bold block">Sponsor</span>
                  <span className="font-extrabold text-amber-300">{monthsaryConfig.authorName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button Section */}
          <div className="flex flex-col gap-2.5 pt-2">
            {isAlreadyRedeemed ? (
              <div className="w-full min-h-[52px] rounded-2xl bg-purple-900/70 border border-purple-400/40 text-purple-200 text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg">
                <CheckCircle2 size={20} className="text-purple-300 shrink-0" />
                <span>Voucher Redeemed & Fulfilled</span>
              </div>
            ) : (
              <button
                onClick={handleRedeem}
                disabled={isRedeeming}
                className="w-full min-h-[52px] py-3.5 px-6 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 text-white text-sm sm:text-base font-extrabold shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 active:scale-95 ring-4 ring-amber-400/30"
              >
                {isRedeeming ? (
                  <>
                    <Sparkles size={20} className="animate-spin shrink-0" />
                    <span>Redeeming Voucher...</span>
                  </>
                ) : (
                  <>
                    <Gift size={20} className="shrink-0" />
                    <span>TAP TO USE / REDEEM NOW</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => {
                triggerHaptic();
                onClose();
              }}
              className="w-full py-2.5 text-xs font-bold text-rose-300/80 hover:text-white transition-colors min-h-[44px]"
            >
              Close Ticket
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

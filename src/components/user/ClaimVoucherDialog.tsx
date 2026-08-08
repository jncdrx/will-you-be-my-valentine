import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Gift, Loader2, X, CheckCircle2 } from "lucide-react";
import { Voucher, claimVoucher } from "../../lib/vouchers";

interface ClaimVoucherDialogProps {
  voucher: Voucher | null;
  onClose: () => void;
  onClaimed: (voucherId: string) => void;
}

export function ClaimVoucherDialog({ voucher, onClose, onClaimed }: ClaimVoucherDialogProps) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Lock background scroll when dialog is open
  useEffect(() => {
    if (voucher) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [voucher]);

  const handleConfirm = async () => {
    if (!voucher) return;
    setLoading(true);
    try {
      await claimVoucher(voucher.id);
      setDone(true);
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#fb7185", "#f472b6", "#f59e0b", "#ffffff"],
      });
      toast.success("Voucher claimed! Enjoy, my love");
      onClaimed(voucher.id);
    } catch (err) {
      setDone(false);
      toast.error(err instanceof Error ? err.message : "Could not claim this voucher.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDone(false);
    setLoading(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {voucher && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-rose-950/60 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ scale: 0.92, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 16, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm bg-white rounded-3xl border border-rose-200 shadow-2xl p-6 text-center"
          >
            <button
              onClick={handleClose}
              aria-label="Close dialog"
              className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-rose-50 p-2 text-rose-500 hover:bg-rose-100 transition-colors active:scale-95"
            >
              <X size={18} />
            </button>

            {done ? (
              <>
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-400 to-teal-400 text-white shadow-lg">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-extrabold text-emerald-600">Claimed!</h3>
                <p className="text-sm text-gray-600 mt-1 mb-5">
                  Your voucher has been reserved. Show this to your baby to redeem!
                </p>
                <button
                  onClick={handleClose}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-extrabold min-h-[48px] shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-600 text-white shadow-lg shadow-rose-500/30">
                  <Gift size={28} className="animate-bounce" />
                </div>
                <h3 className="text-xl font-extrabold text-rose-600">Claim this voucher?</h3>
                <p className="text-sm text-gray-600 mt-1 mb-5">
                  You're about to claim{" "}
                  <strong className="text-rose-700">"{voucher.title}"</strong>. Each voucher can
                  only be claimed once — make sure you're ready!
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    disabled={loading}
                    className="flex-1 py-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm min-h-[48px] disabled:opacity-50 transition-all active:scale-95"
                  >
                    Not yet
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-extrabold text-sm shadow-lg min-h-[48px] disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Claiming…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Claim it!</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
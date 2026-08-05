import { forwardRef, useEffect, useImperativeHandle, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, Gift, Heart, RefreshCw, Sparkles } from "lucide-react";
import {
  Voucher,
  listMyVouchers,
  subscribeVouchers,
  effectiveStatus,
} from "../../lib/vouchers";
import { VoucherCard } from "./VoucherCard";
import { ClaimVoucherDialog } from "./ClaimVoucherDialog";

export interface VouchersSectionHandle {
  scrollTo: () => void;
  pulse: () => void;
}

interface VouchersSectionProps {
  onVouchersChange?: (vouchers: Voucher[]) => void;
  onNewVoucher?: (voucher: Voucher) => void;
}

export const VouchersSection = forwardRef<VouchersSectionHandle, VouchersSectionProps>(
  function VouchersSection({ onVouchersChange, onNewVoucher }, ref) {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [claimTarget, setClaimTarget] = useState<Voucher | null>(null);
    const [highlight, setHighlight] = useState(false);
    const knownIds = useRef<Set<string>>(new Set());
    const loadedOnce = useRef(false);
    const sectionTopRef = useRef<HTMLDivElement | null>(null);

    const reload = useCallback(async () => {
      const list = await listMyVouchers();
      // Detect brand-new vouchers (ids not seen before), but only after the initial load.
      const fresh: Voucher[] = [];
      if (loadedOnce.current) {
        for (const v of list) {
          if (!knownIds.current.has(v.id)) fresh.push(v);
        }
      }
      setVouchers(list);
      list.forEach((v) => knownIds.current.add(v.id));
      onVouchersChange?.(list);
      if (loadedOnce.current && fresh.length > 0) {
        onNewVoucher?.(fresh[0]);
        setHighlight(true);
        window.setTimeout(() => setHighlight(false), 3500);
      }
      loadedOnce.current = true;
    }, [onVouchersChange, onNewVoucher]);

    useEffect(() => {
      let active = true;
      setLoading(true);
      reload().finally(() => {
        if (active) setLoading(false);
      });
      // Realtime: a new voucher sent by admin appears instantly while online.
      const unsub = subscribeVouchers({ recipientId: "me" }, () => {
        reload();
      });
      return () => {
        active = false;
        unsub();
      };
    }, [reload]);

    useImperativeHandle(ref, () => ({
      scrollTo: () => {
        sectionTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      },
      pulse: () => {
        setHighlight(true);
        window.setTimeout(() => setHighlight(false), 3500);
      },
    }));

    const unclaimedCount = vouchers.filter((v) => effectiveStatus(v) === "available").length;

    return (
      <div ref={sectionTopRef} className="w-full flex flex-col items-center pt-6 pb-10 scroll-mt-24">
        {/* Section header */}
        <div className="w-full max-w-2xl flex items-center justify-between px-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-500/30">
              <Gift size={20} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-rose-700 leading-tight flex items-center gap-1.5">
                My Vouchers
                {unclaimedCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold">
                    {unclaimedCount}
                  </span>
                )}
              </h2>
              <p className="text-[10px] text-rose-400 uppercase tracking-wider">
                {vouchers.length} {vouchers.length === 1 ? "voucher" : "vouchers"}
                {unclaimedCount > 0 ? ` · ${unclaimedCount} to claim` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={reload}
            title="Refresh"
            className="p-2.5 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Section body with highlight ring when a new voucher arrives */}
        <motion.div
          animate={
            highlight
              ? { boxShadow: "0 0 0 3px rgba(244,63,94,0.55)" }
              : { boxShadow: "0 0 0 0px rgba(244,63,94,0)" }
          }
          transition={{ duration: 0.4 }}
          className="w-full max-w-2xl rounded-3xl bg-white/70 backdrop-blur-md border border-rose-200 p-4 sm:p-5 shadow-lg"
        >
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-rose-500 py-10">
              <Loader2 size={28} className="animate-spin" />
              <p className="text-sm font-semibold">Loading your vouchers…</p>
            </div>
          ) : vouchers.length === 0 ? (
            <div className="text-center py-10">
              <Heart size={40} className="text-rose-200 mx-auto mb-3" />
              <p className="text-base font-bold text-rose-700">No vouchers yet</p>
              <p className="text-xs text-rose-400 mt-1 flex items-center justify-center gap-1">
                <Sparkles size={12} className="text-rose-400" />
                Your baby hasn't sent any vouchers yet. Check back soon! 💕
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5">
              {vouchers.map((v) => (
                <VoucherCard key={v.id} voucher={v} onClaim={setClaimTarget} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Claim dialog */}
        <ClaimVoucherDialog
          voucher={claimTarget}
          onClose={() => setClaimTarget(null)}
          onClaimed={reload}
        />
      </div>
    );
  }
);
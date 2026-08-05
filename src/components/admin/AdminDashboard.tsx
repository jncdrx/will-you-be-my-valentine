import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import { LogOut, Plus, RefreshCw, ShieldCheck, Ticket, Heart, ShieldAlert } from "lucide-react";
import { signOutAll } from "../../lib/auth";
import {
  listAllVouchers,
  markExpiredVouchers,
  subscribeVouchers,
  Voucher,
  effectiveStatus,
} from "../../lib/vouchers";
import { AdminVoucherSummary } from "./AdminVoucherSummary";
import { VoucherTable } from "./VoucherTable";
import { VoucherForm } from "./VoucherForm";
import { AdminResponsesMusicPanel } from "./AdminResponsesMusicPanel";
import { AdminSecurityLogs } from "./AdminSecurityLogs";

type Tab = "vouchers" | "content" | "security";

export function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("vouchers");
  const [refreshKey, setRefreshKey] = useState(0);
  const [creating, setCreating] = useState(false);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);

  const reloadVouchers = useCallback(async () => {
    const list = await listAllVouchers();
    setVouchers(list);
  }, []);

  useEffect(() => {
    // Mark expired + load summary on mount.
    markExpiredVouchers().then(() => {
      reloadVouchers();
      setRefreshKey((k) => k + 1);
      queryClient.invalidateQueries({ queryKey: ["adminVouchers"] });
    });
    // Realtime: invalidate caches when vouchers/activity change.
    const unsub = subscribeVouchers({ isAdmin: true }, () => {
      reloadVouchers();
      setRefreshKey((k) => k + 1);
      queryClient.invalidateQueries({ queryKey: ["adminVouchers"] });
      queryClient.invalidateQueries({ queryKey: ["voucherActivity"] });
    });
    return unsub;
  }, [reloadVouchers, queryClient]);

  const handleLogout = async () => {
    await signOutAll();
    toast.info("Logged out from admin");
    navigate("/admin/login", { replace: true });
  };

  const refreshAll = () => {
    markExpiredVouchers().then(() => reloadVouchers());
    setRefreshKey((k) => k + 1);
    queryClient.invalidateQueries({ queryKey: ["adminVouchers"] });
    queryClient.invalidateQueries({ queryKey: ["adminResponses"] });
    queryClient.invalidateQueries({ queryKey: ["voucherActivity"] });
  };

  const onVouchersChanged = () => {
    reloadVouchers();
    setRefreshKey((k) => k + 1);
    queryClient.invalidateQueries({ queryKey: ["adminVouchers"] });
  };

  const counts = {
    total: vouchers.length,
    available: vouchers.filter((v) => effectiveStatus(v) === "available").length,
    claimed: vouchers.filter((v) => effectiveStatus(v) === "claimed").length,
    expired: vouchers.filter((v) => effectiveStatus(v) === "expired").length,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/90 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-500 text-white flex items-center justify-center shadow">
              <ShieldCheck size={18} />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-extrabold tracking-tight">Admin Dashboard</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Voucher Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshAll}
              title="Refresh"
              className="p-2.5 rounded-full bg-slate-800 text-indigo-300 hover:bg-slate-700 border border-slate-700 min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/30 text-xs font-bold min-h-[40px]"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
        {/* Main tabs */}
        <div className="flex items-center gap-2 mb-6 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 max-w-md">
          <button
            onClick={() => setTab("vouchers")}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              tab === "vouchers"
                ? "bg-slate-800 text-indigo-300 shadow border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Ticket size={15} /> Vouchers ({counts.total})
          </button>
          <button
            onClick={() => setTab("content")}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              tab === "content"
                ? "bg-slate-800 text-indigo-300 shadow border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Heart size={15} /> Responses &amp; Music
          </button>
          <button
            onClick={() => setTab("security")}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              tab === "security"
                ? "bg-slate-800 text-indigo-300 shadow border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldAlert size={15} /> Security
          </button>
        </div>

        {tab === "vouchers" ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-extrabold flex items-center gap-2">
                <Ticket size={20} className="text-indigo-400" /> Vouchers
              </h1>
              <button
                onClick={() => setCreating(true)}
                className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-sky-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:shadow-xl transition-all min-h-[40px]"
              >
                <Plus size={16} /> Create Voucher
              </button>
            </div>

            <AdminVoucherSummary vouchers={vouchers} />

            <VoucherTable refreshKey={refreshKey} />
          </>
        ) : tab === "content" ? (
          <AdminResponsesMusicPanel />
        ) : (
          <AdminSecurityLogs />
        )}
      </main>

      {/* Create voucher modal */}
      <AnimatePresence>
        {creating && (
          <VoucherForm onClose={() => setCreating(false)} onSaved={onVouchersChanged} />
        )}
      </AnimatePresence>
    </div>
  );
}
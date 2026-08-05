import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Search,
  X,
  Pencil,
  Ban,
  Repeat2,
  History,
  Loader2,
  ArrowUpDown,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  Voucher,
  VoucherActivity,
  VoucherStatus,
  effectiveStatus,
  listAllVouchers,
  listActivity,
  cancelVoucher,
  deleteVoucher,
  resendVoucher,
  VOUCHER_TYPE_LABELS,
} from "../../lib/vouchers";
import { VoucherForm } from "./VoucherForm";

const STATUS_STYLES: Record<VoucherStatus, string> = {
  draft: "bg-slate-700/40 text-slate-300 border-slate-600",
  available: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  claimed: "bg-indigo-500/15 text-indigo-300 border-indigo-500/40",
  expired: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  cancelled: "bg-red-500/15 text-red-300 border-red-500/40",
};

const FILTERS: { id: VoucherStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "available", label: "Available" },
  { id: "claimed", label: "Claimed" },
  { id: "expired", label: "Expired" },
  { id: "cancelled", label: "Cancelled" },
];

interface VoucherTableProps {
  refreshKey: number;
}

export function VoucherTable({ refreshKey }: VoucherTableProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<VoucherStatus | "all">("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [editing, setEditing] = useState<Voucher | null>(null);
  const [activityFor, setActivityFor] = useState<Voucher | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Voucher | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: vouchers = [], isLoading, refetch } = useQuery<Voucher[]>({
    queryKey: ["adminVouchers", refreshKey],
    queryFn: listAllVouchers,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vouchers
      .filter((v: Voucher) => {
        if (filter !== "all" && effectiveStatus(v) !== filter) return false;
        if (!q) return true;
        return (
          v.title.toLowerCase().includes(q) ||
          (v.description ?? "").toLowerCase().includes(q) ||
          (v.recipient?.email ?? "").toLowerCase().includes(q) ||
          (v.recipient?.display_name ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a: Voucher, b: Voucher) => {
        const ta = new Date(a.created_at).getTime();
        const tb = new Date(b.created_at).getTime();
        return sort === "newest" ? tb - ta : ta - tb;
      });
  }, [vouchers, search, filter, sort]);

  const handleCancel = async (v: Voucher) => {
    if (!window.confirm(`Cancel "${v.title}"? The recipient will no longer be able to claim it.`))
      return;
    try {
      await cancelVoucher(v.id);
      toast.success("Voucher cancelled.");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cancel failed.");
    }
  };

  const handleResend = async (v: Voucher) => {
    try {
      await resendVoucher(v.id);
      toast.success("Another copy sent.");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Resend failed.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteVoucher(deleteTarget.id);
      toast.success("Voucher deleted — it will no longer appear to the recipient.");
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  const canEditOrCancel = (v: Voucher) => effectiveStatus(v) === "available" || v.status === "draft";
  const canResend = (v: Voucher) => v.status !== "draft";

  return (
    <div>
      {/* Controls */}
      <div className="bg-slate-800/40 rounded-2xl border border-slate-700/60 p-4 mb-5 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, message, or recipient…"
              className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 pl-9 pr-9 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none min-h-[40px]"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <ArrowUpDown size={14} className="text-slate-500" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
              className="rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-slate-200 focus:outline-none min-h-[40px]"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold border transition-all ${
                filter === f.id
                  ? "bg-indigo-500 text-white border-indigo-500"
                  : "bg-slate-900/60 text-slate-300 border-slate-700 hover:bg-slate-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-slate-400 text-sm gap-2">
          <Loader2 size={18} className="animate-spin text-indigo-400" /> Loading vouchers…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-slate-800/30 rounded-3xl border border-dashed border-slate-700">
          <p className="font-bold text-slate-300">No vouchers found</p>
          <p className="text-xs mt-1">Create one or adjust your filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/60">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-bold">Voucher</th>
                <th className="py-3 px-4 font-bold">Recipient</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold">Sent</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((v: Voucher) => {
                const st = effectiveStatus(v);
                return (
                  <tr key={v.id} className="hover:bg-slate-800/40 align-top">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {v.image_url ? (
                          <img
                            src={v.image_url}
                            alt={v.title}
                            className="h-10 w-10 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-slate-700 flex items-center justify-center text-slate-500 text-[10px]">
                            {VOUCHER_TYPE_LABELS[v.voucher_type].slice(0, 1)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-100 truncate max-w-[220px]">{v.title}</p>
                          <p className="text-slate-500">{VOUCHER_TYPE_LABELS[v.voucher_type]}</p>
                          {v.claimed_at && (
                            <p className="text-indigo-400 mt-0.5">
                              Claimed {new Date(v.claimed_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {v.recipient?.display_name || v.recipient?.email || "—"}
                      {v.recipient?.email && v.recipient?.display_name && (
                        <p className="text-slate-500">{v.recipient.email}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[st]}`}
                      >
                        {st}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {v.sent_at ? new Date(v.sent_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setActivityFor(v)}
                          title="Activity history"
                          className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg"
                        >
                          <History size={15} />
                        </button>
                        {canResend(v) && (
                          <button
                            onClick={() => handleResend(v)}
                            title="Send another copy"
                            className="p-2 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-lg"
                          >
                            <Repeat2 size={15} />
                          </button>
                        )}
                        {canEditOrCancel(v) && (
                          <button
                            onClick={() => setEditing(v)}
                            title="Edit"
                            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg"
                          >
                            <Pencil size={15} />
                          </button>
                        )}
                        {canEditOrCancel(v) && (
                          <button
                            onClick={() => handleCancel(v)}
                            title="Cancel"
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg"
                          >
                            <Ban size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(v)}
                          title="Delete permanently"
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit modal */}
      <AnimatePresence>
        {editing && (
          <VoucherForm
            editing={editing}
            onClose={() => setEditing(null)}
            onSaved={() => refetch()}
          />
        )}
      </AnimatePresence>

      {/* Activity drawer */}
      <AnimatePresence>
        {activityFor && (
          <ActivityDrawer voucher={activityFor} onClose={() => setActivityFor(null)} />
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4"
            onClick={() => !deleting && setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 15, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 text-center text-slate-100"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 border-2 border-red-500/40 text-red-400">
                <Trash2 size={28} className="animate-pulse" />
              </div>
              <h3 className="text-xl font-extrabold mb-2">Delete voucher permanently?</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-2">
                You're about to delete{" "}
                <strong className="text-slate-100">"{deleteTarget.title}"</strong>.
              </p>
              <p className="text-xs text-amber-400/90 flex items-center justify-center gap-1.5 mb-6">
                <AlertTriangle size={14} className="shrink-0" />
                This cannot be undone. The voucher will be removed entirely and will
                no longer appear to the recipient.
              </p>
              <div className="flex items-center justify-end gap-3 w-full">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 min-h-[44px] disabled:opacity-50"
                >
                  Keep it
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-sm min-h-[44px] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Deleting…
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} /> Delete
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActivityDrawer({ voucher, onClose }: { voucher: Voucher; onClose: () => void }) {
  const { data: activity = [], isLoading } = useQuery<VoucherActivity[]>({
    queryKey: ["voucherActivity", voucher.id],
    queryFn: () => listActivity(voucher.id),
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 p-6 overflow-y-auto text-slate-100"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold flex items-center gap-2">
            <History size={18} className="text-indigo-400" /> Activity
          </h3>
          <button onClick={onClose} className="rounded-full bg-slate-800 p-2 text-slate-400">
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-5 truncate">{voucher.title}</p>

        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        ) : activity.length === 0 ? (
          <p className="text-sm text-slate-500">No activity recorded.</p>
        ) : (
          <ol className="relative space-y-4 border-l border-slate-700 pl-4">
            {activity.map((a: VoucherActivity) => (
              <li key={a.id} className="text-xs">
                <span className="absolute -left-[5px] h-2.5 w-2.5 rounded-full bg-indigo-500" />
                <p className="font-bold text-slate-100 capitalize">{a.action}</p>
                <p className="text-slate-500">{new Date(a.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ol>
        )}
      </motion.div>
    </motion.div>
  );
}
import { useMemo } from "react";
import { Ticket, CheckCircle2, Clock, XCircle, Loader2, CheckCheck } from "lucide-react";
import { Voucher, effectiveStatus } from "../../lib/vouchers";

interface Props {
  vouchers: Voucher[];
  loading?: boolean;
}

export function AdminVoucherSummary({ vouchers, loading }: Props) {
  const stats = useMemo(() => {
    let available = 0,
      claimed = 0,
      redeemed = 0,
      expired = 0;
    for (const v of vouchers) {
      const s = effectiveStatus(v);
      if (s === "available") available++;
      else if (s === "claimed") claimed++;
      else if (s === "redeemed") redeemed++;
      else if (s === "expired") expired++;
    }
    return { total: vouchers.length, available, claimed, redeemed, expired };
  }, [vouchers]);

  const cards = [
    { label: "Total", value: stats.total, icon: Ticket, color: "from-indigo-500 to-sky-500" },
    { label: "Available", value: stats.available, icon: Clock, color: "from-emerald-500 to-teal-500" },
    { label: "Claimed", value: stats.claimed, icon: CheckCircle2, color: "from-violet-500 to-purple-500" },
    { label: "Redeemed", value: stats.redeemed, icon: CheckCheck, color: "from-teal-500 to-emerald-600" },
    { label: "Expired", value: stats.expired, icon: XCircle, color: "from-amber-500 to-orange-500" },
  ];

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
        <Loader2 size={18} className="animate-spin text-indigo-400" /> Loading summary…
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4 flex items-center gap-3"
        >
          <div
            className={`h-10 w-10 rounded-xl bg-gradient-to-tr ${c.color} text-white flex items-center justify-center shrink-0 shadow`}
          >
            <c.icon size={20} />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              {c.label}
            </p>
            <p className="text-xl font-black text-slate-100">{c.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
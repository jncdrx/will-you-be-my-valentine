import { motion } from "framer-motion";
import { Award, Star, Gift, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import {
  Voucher,
  VoucherStatus,
  effectiveStatus,
  isClaimable,
  VOUCHER_TYPE_LABELS,
} from "../../lib/vouchers";
import { monthsaryConfig } from "../../config/monthsaryConfig";

interface TicketTheme {
  name: string;
  body: string; // inner ticket gradient
  border: string; // outer p-[2px] gradient
  glowA: string; // ambient glow top-right
  glowB: string; // ambient glow bottom-left
}

// Each voucher gets one of these themes, picked deterministically from its id
// so the color is stable across reloads, devices, and the admin/user views,
// but distinct per voucher.
const TICKET_THEMES: TicketTheme[] = [
  {
    name: "Rose",
    body: "linear-gradient(135deg, #3d0313 0%, #690a29 50%, #3d0313 100%)",
    border: "linear-gradient(to bottom right, rgba(252,211,77,.6), rgba(244,114,182,.3), rgba(252,211,77,.6))",
    glowA: "rgba(251,191,36,.10)",
    glowB: "rgba(244,63,94,.10)",
  },
  {
    name: "Royal Purple",
    body: "linear-gradient(135deg, #1e0a3c 0%, #3b0764 50%, #1e0a3c 100%)",
    border: "linear-gradient(to bottom right, rgba(252,211,77,.6), rgba(167,139,250,.35), rgba(252,211,77,.6))",
    glowA: "rgba(167,139,250,.12)",
    glowB: "rgba(251,191,36,.08)",
  },
  {
    name: "Emerald",
    body: "linear-gradient(135deg, #022c22 0%, #064e3b 50%, #022c22 100%)",
    border: "linear-gradient(to bottom right, rgba(252,211,77,.6), rgba(52,211,153,.3), rgba(252,211,77,.6))",
    glowA: "rgba(52,211,153,.12)",
    glowB: "rgba(251,191,36,.08)",
  },
  {
    name: "Twilight Blue",
    body: "linear-gradient(135deg, #0b1d3a 0%, #1e3a8a 50%, #0b1d3a 100%)",
    border: "linear-gradient(to bottom right, rgba(252,211,77,.6), rgba(96,165,250,.3), rgba(252,211,77,.6))",
    glowA: "rgba(96,165,250,.12)",
    glowB: "rgba(251,191,36,.08)",
  },
  {
    name: "Sunset",
    body: "linear-gradient(135deg, #3d0313 0%, #7c2d12 50%, #3d0313 100%)",
    border: "linear-gradient(to bottom right, rgba(252,211,77,.6), rgba(251,146,60,.35), rgba(252,211,77,.6))",
    glowA: "rgba(251,146,60,.12)",
    glowB: "rgba(244,63,94,.10)",
  },
  {
    name: "Magenta",
    body: "linear-gradient(135deg, #2d0a2e 0%, #6b0f5c 50%, #2d0a2e 100%)",
    border: "linear-gradient(to bottom right, rgba(252,211,77,.6), rgba(244,114,182,.35), rgba(252,211,77,.6))",
    glowA: "rgba(244,114,182,.12)",
    glowB: "rgba(251,191,36,.08)",
  },
  {
    name: "Teal",
    body: "linear-gradient(135deg, #022d36 0%, #0e4f5c 50%, #022d36 100%)",
    border: "linear-gradient(to bottom right, rgba(252,211,77,.6), rgba(45,212,191,.3), rgba(252,211,77,.6))",
    glowA: "rgba(45,212,191,.12)",
    glowB: "rgba(251,191,36,.08)",
  },
  {
    name: "Midnight Gold",
    body: "linear-gradient(135deg, #1a1207 0%, #3b2a08 50%, #1a1207 100%)",
    border: "linear-gradient(to bottom right, rgba(252,211,77,.7), rgba(251,191,36,.35), rgba(252,211,77,.7))",
    glowA: "rgba(251,191,36,.14)",
    glowB: "rgba(244,63,94,.06)",
  },
];

function pickTicketTheme(id: string): TicketTheme {
  // Simple deterministic hash so the same voucher always gets the same theme.
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return TICKET_THEMES[hash % TICKET_THEMES.length];
}

interface VoucherCardProps {
  voucher: Voucher;
  onClaim: (voucher: Voucher) => void;
}

const STATUS_DISPLAY: Record<VoucherStatus, { label: string; cls: string }> = {
  draft: { label: "DRAFT", cls: "text-slate-300" },
  available: { label: "UNCLAIMED", cls: "text-amber-300" },
  claimed: { label: "CLAIMED & RESERVED", cls: "text-emerald-300" },
  redeemed: { label: "REDEEMED & FULFILLED", cls: "text-purple-300" },
  expired: { label: "EXPIRED", cls: "text-amber-300" },
  cancelled: { label: "CANCELLED", cls: "text-red-300" },
};

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function VoucherCard({ voucher, onClaim }: VoucherCardProps) {
  const status = effectiveStatus(voucher);
  const statusDisp = STATUS_DISPLAY[status];
  const claimable = isClaimable(voucher);
  const validity = voucher.expires_at ? `Valid until ${fmtDate(voucher.expires_at)}` : "Forever Valid";
  const voucherNo = `#${voucher.id.slice(0, 4).toUpperCase()}-${new Date(voucher.created_at).getFullYear()}`;
  const authCode = `AUTH-${voucher.id.slice(0, 8).toUpperCase()}`;
  const theme = pickTicketTheme(voucher.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3 w-full max-w-md"
    >
      {/* Exportable Ticket Element */}
      <div
        className="relative w-full rounded-[24px] p-[2px] shadow-[0_16px_40px_rgba(76,5,25,0.3)] transition-all duration-300"
        style={{ background: theme.border }}
      >
        <div
          className="relative text-white p-5 sm:p-7 rounded-[22px] overflow-hidden border border-amber-200/15 font-sans"
          style={{ background: theme.body }}
        >
          {/* Ambient Decorative Accents */}
          <div
            className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl pointer-events-none"
            style={{ backgroundColor: theme.glowA }}
          />
          <div
            className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full blur-3xl pointer-events-none"
            style={{ backgroundColor: theme.glowB }}
          />

          {/* Top Header */}
          <div className="relative flex flex-wrap justify-between items-center gap-2 mb-4 pb-3.5 border-b border-amber-300/20 font-sans">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-200 bg-amber-400/15 border border-amber-300/35 px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-sm">
              <Award size={14} className="text-amber-300 shrink-0" />
              <span>Official {VOUCHER_TYPE_LABELS[voucher.voucher_type]}</span>
            </span>
            <span className="text-[11px] sm:text-xs font-mono font-bold text-amber-100/90 tracking-wider">
              NO. {voucherNo} <span className="opacity-40">•</span> {validity.toUpperCase()}
            </span>
          </div>

          {/* Voucher Image Banner */}
          {voucher.image_url && (
            <div className="relative mb-4 rounded-2xl overflow-hidden border border-amber-300/20 shadow-inner">
              <img
                src={voucher.image_url}
                alt={voucher.title}
                className="w-full h-40 sm:h-48 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-rose-950/70 via-transparent to-transparent pointer-events-none" />
            </div>
          )}

          {/* Ticket Title & Description */}
          <div className="mb-4 text-left font-sans">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-normal font-display text-amber-200 leading-snug tracking-wide mb-2">
              {voucher.title}
            </h3>
            {voucher.description && (
              <p className="text-xs sm:text-sm text-rose-100/90 leading-relaxed font-sans font-medium whitespace-pre-wrap">
                {voucher.description}
              </p>
            )}
          </div>

          {/* Redemption Divider with Side Cutouts */}
          <div className="relative my-4 flex items-center justify-center font-sans">
            <div className="absolute -left-5 sm:-left-7 inset-y-0 my-auto h-6 w-4 sm:w-5 rounded-r-full bg-[#fdf2f8] border-r border-y border-rose-300/30 shadow-inner z-10" />
            <div className="absolute -right-5 sm:-right-7 inset-y-0 my-auto h-6 w-4 sm:w-5 rounded-l-full bg-[#fdf2f8] border-l border-y border-rose-300/30 shadow-inner z-10" />
            <div className="w-full flex items-center justify-center gap-2 sm:gap-3">
              <div className="flex-1 border-t border-dashed border-rose-400/30" />
              <span className="text-[10px] sm:text-xs font-bold text-amber-200/90 tracking-widest uppercase px-3 py-1 bg-rose-950/90 rounded-full border border-amber-300/20 shrink-0 font-sans shadow-sm text-center">
                Voucher Details &amp; Redemption
              </span>
              <div className="flex-1 border-t border-dashed border-rose-400/30" />
            </div>
          </div>

          {/* Instructions (if any) */}
          {voucher.instructions && (
            <div className="mb-4 bg-rose-950/50 p-3.5 rounded-xl border border-rose-400/15 text-left font-sans">
              <span className="text-[10px] sm:text-[11px] font-bold text-rose-300/80 uppercase tracking-wider block mb-1">
                How to use
              </span>
              <p className="text-xs sm:text-sm text-rose-100/90 leading-relaxed whitespace-pre-wrap">
                {voucher.instructions}
              </p>
            </div>
          )}

          {/* Metadata Detail Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-5 text-left font-sans">
            <div className="bg-rose-950/60 backdrop-blur-sm p-3 sm:p-3.5 rounded-xl border border-rose-400/20 flex flex-col justify-between h-full min-h-[76px]">
              <span className="text-[10px] sm:text-[11px] font-bold text-rose-300/80 uppercase tracking-wider block mb-1">
                Issued To
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-white leading-snug break-words block capitalize">
                {monthsaryConfig.girlfriendName}
              </span>
            </div>

            <div className="bg-rose-950/60 backdrop-blur-sm p-3 sm:p-3.5 rounded-xl border border-rose-400/20 flex flex-col justify-between h-full min-h-[76px]">
              <span className="text-[10px] sm:text-[11px] font-bold text-rose-300/80 uppercase tracking-wider block mb-1">
                Sponsor
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-amber-300">
                {monthsaryConfig.authorName}
              </span>
            </div>

            <div className="bg-rose-950/60 backdrop-blur-sm p-3 sm:p-3.5 rounded-xl border border-rose-400/20 flex flex-col justify-between h-full min-h-[76px]">
              <span className="text-[10px] sm:text-[11px] font-bold text-rose-300/80 uppercase tracking-wider block mb-1">
                Validity
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-rose-100">
                {voucher.expires_at ? fmtDate(voucher.expires_at) : "Forever Valid"}
              </span>
            </div>

            <div className="bg-rose-950/60 backdrop-blur-sm p-3 sm:p-3.5 rounded-xl border border-rose-400/20 flex flex-col justify-between h-full min-h-[76px]">
              <span className="text-[10px] sm:text-[11px] font-bold text-rose-300/80 uppercase tracking-wider block mb-1">
                Status
              </span>
              <span className={`text-xs sm:text-sm font-extrabold ${statusDisp.cls}`}>
                {statusDisp.label}
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
                {authCode}
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-amber-400/15 border border-amber-300/35 px-3 py-1.5 rounded-full text-amber-200 text-[10px] sm:text-xs font-bold shadow-sm shrink-0">
              <Star size={13} className="fill-amber-300 text-amber-300 shrink-0" />
              <span>100% SPONSORED BY YOUR BABY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Interactive Action Buttons (Outside the ticket) */}
      <div className="flex flex-wrap items-center justify-center gap-3 w-full mt-1">
        {status === "claimed" && voucher.claimed_at ? (
          <div className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 py-3.5 text-sm font-bold text-emerald-700">
            <CheckCircle2 size={18} />
            Claimed on{" "}
            {new Date(voucher.claimed_at).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        ) : status === "redeemed" ? (
          <div className="w-full flex items-center justify-center gap-2 rounded-2xl bg-purple-50 border border-purple-200 py-3.5 text-sm font-bold text-purple-700">
            <CheckCircle2 size={18} />
            Redeemed & Fulfilled 💕
          </div>
        ) : claimable ? (
          <button
            onClick={() => onClaim(voucher)}
            className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white text-sm font-extrabold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 min-h-[48px] active:scale-95"
          >
            <Gift size={18} /> Claim Voucher
          </button>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gray-100 border border-gray-200 py-3.5 text-sm font-bold text-gray-500">
            <AlertCircle size={18} />
            {status === "expired"
              ? "This voucher has expired."
              : status === "cancelled"
              ? "This voucher was cancelled."
              : "Not available"}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-1 text-[10px] text-rose-400 -mt-1">
        <Sparkles size={10} className="text-rose-400" />
        <span>Sent with love, just for you</span>
      </div>
    </motion.div>
  );
}
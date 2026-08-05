import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  RefreshCw,
  Search,
  ShieldAlert,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  CheckCircle2,
  XCircle,
  Lock,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";

/**
 * Admin Security Logs viewer.
 * Reads from the `get_login_attempts` RPC (admin-only, server-enforced). The lockout /
 * attempt logging itself is handled by the `secure-login` edge function + Postgres RPCs;
 * this page is read-only and admin-gated by AdminRoutes.
 */

export interface LoginAttemptRow {
  id: string;
  account_identifier: string;
  role: "admin" | "user";
  attempt_status: "success" | "failed" | "locked";
  ip_address: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  device_type: string | null;
  os: string | null;
  browser: string | null;
  browser_version: string | null;
  user_agent: string | null;
  created_at: string;
}

type StatusFilter = "all" | "success" | "failed" | "locked";
type DeviceFilter = "all" | "desktop" | "mobile" | "tablet" | "other";

const PAGE_SIZE = 25;

const deviceIcon = (d: string | null) => {
  switch (d) {
    case "mobile":
      return <Smartphone size={13} />;
    case "tablet":
      return <Tablet size={13} />;
    case "desktop":
      return <Monitor size={13} />;
    default:
      return <Monitor size={13} className="opacity-40" />;
  }
};

function StatusBadge({ status }: { status: LoginAttemptRow["attempt_status"] }) {
  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
        <CheckCircle2 size={11} /> Success
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-300 border border-red-500/30">
        <XCircle size={11} /> Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
      <Lock size={11} /> Locked
    </span>
  );
}

function formatLocation(row: LoginAttemptRow): string {
  const parts = [row.city, row.region, row.country].filter(Boolean);
  return parts.length ? parts.join(", ") : "Unknown";
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function AdminSecurityLogs() {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [account, setAccount] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [location, setLocation] = useState("");
  const [device, setDevice] = useState<DeviceFilter>("all");
  const [browser, setBrowser] = useState("");
  const [page, setPage] = useState(0);

  const filters = useMemo(
    () => ({
      status: status === "all" ? "" : status,
      account: account.trim(),
      date_from: dateFrom,
      date_to: dateTo,
      location: location.trim(),
      device: device === "all" ? "" : device,
      browser: browser.trim(),
    }),
    [status, account, dateFrom, dateTo, location, device, browser]
  );

  const queryKey = useMemo(
    () => ["adminLoginAttempts", filters, page] as const,
    [filters, page]
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return { rows: [] as LoginAttemptRow[], total: 0 };
      }
      const { data, error } = await supabase.rpc("get_login_attempts", {
        p_filters: filters,
        p_limit: PAGE_SIZE,
        p_offset: page * PAGE_SIZE,
      });
      if (error) throw error;
      const result = (data ?? { rows: [], total: 0 }) as {
        rows: LoginAttemptRow[];
        total: number;
      };
      return result;
    },
    placeholderData: (prev) => prev,
  });

  const rows: LoginAttemptRow[] = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const resetPage = () => setPage(0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-extrabold flex items-center gap-2">
          <ShieldAlert size={20} className="text-indigo-400" /> Security Logs
        </h1>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 rounded-2xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-indigo-300 border border-slate-700 hover:bg-slate-700 transition-all min-h-[36px] disabled:opacity-50"
        >
          {isFetching ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>

      <p className="text-xs text-slate-400 -mt-2">
        Login attempts are recorded server-side by the <code className="text-slate-300">secure-login</code>{" "}
        edge function. IP-based location is approximate. Records auto-expire after the retention
        window (default 90 days).
      </p>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as StatusFilter);
                resetPage();
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none min-h-[36px]"
            >
              <option value="all">All</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="locked">Locked</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Account
            </label>
            <input
              type="text"
              value={account}
              onChange={(e) => {
                setAccount(e.target.value);
                resetPage();
              }}
              placeholder="email…"
              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none min-h-[36px]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Date from
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                resetPage();
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none min-h-[36px]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Date to
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                resetPage();
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none min-h-[36px]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Location
            </label>
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  resetPage();
                }}
                placeholder="country / region / city…"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/60 pl-7 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none min-h-[36px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Device
            </label>
            <select
              value={device}
              onChange={(e) => {
                setDevice(e.target.value as DeviceFilter);
                resetPage();
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none min-h-[36px]"
            >
              <option value="all">All</option>
              <option value="desktop">Desktop</option>
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Browser
            </label>
            <input
              type="text"
              value={browser}
              onChange={(e) => {
                setBrowser(e.target.value);
                resetPage();
              }}
              placeholder="Chrome, Safari…"
              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none min-h-[36px]"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setStatus("all");
                setAccount("");
                setDateFrom("");
                setDateTo("");
                setLocation("");
                setDevice("all");
                setBrowser("");
                resetPage();
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-all min-h-[36px]"
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-3 py-2.5 font-bold">Date &amp; Time</th>
                <th className="px-3 py-2.5 font-bold">Account</th>
                <th className="px-3 py-2.5 font-bold">Status</th>
                <th className="px-3 py-2.5 font-bold">Location</th>
                <th className="px-3 py-2.5 font-bold">IP</th>
                <th className="px-3 py-2.5 font-bold">Device</th>
                <th className="px-3 py-2.5 font-bold">OS</th>
                <th className="px-3 py-2.5 font-bold">Browser</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-slate-400">
                    <Loader2 size={18} className="animate-spin inline-block" />
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-red-300">
                    Failed to load logs:{" "}
                    {error instanceof Error ? error.message : "unknown error"}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-slate-400">
                    No login attempts match the current filters.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40">
                    <td className="px-3 py-2.5 whitespace-nowrap text-slate-300">
                      {formatDateTime(r.created_at)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-slate-100">{r.account_identifier}</div>
                      <div className="text-[10px] text-slate-500 uppercase">{r.role}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={r.attempt_status} />
                    </td>
                    <td className="px-3 py-2.5 text-slate-300">
                      <span className="inline-flex items-center gap-1">
                        <Globe size={12} className="text-slate-500" />
                        {formatLocation(r)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-400 font-mono">
                      {r.ip_address ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-slate-300">
                      <span className="inline-flex items-center gap-1">
                        {deviceIcon(r.device_type)}
                        <span className="capitalize">{r.device_type ?? "—"}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-300">{r.os ?? "—"}</td>
                    <td className="px-3 py-2.5 text-slate-300">
                      {r.browser ? `${r.browser}${r.browser_version ? " " + r.browser_version : ""}` : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
        <span>
          {total > 0
            ? `Showing ${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total)} of ${total}`
            : "No records"}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 rounded-full border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-slate-300 font-semibold">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-2 rounded-full border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
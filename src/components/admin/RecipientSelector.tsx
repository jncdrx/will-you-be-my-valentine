import { useEffect, useState } from "react";
import { User, ChevronDown, Check } from "lucide-react";
import { listProfiles, RecipientProfile } from "../../lib/vouchers";

interface RecipientSelectorProps {
  value: string;
  onChange: (id: string) => void;
  error?: string;
}

export function RecipientSelector({ value, onChange, error }: RecipientSelectorProps) {
  const [profiles, setProfiles] = useState<RecipientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listProfiles()
      .then((p) => {
        if (active) {
          setProfiles(p);
          if (!value && p.length > 0) {
            onChange(p[0].id);
          }
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = profiles.find((p) => p.id === value);

  return (
    <div className="relative">
      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
        Recipient
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between rounded-2xl border bg-slate-800/60 px-3.5 py-3 text-sm text-slate-100 min-h-[48px] focus:outline-none focus:ring-2 ${
          error ? "border-red-500/60 focus:ring-red-500/30" : "border-slate-700 focus:ring-indigo-500/40"
        }`}
      >
        <span className="flex items-center gap-2 min-w-0 truncate">
          <User size={16} className="text-slate-500 shrink-0" />
          {loading ? (
            <span className="text-slate-500">Loading recipients…</span>
          ) : selected ? (
            <span className="truncate">
              {selected.display_name || selected.email}
              {selected.display_name && (
                <span className="text-slate-500"> · {selected.email}</span>
              )}
            </span>
          ) : (
            <span className="text-slate-500">Select a recipient…</span>
          )}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-500 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {error && <p className="mt-1 text-[11px] font-semibold text-red-400">{error}</p>}

      {open && !loading && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute z-40 mt-2 w-full max-h-60 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            {profiles.length === 0 ? (
              <div className="p-3 text-xs text-slate-500">
                No registered users yet. Sign up a recipient first.
              </div>
            ) : (
              profiles.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onChange(p.id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-800"
                >
                  <span className="min-w-0 truncate">
                    <span className="font-semibold">{p.display_name || p.email}</span>
                    {p.display_name && (
                      <span className="text-slate-500"> · {p.email}</span>
                    )}
                  </span>
                  {p.id === value && <Check size={15} className="text-indigo-400 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
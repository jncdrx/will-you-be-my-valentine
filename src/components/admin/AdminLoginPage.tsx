import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, KeyRound, ShieldCheck, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { signInAdmin, LoginError } from "../../lib/auth";
import { isSupabaseConfigured } from "../../lib/supabase";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => import.meta.env.VITE_ADMIN_EMAIL || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Please enter your admin email and password.");
      return;
    }
    setLoading(true);
    try {
      await signInAdmin(email, password);
      toast.success("Welcome back, admin.");
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof LoginError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Sign-in failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 text-slate-100 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="relative w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-8"
      >
        <button
          onClick={() => navigate("/")}
          className="absolute top-5 left-5 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 text-xs"
        >
          <ArrowLeft size={14} /> Site
        </button>

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-500 text-white shadow-lg shadow-indigo-500/30">
          <ShieldCheck size={26} />
        </div>

        <h1 className="text-center text-2xl font-extrabold tracking-tight text-white">
          Admin Portal
        </h1>
        <p className="text-center text-xs text-slate-400 mt-1 mb-6">
          Authorized administrators only. Sign in with your Supabase account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                autoComplete="username"
                className="w-full rounded-2xl border border-slate-700 bg-slate-800/60 pl-10 pr-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 min-h-[48px]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <KeyRound size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-2xl border border-slate-700 bg-slate-800/60 pl-10 pr-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 min-h-[48px]"
                required
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-2 rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-xs font-semibold text-red-300"
              >
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading || !isSupabaseConfigured()}
            className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-sky-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Verifying…</span>
              </>
            ) : (
              <>
                <Lock size={16} />
                <span>Sign in to Dashboard</span>
              </>
            )}
          </button>
        </form>

        {!isSupabaseConfigured() && (
          <p className="mt-5 text-center text-[11px] text-amber-400/80">
            Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
          </p>
        )}
      </motion.div>
    </div>
  );
}
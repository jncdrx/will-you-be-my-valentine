import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Heart, KeyRound, Sparkles, Eye, EyeOff, AlertCircle } from "lucide-react";
import { monthsaryConfig } from "../config/monthsaryConfig";
import { verifySitePassword } from "../lib/supabase";

interface PasswordGateProps {
  onUnlocked: () => void;
}

export function PasswordGate({ onUnlocked }: PasswordGateProps) {
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const triggerHaptic = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic();

    if (!passwordInput.trim()) {
      setErrorMsg("Please enter the secret password, my love!");
      handleShake();
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    try {
      const isValid = await verifySitePassword(passwordInput.trim());

      if (isValid) {
        sessionStorage.setItem("monthsary_authenticated", "true");
        onUnlocked();
      } else {
        setErrorMsg("Incorrect password, my love! Please try again");
        handleShake();
      }
    } catch (err) {
      console.error("Verification error:", err);
      setErrorMsg("Unable to verify password. Please try again.");
      handleShake();
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-rose-950/40 backdrop-blur-xl p-4">
      {/* Background Floating Ambient Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-400/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          x: shake ? [-10, 10, -8, 8, -4, 4, 0] : 0,
        }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md bg-white/90 backdrop-blur-2xl p-7 sm:p-9 rounded-3xl border border-white/80 shadow-2xl text-center overflow-hidden"
      >
        {/* Top Decorative Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-400 text-white shadow-lg shadow-rose-500/30">
          <Lock size={30} className="animate-bounce" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100/80 border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-wider mb-2">
          <Heart size={12} className="fill-rose-500 text-rose-500" />
          <span>7th Monthsary Password Gate</span>
        </span>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-rose-600 font-display mt-1">
          Welcome, {monthsaryConfig.girlfriendName}
        </h1>

        <p className="text-xs sm:text-sm text-gray-600 mt-2 mb-6 leading-relaxed">
          Please enter our secret password to unlock your 7th Monthsary surprise website
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-rose-400">
              <KeyRound size={18} />
            </div>

            <input
              type={showPassword ? "text" : "password"}
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="Enter secret password..."
              className="w-full pl-11 pr-11 py-3.5 rounded-2xl border border-rose-200 bg-rose-50/50 text-base text-gray-800 font-semibold focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-300/50 transition-all text-center tracking-widest placeholder:tracking-normal placeholder:font-normal"
              autoFocus
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-rose-400 hover:text-rose-600 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-red-50 border border-red-200 text-xs font-bold text-red-600 shadow-sm"
            >
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isVerifying}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white font-bold text-base shadow-xl shadow-rose-500/25 hover:shadow-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-h-[52px]"
          >
            {isVerifying ? (
              <span className="flex items-center gap-2">
                <Sparkles size={18} className="animate-spin" />
                <span>Checking password...</span>
              </span>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Unlock My Surprise</span>
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-6 pt-4 border-t border-rose-100 flex items-center justify-center gap-1 text-[11px] font-medium text-rose-400">
          <Heart size={10} className="fill-rose-400 text-rose-400" />
          <span>Made with endless love for {monthsaryConfig.girlfriendName}</span>
        </div>
      </motion.div>
    </div>
  );
}

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Heart, KeyRound, Sparkles, Mail, AlertCircle, RefreshCw } from "lucide-react";
import { monthsaryConfig } from "../config/monthsaryConfig";
import { verifySitePassword, verifyAllowedEmail } from "../lib/supabase";

interface AngelAuthGateProps {
  onUnlocked: () => void;
}

export function AngelAuthGate({ onUnlocked }: AngelAuthGateProps) {
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
    setErrorMsg(null);

    const formattedEmail = emailInput.trim().toLowerCase();
    const password = passwordInput.trim();

    if (!formattedEmail) {
      setErrorMsg("Please enter your email address, my love!");
      handleShake();
      return;
    }

    if (!password) {
      setErrorMsg("Please enter your private password, my love!");
      handleShake();
      return;
    }

    setIsLoading(true);

    try {
      // 1. Verify Allowed Email against Supabase site_settings / env
      const isAllowedEmail = await verifyAllowedEmail(formattedEmail);

      if (!isAllowedEmail) {
        setErrorMsg("Access restricted: This private website is created exclusively for Angel 💕");
        handleShake();
        setIsLoading(false);
        return;
      }

      // 2. Verify Private Password against Supabase site_settings / RPC (1426)
      const isValidPassword = await verifySitePassword(password);

      if (!isValidPassword) {
        setErrorMsg("Incorrect private password! Please try again ❤️");
        handleShake();
        setIsLoading(false);
        return;
      }

      // Both email & password verified successfully!
      sessionStorage.setItem("monthsary_authenticated", "true");
      sessionStorage.setItem("monthsary_angel_email", formattedEmail);
      onUnlocked();
    } catch (err) {
      console.error("Login verification exception:", err);
      setErrorMsg("Verification error. Please try again.");
      handleShake();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-rose-950/40 backdrop-blur-xl p-4 overflow-y-auto">
      {/* Background Floating Ambient Glow */}
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
        className="relative w-full max-w-md bg-white/95 backdrop-blur-2xl p-7 sm:p-9 rounded-3xl border border-white/90 shadow-2xl text-center overflow-hidden my-auto"
      >
        {/* Top Decorative Lock Icon */}
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-600 text-white shadow-lg shadow-rose-500/30">
          <Lock size={28} className="animate-bounce" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-100/80 border border-rose-200 text-rose-700 text-xs font-extrabold uppercase tracking-wider mb-2">
          <Heart size={12} className="fill-rose-500 text-rose-500" />
          <span>Angel's Private Monthsary Gate</span>
        </span>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-rose-600 font-display mt-1">
          Welcome, {monthsaryConfig.girlfriendName}
        </h1>

        <p className="text-xs sm:text-sm text-gray-600 mt-1.5 mb-6 leading-relaxed">
          Please enter your email and private access password to unlock your surprise website 💕
        </p>

        {/* EMAIL & PASSWORD LOGIN FORM */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Email Input */}
          <div>
            <label className="block text-[11px] font-extrabold text-rose-700 uppercase tracking-wider mb-1.5">
              Your Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-rose-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="Enter your email address..."
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-rose-200 bg-rose-50/50 text-sm text-gray-800 font-semibold focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-300/50 transition-all placeholder:font-normal"
                autoFocus
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-[11px] font-extrabold text-rose-700 uppercase tracking-wider mb-1.5">
              Private Access Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-rose-400">
                <KeyRound size={18} />
              </div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="Enter private password..."
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-rose-200 bg-rose-50/50 text-sm text-gray-800 font-bold tracking-widest focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-300/50 transition-all placeholder:tracking-normal placeholder:font-normal"
                required
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white font-bold text-base shadow-xl shadow-rose-500/25 hover:shadow-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-h-[52px] mt-2"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <RefreshCw size={18} className="animate-spin" />
                <span>Unlocking surprise...</span>
              </span>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Unlock My Personal Page 💕</span>
              </>
            )}
          </motion.button>
        </form>

        {/* Error Alert */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-4 flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-bold text-red-600 shadow-sm"
            >
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 pt-4 border-t border-rose-100 flex items-center justify-center gap-1 text-[11px] font-medium text-rose-400">
          <Heart size={10} className="fill-rose-400 text-rose-400" />
          <span>Made exclusively for {monthsaryConfig.girlfriendName}</span>
        </div>
      </motion.div>
    </div>
  );
}

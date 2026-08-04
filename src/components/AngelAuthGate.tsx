import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Heart, KeyRound, Sparkles, Mail, ShieldCheck, AlertCircle, ArrowRight, RefreshCw, CheckCircle2 } from "lucide-react";
import { monthsaryConfig } from "../config/monthsaryConfig";
import { supabase, verifySitePassword, isSupabaseConfigured, verifyAllowedEmail } from "../lib/supabase";

interface AngelAuthGateProps {
  onUnlocked: () => void;
}

type AuthStep = "email" | "otp" | "password";

export function AngelAuthGate({ onUnlocked }: AngelAuthGateProps) {
  const [authStep, setAuthStep] = useState<AuthStep>("email");
  const [emailInput, setEmailInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
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

  // Step 1: Handle Email Submit & Send Supabase OTP
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic();
    setErrorMsg(null);
    setSuccessMsg(null);

    const formattedEmail = emailInput.trim().toLowerCase();

    if (!formattedEmail) {
      setErrorMsg("Please enter your email address, my love!");
      handleShake();
      return;
    }

    setIsLoading(true);

    const isAllowed = await verifyAllowedEmail(formattedEmail);
    if (!isAllowed) {
      setIsLoading(false);
      setErrorMsg(`Access restricted: This private website is created exclusively for Angel 💕`);
      handleShake();
      return;
    }

    if (!isSupabaseConfigured()) {
      // Offline fallback: skip to OTP step
      setIsLoading(false);
      setAuthStep("otp");
      setSuccessMsg(`Verification code sent to your email!`);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: formattedEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        console.error("Supabase OTP send error:", error);
        setErrorMsg(error.message || "Failed to send verification code. Please try again.");
        handleShake();
      } else {
        setAuthStep("otp");
        setSuccessMsg(`A 6-digit verification code was sent to your email! Please check your inbox 📩`);
      }
    } catch (err) {
      console.error("OTP send exception:", err);
      setErrorMsg("Network error sending code. Please try again.");
      handleShake();
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Handle OTP Verification Code Submit
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!otpInput.trim()) {
      setErrorMsg("Please enter the verification code sent to your email.");
      handleShake();
      return;
    }

    setIsLoading(true);

    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      setAuthStep("password");
      setSuccessMsg("Email verified! Now enter your private password 💕");
      return;
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: emailInput.trim().toLowerCase(),
        token: otpInput.trim(),
        type: "email",
      });

      if (error || !data.session) {
        console.error("OTP verify error:", error);
        setErrorMsg("Invalid or expired verification code. Please try again.");
        handleShake();
      } else {
        setAuthStep("password");
        setSuccessMsg("Email verified! Please enter your private password 💕");
      }
    } catch (err) {
      console.error("OTP verify exception:", err);
      setErrorMsg("Verification failed. Please try again.");
      handleShake();
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Handle Private Access Password Submit (1426)
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!passwordInput.trim()) {
      setErrorMsg("Please enter your private password, my love!");
      handleShake();
      return;
    }

    setIsLoading(true);

    try {
      const isValid = await verifySitePassword(passwordInput.trim());

      if (isValid) {
        sessionStorage.setItem("monthsary_authenticated", "true");
        sessionStorage.setItem("monthsary_angel_email", emailInput.trim().toLowerCase());
        onUnlocked();
      } else {
        setErrorMsg("Incorrect private password! Please try again ❤️");
        handleShake();
      }
    } catch (err) {
      console.error("Password verify exception:", err);
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
        {/* Top Decorative Icon */}
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-600 text-white shadow-lg shadow-rose-500/30">
          {authStep === "email" && <Mail size={28} className="animate-bounce" />}
          {authStep === "otp" && <ShieldCheck size={28} className="animate-bounce" />}
          {authStep === "password" && <Lock size={28} className="animate-bounce" />}
        </div>

        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-100/80 border border-rose-200 text-rose-700 text-xs font-extrabold uppercase tracking-wider mb-2">
          <Heart size={12} className="fill-rose-500 text-rose-500" />
          <span>Angel's Private Monthsary Gate</span>
        </span>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-rose-600 font-display mt-1">
          Welcome, {monthsaryConfig.girlfriendName}
        </h1>

        <p className="text-xs sm:text-sm text-gray-600 mt-1.5 mb-5 leading-relaxed">
          {authStep === "email" && "Please enter your Gmail address to receive your private verification code 💕"}
          {authStep === "otp" && "Enter the 6-digit verification code sent to your email 📩"}
          {authStep === "password" && "Enter your private access password to unlock your surprise website 💕"}
        </p>

        {/* Step Indicator Badges */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
            authStep === "email" ? "bg-rose-500 text-white border-rose-500" : "bg-rose-50 text-rose-700 border-rose-200"
          }`}>
            1. Email
          </span>
          <span className="text-gray-300">•</span>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
            authStep === "otp" ? "bg-rose-500 text-white border-rose-500" : "bg-rose-50 text-rose-700 border-rose-200"
          }`}>
            2. Code
          </span>
          <span className="text-gray-300">•</span>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
            authStep === "password" ? "bg-rose-500 text-white border-rose-500" : "bg-rose-50 text-rose-700 border-rose-200"
          }`}>
            3. Password
          </span>
        </div>

        {/* STEP 1: EMAIL FORM */}
        {authStep === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-rose-400">
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
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-rose-200 bg-rose-50/50 text-sm text-gray-800 font-semibold focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-300/50 transition-all text-center placeholder:font-normal"
                autoFocus
                required
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white font-bold text-base shadow-xl shadow-rose-500/25 hover:shadow-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-h-[52px]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Sending code...</span>
                </span>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Send Verification Code</span>
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION CODE FORM */}
        {authStep === "otp" && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-rose-400">
                <ShieldCheck size={18} />
              </div>
              <input
                type="text"
                value={otpInput}
                onChange={(e) => {
                  setOtpInput(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="Enter 6-digit code..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-rose-200 bg-rose-50/50 text-base text-gray-800 font-bold tracking-widest focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-300/50 transition-all text-center placeholder:tracking-normal placeholder:font-normal"
                maxLength={6}
                autoFocus
                required
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white font-bold text-base shadow-xl shadow-rose-500/25 hover:shadow-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-h-[52px]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Verifying code...</span>
                </span>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Verify Email Code</span>
                </>
              )}
            </motion.button>

            <button
              type="button"
              onClick={() => {
                setAuthStep("email");
                setErrorMsg(null);
              }}
              className="text-xs text-rose-600 hover:underline font-semibold"
            >
              Change email address
            </button>
          </form>
        )}

        {/* STEP 3: PRIVATE ACCESS PASSWORD FORM (1426) */}
        {authStep === "password" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-rose-400">
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
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-rose-200 bg-rose-50/50 text-base text-gray-800 font-bold tracking-widest focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-300/50 transition-all text-center placeholder:tracking-normal placeholder:font-normal"
                autoFocus
                required
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white font-bold text-base shadow-xl shadow-rose-500/25 hover:shadow-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-h-[52px]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Unlocking surprise...</span>
                </span>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Unlock My Personal Page</span>
                </>
              )}
            </motion.button>
          </form>
        )}

        {/* Feedback Alerts */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-4 flex items-center justify-center gap-2 p-3 rounded-2xl bg-red-50 border border-red-200 text-xs font-bold text-red-600 shadow-sm"
            >
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-4 flex items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 shadow-sm"
            >
              <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
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

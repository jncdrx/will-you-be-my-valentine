"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MusicPlayer } from "./components/MusicPlayer";
import { MouseTrail } from "./components/MouseTrail";
import { FloatingHearts } from "./components/FloatingHearts";
import { HeartBurst } from "./components/HeartBurst";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { LoveLetterSection } from "./components/LoveLetterSection";
import { MemoriesSection } from "./components/MemoriesSection";
import { AngelReactionForm } from "./components/AngelReactionForm";
import { SubmissionConfirmation } from "./components/SubmissionConfirmation";
import { AdminView } from "./components/AdminView";
import { PasswordGate } from "./components/PasswordGate";
import { monthsaryConfig } from "./config/monthsaryConfig";
import { getResponseByToken, MonthsaryResponse } from "./lib/supabase";
import { Heart, ArrowUp } from "lucide-react";

type ExperienceStep = "welcome" | "letter" | "memories" | "reaction" | "confirmation";

const experienceSteps: { key: ExperienceStep; label: string }[] = [
  { key: "welcome", label: "Welcome" },
  { key: "letter", label: "Letter 💌" },
  { key: "memories", label: "Memories 📸" },
  { key: "reaction", label: "Reply 💕" },
];

export default function Page() {
  const [step, setStep] = useState<ExperienceStep>("welcome");
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Site Access Password state (stored in sessionStorage once unlocked)
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem("monthsary_authenticated") === "true";
  });

  // Response state for Angel
  const [savedResponseToken, setSavedResponseToken] = useState<string | null>(null);
  const [submittedResponseData, setSubmittedResponseData] = useState<MonthsaryResponse | null>(null);

  // Detect /admin route path, #admin hash, or ?admin=true search query on URL
  useEffect(() => {
    const checkAdminRoute = () => {
      const pathname = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();

      const isUrlAdmin =
        pathname.endsWith("/admin") ||
        pathname.endsWith("/admin/") ||
        pathname.includes("/admin") ||
        hash === "#admin" ||
        search.includes("admin=true");

      setIsAdminMode(isUrlAdmin);
    };

    checkAdminRoute();
    window.addEventListener("hashchange", checkAdminRoute);
    window.addEventListener("popstate", checkAdminRoute);
    return () => {
      window.removeEventListener("hashchange", checkAdminRoute);
      window.removeEventListener("popstate", checkAdminRoute);
    };
  }, []);

  // Check if Angel has already submitted a response stored in localStorage
  useEffect(() => {
    const token = localStorage.getItem("monthsary_angel_token");
    if (token) {
      setSavedResponseToken(token);
      getResponseByToken(token).then((data) => {
        if (data) {
          setSubmittedResponseData(data);
        }
      });
    }
  }, []);

  // Handle scroll for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const currentStepIndex = experienceSteps.findIndex((item) => item.key === step);

  const handleSubmitted = (data: MonthsaryResponse, token: string) => {
    setSubmittedResponseData(data);
    setSavedResponseToken(token);
    setStep("confirmation");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditReply = () => {
    setStep("reaction");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleExitAdmin = () => {
    setIsAdminMode(false);
    if (window.location.hash === "#admin") {
      window.location.hash = "";
    } else {
      const baseUrl = import.meta.env.BASE_URL || "/";
      window.history.pushState({}, "", baseUrl);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-start overflow-x-hidden text-center font-sans pb-16 pt-4">
      {/* Soft Vignette Overlay */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-radial-gradient from-transparent via-rose-100/10 to-pink-200/20 mix-blend-multiply"></div>

      {/* Require Password Gate if not unlocked */}
      {!isUnlocked && (
        <PasswordGate onUnlocked={() => setIsUnlocked(true)} />
      )}

      <MusicPlayer />
      <MouseTrail />
      <FloatingHearts />
      <HeartBurst />

      {/* Main Experience Header Stepper (Hidden in Admin Mode) */}
      {!isAdminMode && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-3 z-40 w-full max-w-lg px-4"
        >
          <div className="rounded-3xl bg-white/85 px-5 py-3 shadow-xl backdrop-blur-md border border-white/80 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1">
                <Heart size={12} className="fill-rose-500 text-rose-500" />
                {monthsaryConfig.girlfriendName}'s 7th Monthsary Surprise
              </span>

              {savedResponseToken && (
                <button
                  onClick={() => setStep("confirmation")}
                  className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-extrabold text-rose-700 border border-rose-200 hover:bg-rose-200 transition-colors shadow-sm"
                >
                  View My Saved Reply 💕
                </button>
              )}
            </div>

            <div className="mt-2.5 flex items-center gap-2">
              {experienceSteps.map((item, index) => {
                const isDone = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <button
                    key={item.key}
                    onClick={() => setStep(item.key)}
                    className="flex-1 focus:outline-none"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`h-2 w-full rounded-full transition-all duration-500 ${
                          isCurrent
                            ? "bg-rose-500 ring-2 ring-rose-300 shadow-sm"
                            : isDone
                            ? "bg-rose-400"
                            : "bg-rose-200/70"
                        }`}
                      />
                      <span className={`text-[10px] font-bold tracking-wide transition-colors ${isDone ? "text-rose-700" : "text-gray-400"}`}>
                        {item.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* View Switcher */}
      <AnimatePresence mode="wait">
        {isAdminMode ? (
          <AdminView key="admin" onExit={handleExitAdmin} />
        ) : (
          <>
            {step === "welcome" && (
              <WelcomeScreen
                key="welcome"
                onOpenLetter={() => setStep("letter")}
                isPlayingMusic={isPlayingMusic}
                onToggleMusic={() => setIsPlayingMusic(!isPlayingMusic)}
              />
            )}

            {step === "letter" && (
              <LoveLetterSection
                key="letter"
                onContinue={() => setStep("memories")}
              />
            )}

            {step === "memories" && (
              <MemoriesSection
                key="memories"
                onGoToReaction={() => setStep("reaction")}
              />
            )}

            {step === "reaction" && (
              <AngelReactionForm
                key="reaction"
                onSubmitted={handleSubmitted}
                onBackToMemories={() => setStep("memories")}
                existingToken={savedResponseToken || undefined}
              />
            )}

            {step === "confirmation" && submittedResponseData && (
              <SubmissionConfirmation
                key="confirmation"
                responseData={submittedResponseData}
                onEdit={handleEditReply}
              />
            )}
          </>
        )}
      </AnimatePresence>

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-20 left-4 z-40 flex items-center gap-1 rounded-full border border-rose-200 bg-white/90 px-4 py-2 text-xs font-bold text-rose-700 shadow-xl backdrop-blur-md hover:bg-white min-h-[40px]"
          aria-label="Back to top"
        >
          <ArrowUp size={14} /> Top
        </motion.button>
      )}
    </div>
  );
}

"use client";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MusicPlayer } from "./components/MusicPlayer";
import { MouseTrail } from "./components/MouseTrail";
import { HeartBurst } from "./components/HeartBurst";
import { AngelAuthGate } from "./components/AngelAuthGate";
import { PastMonthsaryNavbar } from "./components/PastMonthsaryNavbar";
import type { VouchersSectionHandle } from "./components/user/VouchersSection";
import { ExperienceHub } from "./components/ExperienceHub";
import { FolioExperience } from "./components/FolioExperience";
import { AdminRoutes } from "./components/admin/AdminRoutes";
import {
  getResponseByToken,
  MonthsaryResponse,
  loadAngelUserData,
  saveAngelUserData,
  Song,
  fetchSongs,
  saveSelectedSongId,
} from "./lib/supabase";
import { supabase, isSupabaseConfigured } from "./lib/supabase";
import { signOutAll, RECIPIENT_EMAIL } from "./lib/auth";
import { Voucher, effectiveStatus } from "./lib/vouchers";
import { netflixSound } from "./lib/netflixSound";
import { ArrowUp, LogOut } from "lucide-react";
import { toast } from "sonner";

type ExperienceMode = "hub" | "letter" | "angelflix" | "folio";
type ExperienceStep = "welcome" | "letter" | "memories" | "reaction" | "confirmation";

// Folio opens without downloading the letter effects, video player, or administration screens.
const FloatingHearts = lazy(() => import("./components/FloatingHearts").then(m => ({ default: m.FloatingHearts })));
const WelcomeScreen = lazy(() => import("./components/WelcomeScreen").then(m => ({ default: m.WelcomeScreen })));
const LoveLetterSection = lazy(() => import("./components/LoveLetterSection").then(m => ({ default: m.LoveLetterSection })));
const MemoriesSection = lazy(() => import("./components/MemoriesSection").then(m => ({ default: m.MemoriesSection })));
const AngelReactionForm = lazy(() => import("./components/AngelReactionForm").then(m => ({ default: m.AngelReactionForm })));
const SubmissionConfirmation = lazy(() => import("./components/SubmissionConfirmation").then(m => ({ default: m.SubmissionConfirmation })));
const PastMonthsaryModal = lazy(() => import("./components/PastMonthsaryModal").then(m => ({ default: m.PastMonthsaryModal })));
const MusicSelectorModal = lazy(() => import("./components/MusicSelectorModal").then(m => ({ default: m.MusicSelectorModal })));
const VouchersSection = lazy(() => import("./components/user/VouchersSection").then(m => ({ default: m.VouchersSection })));
const AngelFlix = lazy(() => import("./components/AngelFlix").then(m => ({ default: m.AngelFlix })));
const AdminLoginPage = lazy(() => import("./components/admin/AdminLoginPage").then(m => ({ default: m.AdminLoginPage })));
const AdminDashboard = lazy(() => import("./components/admin/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const AdminSecurityLogs = lazy(() => import("./components/admin/AdminSecurityLogs").then(m => ({ default: m.AdminSecurityLogs })));

export default function App() {
  return (
    <Suspense fallback={<div role="status" className="flex min-h-screen items-center justify-center bg-[#f5f3ef] text-[#512735]">Opening page…</div>}>
    <Routes>
      <Route path="/" element={<UserSite />} />
      <Route path="/folio" element={<Navigate to="/?view=folio" replace />} />
      <Route path="/notebook" element={<Navigate to="/?view=folio" replace />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminRoutes />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="security-logs" element={<AdminSecurityLogs />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}

function getInitialStep(): ExperienceStep {
  if (typeof window === "undefined") return "welcome";
  try {
    const saved = localStorage.getItem("angel_user_data");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.current_step) return parsed.current_step as ExperienceStep;
    }
  } catch {
    /* ignore localStorage errors */
  }
  return "welcome";
}

function getInitialMode(): ExperienceMode {
  if (typeof window === "undefined") return "hub";
  try {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get("view");
    if (viewParam === "letter" || viewParam === "angelflix" || viewParam === "hub" || viewParam === "folio" || viewParam === "notebook") {
      return (viewParam === "notebook" ? "folio" : viewParam) as ExperienceMode;
    }
  } catch {
    /* ignore storage errors */
  }
  return "hub";
}

function getInitialUnlocked(): boolean {
  return false;
}

function UserSite() {
  const [, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<ExperienceMode>(getInitialMode);
  const [step, setStep] = useState<ExperienceStep>(getInitialStep);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [selectedPastMonthIndex, setSelectedPastMonthIndex] = useState<number | null>(null);
  const [unclaimedVoucherCount, setUnclaimedVoucherCount] = useState(0);
  const vouchersSectionRef = useRef<VouchersSectionHandle>(null);

  // Private Access Authentication state (backed by Supabase Auth)
  const [isUnlocked, setIsUnlocked] = useState<boolean>(getInitialUnlocked);

  // Response state for Angel
  const [savedResponseToken, setSavedResponseToken] = useState<string | null>(null);
  const [submittedResponseData, setSubmittedResponseData] = useState<MonthsaryResponse | null>(null);

  // Music Selection state
  const [songsList, setSongsList] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);

  // Attach global Netflix UI click sound listener
  useEffect(() => {
    const detach = netflixSound.attachGlobalListener();
    return () => detach();
  }, []);

  // Sync mode with URL search param and localStorage
  const handleModeChange = (newMode: ExperienceMode) => {
    if (newMode === "angelflix") {
      try {
        sessionStorage.removeItem("angelflix_intro_seen");
      } catch {
        /* ignore */
      }
    } else {
      netflixSound.playClick();
    }
    setMode(newMode);
    try {
      localStorage.setItem("angel_experience_mode", newMode);
      setSearchParams({ view: newMode }, { replace: true });
    } catch {
      /* ignore storage errors */
    }
  };

  // Restore Supabase Auth session or authenticated session on load
  useEffect(() => {
    let active = true;
    (async () => {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.getUser();
        if (active) {
          setIsUnlocked(!error && data.user?.email?.toLowerCase() === RECIPIENT_EMAIL);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Fetch available songs and restore selected song
  useEffect(() => {
    let active = true;

    const syncSongs = async () => {
      const songs = await fetchSongs();
      if (!active) return;

      setSongsList(songs);
      const savedSongId = localStorage.getItem("monthsary_selected_song_id");
      if (savedSongId && songs.length > 0) {
        const found = songs.find((s) => s.id === savedSongId);
        if (found) {
          setSelectedSong(found);
          return;
        }
      }

      setSelectedSong((current) => {
        if (!current) return current;
        return songs.find((song) => song.id === current.id) || null;
      });
    };

    syncSongs();

    const handleSongsChanged = () => {
      syncSongs();
    };

    window.addEventListener("monthsary:songs-changed", handleSongsChanged);
    return () => {
      active = false;
      window.removeEventListener("monthsary:songs-changed", handleSongsChanged);
    };
  }, []);

  // Restore Angel's saved state automatically when unlocked
  useEffect(() => {
    if (isUnlocked) {
      loadAngelUserData().then((data) => {
        if (data) {
          if (data.current_step) {
            setStep(data.current_step as ExperienceStep);
          }
          if (data.message) {
            setSubmittedResponseData({
              name: data.name || "my dearest baby angel",
              message: data.message,
              image_urls: data.image_urls || [],
              response_token: "angel_auth_token",
              created_at: data.created_at || new Date().toISOString(),
            });
            setSavedResponseToken("angel_auth_token");
          }
        }
      });
    }
  }, [isUnlocked]);

  // Check if Angel has already submitted a response stored locally
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

  const handleStepChange = (newStep: ExperienceStep) => {
    setStep(newStep);
    saveAngelUserData({ current_step: newStep });
  };

  const handleLogout = async () => {
    await signOutAll();
    sessionStorage.removeItem("monthsary_authenticated");
    sessionStorage.removeItem("monthsary_angel_email");
    localStorage.removeItem("angel_user_data");
    setIsUnlocked(false);
    setMode("hub");
    setStep("welcome");
    toast.info("Logged out successfully");
  };

  // Handle scroll for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Supabase Auth state changes (e.g. sign out elsewhere)
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsUnlocked(session?.user.email?.toLowerCase() === RECIPIENT_EMAIL);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmitted = (data: MonthsaryResponse, token: string) => {
    setSubmittedResponseData(data);
    setSavedResponseToken(token);
    setStep("confirmation");
    saveAngelUserData({ current_step: "confirmation" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditReply = () => {
    setStep("reaction");
    saveAngelUserData({ current_step: "reaction" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Stable callbacks for the vouchers section
  const handleVouchersChange = useCallback((list: Voucher[]) => {
    setUnclaimedVoucherCount(list.filter((v) => effectiveStatus(v) === "available").length);
  }, []);

  const handleNewVoucher = useCallback((v: Voucher) => {
    toast.success(`New voucher! "${v.title}"`);
    window.setTimeout(() => {
      vouchersSectionRef.current?.scrollTo();
      vouchersSectionRef.current?.pulse();
    }, 60);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden font-sans">
      {/* Require Angel Authentication Gate if not unlocked */}
      {!isUnlocked && (
        <AngelAuthGate
          onUnlocked={() => {
            setIsUnlocked(true);
            toast.success("Welcome back, my love");
          }}
        />
      )}

      {/* Unlocked Experience Flow */}
      {isUnlocked && (
        <>
          {/* 1. Hub Gateway Selection Screen */}
          {mode === "hub" && (
            <ExperienceHub
              onSelectExperience={(selected) => handleModeChange(selected)}
              onLogout={handleLogout}
              unclaimedVoucherCount={unclaimedVoucherCount}
              isPlayingMusic={isPlayingMusic}
              onToggleMusic={() => setIsPlayingMusic(!isPlayingMusic)}
            />
          )}

          {/* 2. AngelFlix Netflix Streaming Screen */}
          {mode === "angelflix" && (
            <AngelFlix
              onBackToHub={() => handleModeChange("hub")}
              onOpenLetter={() => handleModeChange("letter")}
              onLogout={handleLogout}
            />
          )}

          {/* 3. Angel's Handwritten Pharmacology Folio Notebook */}
          {mode === "folio" && (
            <FolioExperience
              onBackToHub={() => handleModeChange("hub")}
            />
          )}

          {/* 4. The Love Letter & Memories Interactive Journey */}
          {mode === "letter" && (
            <div className="relative flex min-h-screen w-full flex-col items-center justify-start text-center pb-16 pt-4">
              {/* Soft Vignette Overlay */}
              <div className="pointer-events-none fixed inset-0 z-0 bg-radial-gradient from-transparent via-rose-100/10 to-pink-200/20 mix-blend-multiply" />

              {/* Romantic Atmosphere: Music Player, Song Selector & Cursor Effects (Only in Love Letter) */}
              <MusicPlayer
                currentSong={selectedSong}
                onOpenSelector={() => setIsMusicModalOpen(true)}
              />
              <MusicSelectorModal
                isOpen={isMusicModalOpen}
                onClose={() => setIsMusicModalOpen(false)}
                songs={songsList}
                selectedSongId={selectedSong?.id || null}
                onSelectSong={(song) => {
                  setSelectedSong(song);
                  saveSelectedSongId(song.id);
                  setIsMusicModalOpen(false);
                }}
              />
              <MouseTrail />
              <FloatingHearts />
              <HeartBurst />

              {/* Main Experience Past Monthsaries Navbar */}
              <PastMonthsaryNavbar
                currentStep={step}
                onStepChange={handleStepChange}
                onSelectPastMonth={(index: number) => setSelectedPastMonthIndex(index)}
                savedResponseToken={savedResponseToken}
                onOpenVouchers={() => vouchersSectionRef.current?.scrollTo()}
                unclaimedVoucherCount={unclaimedVoucherCount}
                onOpenAngelFlix={() => handleModeChange("angelflix")}
                onBackToHub={() => handleModeChange("hub")}
              />

              {/* Past Monthsary Detail Viewer Modal */}
              {selectedPastMonthIndex !== null && (
                <PastMonthsaryModal
                  initialMonthIndex={selectedPastMonthIndex}
                  onClose={() => setSelectedPastMonthIndex(null)}
                />
              )}

              {/* Step View Switcher */}
              <AnimatePresence mode="wait">
                {step === "welcome" && (
                  <WelcomeScreen
                    key="welcome"
                    onOpenLetter={() => setStep("letter")}
                    isPlayingMusic={isPlayingMusic}
                    onToggleMusic={() => setIsPlayingMusic(!isPlayingMusic)}
                  />
                )}

                {step === "letter" && (
                  <LoveLetterSection key="letter" onContinue={() => setStep("memories")} />
                )}

                {step === "memories" && (
                  <MemoriesSection key="memories" onGoToReaction={() => setStep("reaction")} />
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
              </AnimatePresence>

              {/* Vouchers section */}
              {step !== "confirmation" && (
                <VouchersSection
                  ref={vouchersSectionRef}
                  onVouchersChange={handleVouchersChange}
                  onNewVoucher={handleNewVoucher}
                />
              )}

              {/* Fixed Floating Lower-Left Logout Button */}
              <motion.button
                initial={{ opacity: 0, scale: 0.9, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                aria-label="Log out of session"
                className="fixed bottom-4 left-4 z-40 flex items-center gap-1.5 rounded-full border border-rose-200/90 bg-white/90 px-4 py-2.5 text-xs font-extrabold text-rose-700 shadow-xl backdrop-blur-xl hover:bg-rose-50 hover:border-rose-300 transition-all min-h-[44px] focus:outline-none focus:ring-2 focus:ring-rose-400 active:scale-95 group"
              >
                <LogOut size={15} className="text-rose-500 group-hover:text-rose-600 transition-colors shrink-0" />
                <span>Logout</span>
              </motion.button>

              {/* Floating Back to Top Button */}
              {showBackToTop && (
                <motion.button
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="fixed bottom-20 left-4 z-40 flex items-center gap-1 rounded-full border border-rose-200 bg-white/90 px-4 py-2 text-xs font-bold text-rose-700 shadow-xl backdrop-blur-md hover:bg-white min-h-[40px] focus:outline-none focus:ring-2 focus:ring-rose-400 active:scale-95"
                  aria-label="Back to top"
                >
                  <ArrowUp size={14} /> Top
                </motion.button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

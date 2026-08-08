"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MusicPlayer } from "./components/MusicPlayer";
import { MouseTrail } from "./components/MouseTrail";
import { FloatingHearts } from "./components/FloatingHearts";
import { HeartBurst } from "./components/HeartBurst";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { LoveLetterSection } from "./components/LoveLetterSection";
import { MemoriesSection } from "./components/MemoriesSection";
import { AngelReactionForm } from "./components/AngelReactionForm";
import { AngelAuthGate } from "./components/AngelAuthGate";
import { SubmissionConfirmation } from "./components/SubmissionConfirmation";
import { PastMonthsaryNavbar } from "./components/PastMonthsaryNavbar";
import { PastMonthsaryModal } from "./components/PastMonthsaryModal";
import { MusicSelectorModal } from "./components/MusicSelectorModal";
import { VouchersSection, VouchersSectionHandle } from "./components/user/VouchersSection";
import { AdminRoutes } from "./components/admin/AdminRoutes";
import { AdminLoginPage } from "./components/admin/AdminLoginPage";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { AdminSecurityLogs } from "./components/admin/AdminSecurityLogs";
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
import { signOutAll } from "./lib/auth";
import { Voucher, effectiveStatus } from "./lib/vouchers";
import { ArrowUp, LogOut } from "lucide-react";
import { toast } from "sonner";

type ExperienceStep = "welcome" | "letter" | "memories" | "reaction" | "confirmation";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<UserSite />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminRoutes />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="security-logs" element={<AdminSecurityLogs />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
  } catch {}
  return "welcome";
}

function UserSite() {
  const [step, setStep] = useState<ExperienceStep>(getInitialStep);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [selectedPastMonthIndex, setSelectedPastMonthIndex] = useState<number | null>(null);
  const [unclaimedVoucherCount, setUnclaimedVoucherCount] = useState(0);
  const vouchersSectionRef = useRef<VouchersSectionHandle>(null);

  // Private Access Authentication state (now backed by Supabase Auth)
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);

  // Response state for Angel
  const [savedResponseToken, setSavedResponseToken] = useState<string | null>(null);
  const [submittedResponseData, setSubmittedResponseData] = useState<MonthsaryResponse | null>(null);

  // Music Selection state
  const [songsList, setSongsList] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);

  // Restore Supabase Auth session on load
  useEffect(() => {
    let active = true;
    (async () => {
      if (isSupabaseConfigured()) {
        const { data } = await supabase.auth.getSession();
        if (active && data?.session) setIsUnlocked(true);
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
    setIsUnlocked(false);
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
      setIsUnlocked(Boolean(session));
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

  // Stable callbacks for the vouchers section (avoid re-subscribing Realtime on every render)
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
    <div className="relative flex min-h-screen w-full flex-col items-center justify-start overflow-x-hidden text-center font-sans pb-16 pt-4">
      {/* Soft Vignette Overlay */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-radial-gradient from-transparent via-rose-100/10 to-pink-200/20 mix-blend-multiply"></div>

      {/* Require Angel Authentication Gate if not unlocked */}
      {!isUnlocked && (
        <AngelAuthGate
          onUnlocked={() => {
            setIsUnlocked(true);
            toast.success("Welcome back, my love");
          }}
        />
      )}

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

      {/* Main Experience Past Monthsaries Navbar (only when unlocked) */}
      {isUnlocked && (
        <PastMonthsaryNavbar
          currentStep={step}
          onStepChange={handleStepChange}
          onSelectPastMonth={(index: number) => setSelectedPastMonthIndex(index)}
          savedResponseToken={savedResponseToken}
          onOpenVouchers={() => vouchersSectionRef.current?.scrollTo()}
          unclaimedVoucherCount={unclaimedVoucherCount}
        />
      )}

      {/* Past Monthsary Detail Viewer Modal */}
      {selectedPastMonthIndex !== null && (
        <PastMonthsaryModal
          initialMonthIndex={selectedPastMonthIndex}
          onClose={() => setSelectedPastMonthIndex(null)}
        />
      )}

      {/* View Switcher */}
      {isUnlocked && (
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
      )}

      {/* Permanent Vouchers section (always visible when unlocked and not on confirmation step to avoid duplicate rendering; live via Realtime) */}
      {isUnlocked && step !== "confirmation" && (
        <VouchersSection
          ref={vouchersSectionRef}
          onVouchersChange={handleVouchersChange}
          onNewVoucher={handleNewVoucher}
        />
      )}

      {/* Fixed Floating Lower-Left Logout Button (UI/UX Pro Max) */}
      {isUnlocked && (
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
      )}

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
  );
}
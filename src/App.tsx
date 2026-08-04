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
import { AdminView } from "./components/AdminView";
import { AngelAuthGate } from "./components/AngelAuthGate";
import { SubmissionConfirmation } from "./components/SubmissionConfirmation";
import { PastMonthsaryNavbar } from "./components/PastMonthsaryNavbar";
import { PastMonthsaryModal } from "./components/PastMonthsaryModal";
import { MusicSelectorModal } from "./components/MusicSelectorModal";
import {
  getResponseByToken,
  MonthsaryResponse,
  loadAngelUserData,
  saveAngelUserData,
  Song,
  fetchSongs,
  saveSelectedSongId,
} from "./lib/supabase";
import { ArrowUp } from "lucide-react";

type ExperienceStep = "welcome" | "letter" | "memories" | "reaction" | "confirmation";

export default function Page() {
  const [step, setStep] = useState<ExperienceStep>("welcome");
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [selectedPastMonthIndex, setSelectedPastMonthIndex] = useState<number | null>(null);

  // Private Access Authentication state
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem("monthsary_authenticated") === "true";
  });

  // Response state for Angel
  const [savedResponseToken, setSavedResponseToken] = useState<string | null>(null);
  const [submittedResponseData, setSubmittedResponseData] = useState<MonthsaryResponse | null>(null);

  // Music Selection state
  const [songsList, setSongsList] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);

  // Fetch available songs and restore selected song
  useEffect(() => {
    fetchSongs().then((songs) => {
      setSongsList(songs);
      const savedSongId = localStorage.getItem("monthsary_selected_song_id");
      if (savedSongId && songs.length > 0) {
        const found = songs.find((s) => s.id === savedSongId);
        if (found) setSelectedSong(found);
      }
    });
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

  // Handle scroll for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

      {/* Require Angel Authentication Gate if not unlocked */}
      {!isUnlocked && (
        <AngelAuthGate onUnlocked={() => setIsUnlocked(true)} />
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

      {/* Main Experience Past Monthsaries Navbar (Hidden in Admin Mode) */}
      {!isAdminMode && (
        <PastMonthsaryNavbar
          currentStep={step}
          onStepChange={handleStepChange}
          onSelectPastMonth={(index: number) => setSelectedPastMonthIndex(index)}
          savedResponseToken={savedResponseToken}
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
      <AnimatePresence mode="wait">
        {isAdminMode ? (
          <AdminView
            key="admin"
            onExit={handleExitAdmin}
            onSongsChange={(updated) => setSongsList(updated)}
          />
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

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Calendar, ChevronDown, BookOpen, CheckCircle2, Sparkles, Sprout, Cake, Utensils, Coffee, Crown, Gift } from "lucide-react";
import { monthsaryConfig } from "../config/monthsaryConfig";

type ExperienceStep = "welcome" | "letter" | "memories" | "reaction" | "confirmation";

interface PastMonthsaryNavbarProps {
  currentStep: ExperienceStep;
  onStepChange: (step: ExperienceStep) => void;
  onSelectPastMonth: (index: number) => void;
  savedResponseToken: string | null;
  onOpenVouchers: () => void;
  unclaimedVoucherCount: number;
}

const experienceSteps: { key: ExperienceStep; label: string; icon: string }[] = [
  { key: "welcome", label: "Welcome", icon: "✨" },
  { key: "letter", label: "Letter 💌", icon: "💌" },
  { key: "memories", label: "Memories 📸", icon: "📸" },
  { key: "reaction", label: "Reply 💕", icon: "💕" },
];

function renderMonthIcon(iconName: string, size = 14) {
  switch (iconName) {
    case "Sprout": return <Sprout size={size} />;
    case "Cake": return <Cake size={size} />;
    case "Sparkles": return <Sparkles size={size} />;
    case "Utensils": return <Utensils size={size} />;
    case "Coffee": return <Coffee size={size} />;
    case "Heart": return <Heart size={size} fill="currentColor" />;
    case "Crown": return <Crown size={size} />;
    default: return <Heart size={size} />;
  }
}

export function PastMonthsaryNavbar({
  currentStep,
  onStepChange,
  onSelectPastMonth,
  savedResponseToken,
  onOpenVouchers,
  unclaimedVoucherCount,
}: PastMonthsaryNavbarProps) {
  const [isPastDropdownOpen, setIsPastDropdownOpen] = useState(false);

  const triggerHaptic = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const currentStepIndex = experienceSteps.findIndex((item) => item.key === currentStep);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-2 z-40 w-full max-w-2xl px-2 sm:px-3 mx-auto"
    >
      <div className="rounded-[24px] bg-white/90 backdrop-blur-2xl px-3.5 sm:px-5 py-2.5 shadow-2xl shadow-rose-500/10 border border-white/90 transition-all relative">
        {/* ROW 1: Branding, Past Monthsaries Dropdown & Saved Reply */}
        <div className="flex items-center justify-between gap-2">
          {/* Brand Logo / Title */}
          <button
            onClick={() => {
              triggerHaptic();
              onStepChange("welcome");
            }}
            className="flex items-center gap-2 shrink-0 group focus:outline-none focus:ring-2 focus:ring-rose-400 rounded-full px-1.5 py-1 transition-all"
            aria-label="Go to welcome screen"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-500/30 group-hover:scale-105 transition-transform">
              <Heart size={15} className="fill-white animate-pulse" />
            </div>
            <div className="flex flex-col text-left hidden sm:flex">
              <span className="text-xs font-extrabold text-rose-700 font-display leading-tight">
                7 Months of Us
              </span>
              <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">
                {monthsaryConfig.girlfriendName}
              </span>
            </div>
          </button>

          {/* Past Monthsaries Selector Dropdown Pill */}
          <div className="relative">
            <button
              onClick={() => {
                triggerHaptic();
                setIsPastDropdownOpen(!isPastDropdownOpen);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-extrabold transition-all border shadow-sm min-h-[40px] focus:outline-none focus:ring-2 focus:ring-rose-400 ${
                isPastDropdownOpen
                  ? "bg-rose-500 text-white border-rose-500 shadow-rose-500/25 scale-[1.02]"
                  : "bg-rose-50/90 text-rose-700 border-rose-200 hover:bg-rose-100/90 hover:border-rose-300"
              }`}
              aria-label="Toggle past monthsaries menu"
              aria-expanded={isPastDropdownOpen}
            >
              <Calendar size={14} className={isPastDropdownOpen ? "text-white" : "text-rose-500"} />
              <span className="truncate max-w-[130px] sm:max-w-none">Past Monthsaries (1-7)</span>
              <span className="hidden xs:inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-200/80 text-rose-800 border border-rose-300">
                7 Months
              </span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-300 ${isPastDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown Menu Popup */}
            <AnimatePresence>
              {isPastDropdownOpen && (
                <>
                  {/* Backdrop click dismiss */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsPastDropdownOpen(false)}
                  />

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 z-50 w-80 bg-white/95 backdrop-blur-2xl p-3 sm:p-4 rounded-3xl border border-rose-200 shadow-2xl shadow-rose-500/15 text-left"
                  >
                    <div className="flex justify-between items-center px-2 py-1 mb-2.5 border-b border-rose-100 pb-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                        <BookOpen size={13} />
                        <span>Our 7 Months Journey</span>
                      </span>
                      <span className="text-[9px] font-bold text-gray-400">Select any month</span>
                    </div>

                    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                      {monthsaryConfig.timelineEvents.map((evt, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            triggerHaptic();
                            setIsPastDropdownOpen(false);
                            onSelectPastMonth(idx);
                          }}
                          className="w-full p-2.5 rounded-2xl text-left hover:bg-rose-50/90 transition-all flex items-center justify-between group min-h-[44px] border border-transparent hover:border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-300"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-full bg-gradient-to-r ${evt.color} text-white flex items-center justify-center text-xs font-extrabold shadow-sm shrink-0`}>
                              {renderMonthIcon(evt.iconName, 13)}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-extrabold text-gray-800 group-hover:text-rose-600 transition-colors flex items-center gap-1">
                                <span>{evt.month}</span>
                                <span className="text-[10px] text-gray-400 font-normal">• {evt.title}</span>
                              </p>
                              <p className="text-[10px] text-gray-500 truncate max-w-[190px] mt-0.5">
                                {evt.description}
                              </p>
                            </div>
                          </div>
                          <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 shrink-0 ml-1">
                            {evt.date.split(",")[0]}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="mt-3 pt-2 border-t border-rose-100 text-center">
                      <button
                        onClick={() => {
                          triggerHaptic();
                          setIsPastDropdownOpen(false);
                          onSelectPastMonth(6); // 7th month
                        }}
                        className="w-full py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
                      >
                        <Crown size={14} />
                        <span>Jump to 7th Month Celebration 👑</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* View Saved Reply Quick Action */}
          {savedResponseToken && (
            <button
              onClick={() => {
                triggerHaptic();
                onStepChange("confirmation");
              }}
              className="flex items-center gap-1 rounded-full bg-rose-100/90 px-3 py-1.5 text-[11px] font-extrabold text-rose-700 border border-rose-200 hover:bg-rose-200 transition-colors shadow-sm min-h-[36px] focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              <CheckCircle2 size={13} className="text-rose-500" />
              <span className="hidden xs:inline">My Saved Reply 💕</span>
              <span className="xs:hidden">Reply 💕</span>
            </button>
          )}

          {/* My Vouchers */}
          <button
            onClick={() => {
              triggerHaptic();
              onOpenVouchers();
            }}
            className="relative flex items-center gap-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-3 py-1.5 text-[11px] font-extrabold text-white shadow-sm hover:shadow-md transition-all min-h-[36px] focus:outline-none focus:ring-2 focus:ring-rose-400"
            aria-label="Jump to my vouchers"
          >
            <Gift size={13} className="fill-white" />
            <span className="hidden xs:inline">My Vouchers</span>
            <span className="xs:hidden">🎁</span>
            {unclaimedVoucherCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-white text-rose-600 text-[10px] font-extrabold border border-rose-300 shadow-sm animate-bounce">
                {unclaimedVoucherCount}
              </span>
            )}
          </button>
        </div>

        {/* ROW 2: Experience Steps Progress Bar */}
        <div className="mt-2.5 pt-2 border-t border-rose-100/70 flex items-center gap-1 sm:gap-2">
          {experienceSteps.map((item, index) => {
            const isDone = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <button
                key={item.key}
                onClick={() => {
                  triggerHaptic();
                  onStepChange(item.key);
                }}
                className="flex-1 focus:outline-none focus:ring-2 focus:ring-rose-400 rounded-xl min-h-[36px] flex flex-col items-center justify-center transition-all"
                aria-label={`Go to ${item.label}`}
              >
                <div className="w-full flex flex-col items-center gap-1">
                  <div
                    className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                      isCurrent
                        ? "bg-gradient-to-r from-rose-500 to-pink-500 ring-2 ring-rose-300 shadow-sm"
                        : isDone
                        ? "bg-rose-400"
                        : "bg-rose-200/70"
                    }`}
                  />
                  <span className={`text-[10px] sm:text-[11px] font-bold tracking-tight transition-colors ${isCurrent ? "text-rose-700 font-extrabold" : isDone ? "text-rose-600" : "text-gray-400"}`}>
                    {item.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </motion.header>
  );
}

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Calendar, ChevronDown, BookOpen, CheckCircle2 } from "lucide-react";
import { monthsaryConfig } from "../config/monthsaryConfig";

type ExperienceStep = "welcome" | "letter" | "memories" | "reaction" | "confirmation";

interface PastMonthsaryNavbarProps {
  currentStep: ExperienceStep;
  onStepChange: (step: ExperienceStep) => void;
  onSelectPastMonth: (index: number) => void;
  savedResponseToken: string | null;
}

const experienceSteps: { key: ExperienceStep; label: string }[] = [
  { key: "welcome", label: "Welcome" },
  { key: "letter", label: "Letter 💌" },
  { key: "memories", label: "Memories 📸" },
  { key: "reaction", label: "Reply 💕" },
];

export function PastMonthsaryNavbar({
  currentStep,
  onStepChange,
  onSelectPastMonth,
  savedResponseToken,
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
      className="sticky top-2 z-40 w-full max-w-2xl px-3 mx-auto"
    >
      <div className="rounded-3xl bg-white/85 backdrop-blur-xl px-4 py-2.5 shadow-xl border border-white/80 transition-all relative">
        {/* ROW 1: Branding, Past Monthsaries Dropdown Trigger & Saved Reply Pill */}
        <div className="flex items-center justify-between gap-2">
          {/* Brand Logo / Title */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-sm">
              <Heart size={14} className="fill-white" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-rose-700 font-display hidden xs:inline-block">
              7 Months of Us
            </span>
          </div>

          {/* Past Monthsaries Selector Dropdown Pill */}
          <div className="relative">
            <button
              onClick={() => {
                triggerHaptic();
                setIsPastDropdownOpen(!isPastDropdownOpen);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold transition-all border shadow-sm min-h-[36px] ${
                isPastDropdownOpen
                  ? "bg-rose-500 text-white border-rose-500 shadow-rose-500/20"
                  : "bg-rose-50/90 text-rose-700 border-rose-200 hover:bg-rose-100/80"
              }`}
              aria-label="Toggle past monthsaries menu"
            >
              <Calendar size={13} className={isPastDropdownOpen ? "text-white" : "text-rose-500"} />
              <span>Past Monthsaries (1-7)</span>
              <ChevronDown
                size={13}
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
                    className="absolute right-0 top-full mt-2 z-50 w-72 bg-white/95 backdrop-blur-2xl p-3 rounded-2xl border border-rose-200 shadow-2xl text-left"
                  >
                    <div className="flex justify-between items-center px-2 py-1 mb-2 border-b border-rose-100">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-600 flex items-center gap-1">
                        <BookOpen size={12} />
                        Our 7 Months Journey
                      </span>
                      <span className="text-[9px] text-gray-400 font-medium">Select a month</span>
                    </div>

                    <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                      {monthsaryConfig.timelineEvents.map((evt, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            triggerHaptic();
                            setIsPastDropdownOpen(false);
                            onSelectPastMonth(idx);
                          }}
                          className="w-full p-2 rounded-xl text-left hover:bg-rose-50/80 transition-colors flex items-center justify-between group min-h-[40px]"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${evt.color} text-white flex items-center justify-center text-[10px] font-bold shadow-sm`}>
                              {idx + 1}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-800 group-hover:text-rose-600 transition-colors">
                                {evt.month}
                              </p>
                              <p className="text-[10px] text-gray-500 truncate max-w-[170px]">
                                {evt.title}
                              </p>
                            </div>
                          </div>
                          <span className="text-[9px] text-rose-400 font-medium shrink-0">
                            {evt.date.split(",")[0]}
                          </span>
                        </button>
                      ))}
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
              className="hidden sm:flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1.5 text-[11px] font-extrabold text-rose-700 border border-rose-200 hover:bg-rose-200 transition-colors shadow-sm min-h-[36px]"
            >
              <CheckCircle2 size={13} className="text-rose-500" />
              <span>My Saved Reply 💕</span>
            </button>
          )}
        </div>

        {/* ROW 2: Experience Steps Progress Bar */}
        <div className="mt-2 pt-2 border-t border-rose-100/70 flex items-center gap-1.5">
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
                className="flex-1 focus:outline-none min-h-[32px] flex flex-col items-center justify-center"
              >
                <div className="w-full flex flex-col items-center gap-1">
                  <div
                    className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                      isCurrent
                        ? "bg-rose-500 ring-2 ring-rose-300 shadow-sm"
                        : isDone
                        ? "bg-rose-400"
                        : "bg-rose-200/70"
                    }`}
                  />
                  <span className={`text-[10px] font-bold tracking-tight transition-colors ${isCurrent ? "text-rose-700 font-extrabold" : isDone ? "text-rose-600" : "text-gray-400"}`}>
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

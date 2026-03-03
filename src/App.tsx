"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { MusicPlayer } from "./components/MusicPlayer";
import { ImageCarousel } from "./components/ImageCarousel";
import { ReasonsCard } from "./components/ReasonsCard";
import { RelationshipTimer } from "./components/RelationshipTimer";
import { MouseTrail } from "./components/MouseTrail";
import { FloatingHearts } from "./components/FloatingHearts";

import { HeartBurst } from "./components/HeartBurst";
import { Itinerary } from "./components/Itinerary";
import { InvitationMessage } from "./components/InvitationMessage";
import { BirthdayLetter } from "./components/BirthdayLetter";

type JourneyStep = "opening" | "letter" | "monthsary";

const journeySteps: { key: JourneyStep; label: string }[] = [
  { key: "opening", label: "Open" },
  { key: "letter", label: "Letter" },
  { key: "monthsary", label: "2nd Monthsary" },
];

const MONTHSARY_DATE = "2026-03-04";
const BIRTHDAY_DATE = "2026-03-07";

const toLocalDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const startOfDay = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate());

const formatDate = (value: Date, withWeekday = false) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: withWeekday ? "long" : undefined,
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(value);

const getRelativeLabel = (targetDate: Date) => {
  const today = startOfDay(new Date());
  const target = startOfDay(targetDate);
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays > 1 && diffDays <= 7) {
    return `This ${new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(targetDate)}`;
  }
  if (diffDays > 7) return "Upcoming";
  if (diffDays === -1) return "Yesterday";
  return "Celebrated";
};

export default function Page() {
  const [step, setStep] = useState<JourneyStep>("opening");
  const [birthdayLetterTrigger, setBirthdayLetterTrigger] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const currentStepIndex = journeySteps.findIndex((item) => item.key === step);
  const monthsaryDate = toLocalDate(MONTHSARY_DATE);
  const birthdayDate = toLocalDate(BIRTHDAY_DATE);
  const monthsaryDateText = formatDate(monthsaryDate);
  const birthdayDateText = formatDate(birthdayDate, true);
  const monthsaryRelative = getRelativeLabel(monthsaryDate);
  const birthdayRelative = getRelativeLabel(birthdayDate);

  const celebrate = () => {
    confetti({
      particleCount: 150,
      spread: 60,
      origin: { y: 0.6 },
      colors: ["#ec4899", "#ef4444", "#eab308"],
    });

    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.6 },
        startVelocity: 30,
      });
    }, 500);
  };

  const openMemories = () => {
    setStep("letter");
    celebrate();
  };

  const openMonthsary = () => {
    setStep("monthsary");
    celebrate();
  };

  const scrollToBirthdayLetter = () => {
    const target = document.getElementById("birthday-letter");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const jumpToBirthdayLetter = () => {
    setBirthdayLetterTrigger((prev) => prev + 1);

    if (step !== "monthsary") {
      setStep("monthsary");
      setTimeout(scrollToBirthdayLetter, 350);
      return;
    }

    scrollToBirthdayLetter();
  };

  const scrollToSection = (id: string) => {
    const target = document.getElementById(id);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden text-center selection:bg-rose-200 font-sans pb-12">
      {/* Vignette Overlay */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-radial-gradient from-transparent to-pink-200/20 mix-blend-multiply"></div>

      <MusicPlayer />
      <MouseTrail />
      <FloatingHearts />
      <HeartBurst />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-20 mt-4 w-full max-w-md px-4"
      >
        <div className="rounded-2xl bg-white/70 px-4 py-3 shadow-lg backdrop-blur-md border border-white/60">
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-500">
            Our Journey • Step {currentStepIndex + 1} of {journeySteps.length}
          </p>
          <div className="mt-2 flex justify-center">
            <button
              onClick={jumpToBirthdayLetter}
              className="rounded-full bg-fuchsia-100 px-3 py-1 text-[11px] font-semibold text-fuchsia-600 border border-fuchsia-200 hover:bg-fuchsia-200 transition-colors"
            >
              🎂 Birthday: {birthdayRelative} ({birthdayDateText})
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            {journeySteps.map((item, index) => {
              const isDone = index <= currentStepIndex;

              return (
                <div key={item.key} className="flex flex-1 items-center gap-2">
                  <div className="flex w-full flex-col items-center gap-1">
                    <div
                      className={`h-2 w-full rounded-full transition-colors ${
                        isDone ? "bg-rose-500" : "bg-rose-200"
                      }`}
                    />
                    <span className={`text-[10px] font-medium ${isDone ? "text-rose-600" : "text-gray-400"}`}>
                      {item.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {step === "opening" && (
          <motion.div
            key="opening"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, rotate: -10 }}
            className="z-10 flex flex-col items-center p-4 max-w-lg w-full"
          >
            <motion.img
              className="h-[250px] w-auto drop-shadow-lg"
              src="https://gifdb.com/images/high/cute-love-bear-roses-ou7zho5oosxnpo6k.gif"
              alt="Cute bear"
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ repeat: Infinity, repeatType: "mirror", duration: 1.5 }}
            />
            <h1 className="my-8 text-4xl font-bold text-rose-600 drop-shadow-sm md:text-7xl font-display">
              Open Our Memories 💌 <br />
              <span className="text-purple-600 block mt-4 text-2xl md:text-5xl">Our Valentine Story + 2nd Monthsary</span>
            </h1>
            <p className="mb-8 text-lg text-rose-700 max-w-md">
              Valentine's may be done, but our love story keeps getting sweeter every month. Ready to open our memories?
            </p>
            <p className="mb-6 text-sm text-rose-500 max-w-md font-semibold">
              {monthsaryRelative}: {monthsaryDateText} • 2nd Monthsary milestone 💕
            </p>
            <p className="mb-6 text-sm text-fuchsia-500 max-w-md font-semibold">
              Birthday celebration: {birthdayRelative} ({birthdayDateText}) 🎂
            </p>
            <div className="flex items-center justify-center w-full">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-full bg-rose-500 px-8 py-4 font-bold text-white shadow-lg transition-colors hover:bg-rose-600 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-rose-300 z-20"
                onClick={openMemories}
              >
                Open Our Memories ✨
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === "letter" && (
          <LetterView onBack={() => setStep("opening")} onNext={openMonthsary} monthsaryDate={monthsaryDateText} monthsaryRelative={monthsaryRelative} />
        )}

        {step === "monthsary" && (
          <motion.div
            key="monthsary"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="z-10 flex flex-col items-center p-4 max-w-4xl w-full"
          >
            <motion.img
              src="https://media.tenor.com/gUiu1zyxfzYAAAAi/bear-kiss-bear-kisses.gif"
              alt="Bear kiss"
              className="h-[200px] w-auto drop-shadow-xl"
            />
            <RelationshipTimer />

            <h1 className="my-8 text-5xl font-extrabold text-rose-600 md:text-7xl font-display">
              Happy 2nd Monthsary! 💕
            </h1>

            <p className="mb-4 text-xl md:text-2xl font-semibold text-gray-700 max-w-2xl">
              This page is for us — our little memory lane and our new chapter together.
            </p>
            <p className="mb-5 text-sm text-rose-500 font-semibold">
              2nd Monthsary: {monthsaryRelative} ({monthsaryDateText}) 💞 • Birthday: {birthdayRelative} ({birthdayDateText}) 🎂
            </p>

            <div className="mb-5 flex w-full max-w-3xl flex-wrap items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-white/60 p-3 shadow-sm backdrop-blur-sm">
              <button
                onClick={() => scrollToSection("reasons-section")}
                className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100"
              >
                💗 Reasons
              </button>
              <button
                onClick={() => scrollToSection("memories-section")}
                className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100"
              >
                📸 Memories
              </button>
              <button
                onClick={() => scrollToSection("itinerary-section")}
                className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100"
              >
                🗓️ Itinerary
              </button>
              <button
                onClick={() => scrollToSection("invitation-section")}
                className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100"
              >
                💌 Invitation
              </button>
              <button
                onClick={jumpToBirthdayLetter}
                className="rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1.5 text-xs font-semibold text-fuchsia-600 hover:bg-fuchsia-100"
              >
                🎂 Birthday Letter
              </button>
            </div>

            <div id="reasons-section" className="flex w-full justify-center">
              <ReasonsCard />
            </div>
            <div id="memories-section" className="flex w-full justify-center">
              <ImageCarousel />
            </div>
            <div id="itinerary-section" className="flex w-full justify-center">
              <Itinerary />
            </div>
            <div id="invitation-section" className="flex w-full justify-center">
              <InvitationMessage
                birthdayDate={birthdayDateText}
                birthdayRelative={birthdayRelative}
                monthsaryDate={monthsaryDateText}
                monthsaryRelative={monthsaryRelative}
              />
            </div>
            <BirthdayLetter
              birthdayDate={birthdayDateText}
              birthdayRelative={birthdayRelative}
              openTrigger={birthdayLetterTrigger}
            />

            <p className="mb-4 text-2xl font-semibold text-gray-700">
              I love you so much, baby! 💗
            </p>

            <button
              onClick={() => setStep("letter")}
              className="rounded-full bg-purple-500 px-6 py-3 font-bold text-white hover:bg-purple-600 transition-colors shadow-md text-sm md:text-base"
            >
              Read Our Letter Again 💌
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {showBackToTop && step === "monthsary" && (
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-20 left-4 z-40 rounded-full border border-rose-200 bg-white/85 px-4 py-2 text-sm font-semibold text-rose-600 shadow-lg backdrop-blur-md hover:bg-white"
        >
          ↑ Top
        </motion.button>
      )}
    </div>
  );
}

function LetterView({ onBack, onNext, monthsaryDate, monthsaryRelative }: { onBack: () => void; onNext: () => void; monthsaryDate: string; monthsaryRelative: string }) {
  const text = `My love, happy Valentine's and happy monthsary.\n\nEven after Valentine's Day, my heart still chooses you every single day. Thank you for every smile, every laugh, and every quiet moment we share.\n\nFor our 2nd monthsary ${monthsaryRelative.toLowerCase()}, ${monthsaryDate}, I made this little space to keep our memories and remind you how deeply loved you are.\n\nAngelica Amistad Ogana, you are my favorite person and my safe place. I love you more than words, code, or confetti can say.\n\nAlways yours,\nYour Baby 💕`;

  const [displayedText] = useState(text);

  return (
    <motion.div
      key="letter"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className="z-20 m-2 md:m-4 max-w-2xl w-full rounded-2xl bg-[#fffcf5] p-6 md:p-8 shadow-2xl backdrop-blur-sm border-2 border-rose-200 relative overflow-hidden"
    >
      {/* Paper texture overlay */}
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none"></div>

      <h2 className="mb-4 md:mb-6 text-2xl md:text-4xl font-bold text-rose-600 font-display relative z-10">My Dearest Angelica,</h2>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 0.5 }}
        className="space-y-4 text-left text-base md:text-lg text-gray-800 leading-relaxed font-medium min-h-[300px] whitespace-pre-wrap font-serif relative z-10"
      >
        {displayedText}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3 }}
        className="flex items-center justify-between mt-8 relative z-10 gap-3"
      >
        <button
          onClick={onBack}
          className="rounded-full bg-gray-500 px-6 py-2 font-bold text-white hover:bg-gray-600 transition-colors shadow-md text-sm md:text-base"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="rounded-full bg-rose-500 px-6 py-2 font-bold text-white hover:bg-rose-600 transition-colors shadow-md text-sm md:text-base"
        >
          Go to Our 2nd Monthsary ✨
        </button>
      </motion.div>
    </motion.div>
  );
}

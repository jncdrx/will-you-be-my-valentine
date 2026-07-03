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
import { Camera } from "lucide-react";

type JourneyStep = "opening" | "letter" | "monthsary";

const journeySteps: { key: JourneyStep; label: string }[] = [
  { key: "opening", label: "Open" },
  { key: "letter", label: "Letter" },
  { key: "monthsary", label: "Milestones 💕" },
];

const MONTHSARY_2_DATE = "2026-03-04";
const MONTHSARY_3_DATE = "2026-04-04";
const MONTHSARY_4_DATE = "2026-05-04";
const MONTHSARY_6_DATE = "2026-07-04";
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
  const [step, setStep] = useState<JourneyStep>("monthsary");
  const [birthdayLetterTrigger, setBirthdayLetterTrigger] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeMonthsary, setActiveMonthsary] = useState<2 | 3 | 4 | 6>(6);
  const currentStepIndex = journeySteps.findIndex((item) => item.key === step);
  
  const monthsary2Date = toLocalDate(MONTHSARY_2_DATE);
  const monthsary3Date = toLocalDate(MONTHSARY_3_DATE);
  const monthsary4Date = toLocalDate(MONTHSARY_4_DATE);
  const monthsary6Date = toLocalDate(MONTHSARY_6_DATE);
  const birthdayDate = toLocalDate(BIRTHDAY_DATE);
  
  const monthsary2DateText = formatDate(monthsary2Date);
  const monthsary3DateText = formatDate(monthsary3Date);
  const monthsary4DateText = formatDate(monthsary4Date);
  const monthsary6DateText = formatDate(monthsary6Date);
  const birthdayDateText = formatDate(birthdayDate, true);
  
  const monthsary2Relative = getRelativeLabel(monthsary2Date);
  const monthsary3Relative = getRelativeLabel(monthsary3Date);
  const monthsary4Relative = getRelativeLabel(monthsary4Date);
  const monthsary6Relative = getRelativeLabel(monthsary6Date);
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
    setActiveMonthsary(2);
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
              <span className="text-purple-600 block mt-4 text-2xl md:text-5xl">Our Valentine Story & Milestones</span>
            </h1>
            <p className="mb-8 text-lg text-rose-700 max-w-md">
              Valentine's may be done, but our love story keeps getting sweeter every month. Ready to explore our milestones?
            </p>
            <p className="mb-6 text-sm text-rose-500 max-w-md font-semibold">
              Celebrating our beautiful journey from the 2nd to the 4th Monthsary! 💕
            </p>
            <p className="mb-6 text-sm text-fuchsia-500 max-w-md font-semibold">
              Includes birthday celebration: {birthdayRelative} ({birthdayDateText}) 🎂
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
          <LetterView onBack={() => setStep("opening")} onNext={openMonthsary} monthsaryDate={monthsary2DateText} monthsaryRelative={monthsary2Relative} />
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

            {/* Monthsary Milestone Timeline Selector */}
            <div className="mb-6 mt-4 flex items-center justify-center gap-1.5 bg-white/60 p-2 rounded-2xl border border-rose-100 shadow-md max-w-xl w-full backdrop-blur-sm">
              {[2, 3, 4, 6].map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setActiveMonthsary(m as 2 | 3 | 4 | 6);
                    celebrate();
                  }}
                  className={`flex-1 py-2 text-[10px] md:text-xs font-bold rounded-xl transition-all duration-300 ${
                    activeMonthsary === m
                      ? "bg-rose-500 text-white shadow-sm scale-105"
                      : "text-rose-600 hover:bg-rose-100/50"
                  }`}
                >
                  {m === 2 ? "2nd" : m === 3 ? "3rd" : m === 4 ? "4th" : m === 6 ? "6th" : ""} Monthsary
                </button>
              ))}
            </div>

            {activeMonthsary === 2 && (
              <>
                <h1 className="my-8 text-5xl font-extrabold text-rose-600 md:text-7xl font-display">
                  Happy 2nd Monthsary! 💕
                </h1>

                <p className="mb-4 text-xl md:text-2xl font-semibold text-gray-700 max-w-2xl">
                  This page is for us — our little memory lane and our new chapter together.
                </p>
                <p className="mb-5 text-sm text-rose-500 font-semibold">
                  2nd Monthsary: {monthsary2Relative} ({monthsary2DateText}) 💞 • Birthday: {birthdayRelative} ({birthdayDateText}) 🎂
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
                  <ImageCarousel activeChapter={2} />
                </div>
                <div id="itinerary-section" className="flex w-full justify-center">
                  <Itinerary />
                </div>
                <div id="invitation-section" className="flex w-full justify-center">
                  <InvitationMessage
                    birthdayDate={birthdayDateText}
                    birthdayRelative={birthdayRelative}
                    monthsaryDate={monthsary2DateText}
                    monthsaryRelative={monthsary2Relative}
                  />
                </div>
                <BirthdayLetter
                  birthdayDate={birthdayDateText}
                  birthdayRelative={birthdayRelative}
                  openTrigger={birthdayLetterTrigger}
                />
              </>
            )}

            {activeMonthsary === 3 && (
              <>
                <h1 className="my-8 text-5xl font-extrabold text-rose-600 md:text-7xl font-display">
                  Happy 3rd Monthsary! 💕
                </h1>

                <p className="mb-4 text-xl md:text-2xl font-semibold text-gray-700 max-w-2xl">
                  Three months of laughs, beautiful moments, and a love that keeps growing.
                </p>
                <p className="mb-5 text-sm text-rose-500 font-semibold">
                  3rd Monthsary: {monthsary3Relative} ({monthsary3DateText}) 💞
                </p>

                <div className="mb-5 flex w-full max-w-3xl flex-wrap items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-white/60 p-3 shadow-sm backdrop-blur-sm">
                  <button
                    onClick={() => scrollToSection("reasons-section")}
                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                  >
                    💗 Reasons
                  </button>
                  .
                  <button
                    onClick={() => scrollToSection("memories-section")}
                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                  >
                    📸 Memories
                  </button>
                  <button
                    onClick={() => scrollToSection("letter-section-3")}
                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                  >
                    💌 Monthsary Note
                  </button>
                </div>

                <div id="reasons-section" className="flex w-full justify-center">
                  <ReasonsCard />
                </div>
                <div id="memories-section" className="flex w-full justify-center">
                  <ImageCarousel activeChapter={3} />
                </div>
                <div id="letter-section-3" className="my-6 w-full max-w-2xl px-4 text-center">
                  <div className="rounded-2xl bg-[#fffcf5] p-6 md:p-8 shadow-2xl border-2 border-rose-200 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none" />
                    <h3 className="text-xl font-bold font-display text-rose-600 mb-4">💌 Our 3rd Monthsary Note</h3>
                    <div className="rounded-xl bg-white/70 p-5 border border-rose-100 shadow-inner">
                      <p className="text-sm md:text-base text-gray-700 leading-relaxed font-serif text-center whitespace-pre-line">
                        {`Happy 3rd Monthsary, my angel! 🌹

                        Three months of loving you, and every single day brings a new reason to smile. Thank you for your warmth, your sweetness, and for being the best part of my year.

                        You are my favorite thoughts and my absolute safe haven. I love you more and more with every heartbeat! 💕`}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeMonthsary === 4 && (
              <>
                <h1 className="my-8 text-5xl font-extrabold text-rose-600 md:text-7xl font-display">
                  Happy 4th Monthsary! 💕
                </h1>

                <p className="mb-4 text-xl md:text-2xl font-semibold text-gray-700 max-w-2xl">
                  Four months of beautiful smiles, inside jokes, and endless sweet adventures.
                </p>
                <p className="mb-5 text-sm text-rose-500 font-semibold">
                  4th Monthsary: {monthsary4Relative} ({monthsary4DateText}) 💞
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
                    onClick={() => scrollToSection("letter-section-4")}
                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                  >
                    💌 Monthsary Note
                  </button>
                </div>

                <div id="reasons-section" className="flex w-full justify-center">
                  <ReasonsCard />
                </div>
                <div id="memories-section" className="flex w-full justify-center">
                  <ImageCarousel activeChapter={4} />
                </div>
                <div id="letter-section-4" className="my-6 w-full max-w-2xl px-4 text-center">
                  <div className="rounded-2xl bg-[#fffcf5] p-6 md:p-8 shadow-2xl border-2 border-rose-200 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none" />
                    <h3 className="text-xl font-bold font-display text-rose-600 mb-4">💌 Our 4th Monthsary Note</h3>
                    <div className="rounded-xl bg-white/70 p-5 border border-rose-100 shadow-inner">
                      <p className="text-sm md:text-base text-gray-700 leading-relaxed font-serif text-center whitespace-pre-line">
                        {`Happy 4th Monthsary, mahal ko! ✨

                        Four months of beautiful smiles, inside jokes, and endless love. You are my safe haven, my peace, and my favorite adventure.

                        Looking forward to many more months and years of laughing, growing, and loving together. Always yours! 💖`}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeMonthsary === 6 && (
              <>
                <h1 className="my-8 text-5xl font-extrabold text-rose-600 md:text-7xl font-display">
                  Happy 6th Monthsary! 💕
                </h1>

                <p className="mb-4 text-xl md:text-2xl font-semibold text-gray-700 max-w-2xl">
                  Six months of love, laughter, and building our beautiful future together.
                </p>
                <p className="mb-5 text-sm text-rose-500 font-semibold">
                  6th Monthsary: {monthsary6Relative} ({monthsary6DateText}) 💞
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
                    📸 Memories Promise
                  </button>
                  <button
                    onClick={() => scrollToSection("letter-section-6")}
                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                  >
                    💌 Monthsary Note
                  </button>
                </div>

                <div id="reasons-section" className="flex w-full justify-center">
                  <ReasonsCard />
                </div>

                {/* Future Memories Block */}
                <div id="memories-section" className="my-8 w-full max-w-3xl mx-auto px-4">
                  <h3 className="mb-4 text-center text-3xl text-rose-600 font-bold font-display">Our Memories</h3>
                  
                  <div className="rounded-3xl bg-white/70 p-6 md:p-8 shadow-xl border border-rose-100 backdrop-blur-md text-center">
                    <motion.div
                      animate={{ scale: [1, 1.03, 1] }}
                      transition={{ repeat: Infinity, duration: 3 }}
                      className="inline-block bg-rose-100 text-rose-600 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider mb-4"
                    >
                      📸 A Sweet Promise
                    </motion.div>
                    
                    <h4 className="text-2xl font-extrabold text-rose-700 mb-3 font-display">
                      Let's make our memories when we meet each other ulit! ✨
                    </h4>
                    <p className="text-sm md:text-base text-gray-600 max-w-xl mx-auto mb-8 leading-relaxed">
                      We don't have photos for this month yet, but that's just because our next meeting is going to be filled with so many beautiful moments. Let's fill up this carousel when we meet each other again! 🧸💞
                    </p>

                    {/* Dotted Polaroid Placeholder Frames */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 justify-items-center mb-8">
                      <FuturePolaroid label="Our next warm hug 🤗" />
                      <FuturePolaroid label="Sweet couple selfie 🤳" />
                      <FuturePolaroid label="Dating adventures 🍽️" />
                      <FuturePolaroid label="Quiet happy moment 👩‍❤️‍👨" />
                    </div>

                    {/* Interactive Future Date Checklist */}
                    <div className="max-w-md mx-auto text-left bg-rose-50/50 rounded-2xl p-5 border border-rose-100/60 shadow-inner">
                      <h5 className="text-sm font-bold text-rose-600 uppercase tracking-wider mb-3 text-center">
                        📋 Our Next Date Bucket List
                      </h5>
                      <DateChecklist />
                    </div>
                  </div>
                </div>

                <div id="letter-section-6" className="my-6 w-full max-w-2xl px-4 text-center">
                  <div className="rounded-2xl bg-[#fffcf5] p-6 md:p-8 shadow-2xl border-2 border-rose-200 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none" />
                    <h3 className="text-xl font-bold font-display text-rose-600 mb-4">💌 Our 6th Monthsary Note</h3>
                    <div className="rounded-xl bg-white/70 p-5 border border-rose-100 shadow-inner">
                      <p className="text-sm md:text-base text-gray-700 leading-relaxed font-serif text-center whitespace-pre-line">
                        {`Happy 6th Monthsary, my darling Angelica! 💖

                        Six months of loving you, and my heart still beats for you just as strongly as the very first day. Thank you for your endless patience, your beautiful smiles, and the pure joy you bring to my life.

                        Distance or busy days cannot lessen how much you mean to me. I cannot wait until we meet again to create new, sweet memories and capture them all. You are my safe place, always. I love you so much! 🌸💞`}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            <p className="mb-4 text-2xl font-semibold text-gray-700 mt-6">
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
          Go to Our Milestones ✨
        </button>
      </motion.div>
    </motion.div>
  );
}

function FuturePolaroid({ label }: { label: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, rotate: 0 }}
      className="w-[130px] md:w-36 bg-white p-3 rounded-lg shadow-md border border-dashed border-rose-300 flex flex-col items-center justify-between rotate-1 odd:-rotate-1 transition-all duration-300"
    >
      <div className="w-full aspect-[4/5] bg-rose-50/50 rounded flex flex-col items-center justify-center border border-dashed border-rose-200 relative group overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-rose-400 group-hover:text-rose-500"
        >
          <Camera size={28} />
        </motion.div>
        <span className="text-[10px] text-rose-400/80 font-bold uppercase mt-2 tracking-wider">Reserved 📸</span>
      </div>
      <p className="mt-2 text-[10px] text-center font-medium italic text-rose-600 leading-tight">
        {label}
      </p>
    </motion.div>
  );
}

function DateChecklist() {
  const [items, setItems] = useState([
    { id: 1, text: "Long warm hug when we meet 🤗", checked: false },
    { id: 2, text: "Take a silly couple mirror selfie 🤳", checked: false },
    { id: 3, text: "Try a new food spot together 🍽️", checked: false },
    { id: 4, text: "Walk hand-in-hand under the stars 🌌", checked: false },
    { id: 5, text: "Share a sweet dessert (or cupcake) 🧁", checked: false },
    { id: 6, text: "Buy toy for Amiel 🧸", checked: false },
    { id: 7, text: "Photobooth together 📸", checked: false },
  ]);

  const toggleCheck = (id: number) => {
    setItems(items.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)));
  };

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.id}
          onClick={() => toggleCheck(item.id)}
          className="flex items-center gap-2.5 cursor-pointer select-none group py-1"
        >
          <div
            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
              item.checked ? "bg-rose-500 border-rose-500 text-white" : "border-rose-300 bg-white group-hover:border-rose-400"
            }`}
          >
            {item.checked && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-[10px] font-bold"
              >
                ✓
              </motion.span>
            )}
          </div>
          <span
            className={`text-xs md:text-sm font-medium transition-all ${
              item.checked ? "text-gray-400 line-through italic" : "text-gray-700 group-hover:text-rose-600"
            }`}
          >
            {item.text}
          </span>
        </li>
      ))}
    </ul>
  );
}

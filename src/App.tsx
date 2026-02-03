"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { MusicPlayer } from "./components/MusicPlayer";
import { ImageCarousel } from "./components/ImageCarousel";
import { ReasonsCard } from "./components/ReasonsCard";
import { RelationshipTimer } from "./components/RelationshipTimer";
import { Envelope } from "./components/Envelope";
import { MouseTrail } from "./components/MouseTrail";
import { FloatingHearts } from "./components/FloatingHearts";

import { HeartBurst } from "./components/HeartBurst";

export default function Page() {
  const [, setNoCount] = useState(0);
  const [step, setStep] = useState<"ask" | "celebrate" | "letter">("ask");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 }); // Kept for 'No' button logic only
  const [noBtnPos, setNoBtnPos] = useState({ x: 0, y: 0 });
  const noBtnRef = useRef<HTMLButtonElement>(null);

  // Handle Mouse & Touch Move for 'No' button logic + Parallax
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      let clientX, clientY;

      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }

      setMousePos({ x: clientX, y: clientY });
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove);
    // Also track touchstart to update position immediately
    window.addEventListener("touchstart", handleMove);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchstart", handleMove);
    };
  }, []);

  // Smart No Button Logic (Works for Mouse Distance + Touch Attempt)
  const moveNoButton = () => {
    // Reduce movement range on smaller screens to keep button visible
    const xRange = Math.min(window.innerWidth - 100, 400);
    const yRange = Math.min(window.innerHeight - 100, 400);

    const newX = (Math.random() - 0.5) * xRange;
    const newY = (Math.random() - 0.5) * yRange;

    setNoBtnPos({ x: newX, y: newY });
    setNoCount(prev => prev + 1);
  };

  useEffect(() => {
    if (step === "ask" && noBtnRef.current) {
      const btnRect = noBtnRef.current.getBoundingClientRect();
      const btnCenter = {
        x: btnRect.left + btnRect.width / 2,
        y: btnRect.top + btnRect.height / 2
      };

      const distance = Math.sqrt(
        Math.pow(mousePos.x - btnCenter.x, 2) + Math.pow(mousePos.y - btnCenter.y, 2)
      );

      // Mouse proximity check
      if (distance < 100) {
        moveNoButton();
      }
    }
  }, [mousePos, step]);


  const handleYesClick = () => {
    setStep("celebrate");
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


  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden text-center selection:bg-rose-200 font-sans pb-12">
      {/* Vignette Overlay */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-radial-gradient from-transparent to-pink-200/20 mix-blend-multiply"></div>

      <MusicPlayer />
      <MouseTrail />
      <FloatingHearts />
      <HeartBurst />

      <AnimatePresence mode="wait">
        {step === "ask" && (
          <motion.div
            key="ask"
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
              Will you be my Valentine, <br />
              <span className="text-purple-600 block mt-4 text-3xl md:text-6xl">Angelica Amistad Ogana?</span>
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-4 w-full relative h-20">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-full bg-rose-500 px-8 py-4 font-bold text-white shadow-lg transition-colors hover:bg-rose-600 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-rose-300 z-20"
                onClick={handleYesClick}
              >
                Yes
              </motion.button>

              <motion.button
                ref={noBtnRef}
                animate={{ x: noBtnPos.x, y: noBtnPos.y }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-full bg-gray-400 px-8 py-4 font-bold text-white shadow-lg transition-colors hover:bg-gray-500 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-gray-300 absolute"
              >
                No
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === "celebrate" && (
          <motion.div
            key="celebrate"
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
              WOOOOOO!!! <br /> Happy Monthsary!
            </h1>

            <ReasonsCard />
            <ImageCarousel />

            <p className="mb-4 text-2xl font-semibold text-gray-700">
              I love you so much baby! ;))
            </p>

            {/* Envelope Trigger */}
            <Envelope onOpen={() => setStep("letter")} />
          </motion.div>
        )}

        {step === "letter" && (
          <LetterView onBack={() => setStep("celebrate")} />
        )}
      </AnimatePresence>
    </div>
  );
}

function LetterView({ onBack }: { onBack: () => void }) {
  const text = `Happy Monthsary, my love! \n\nEvery moment with you has been a blessing. From the laughter to the quiet moments, you’ve made my life so much brighter. I wanted to create this little digital corner just for you—to ask you to be my Valentine and to celebrate us.\n\nAngelica Amistad Ogana, you are the most beautiful person, inside and out. Thank you for being you, and for being mine.\nI love you more than words, code, or confetti can say.\n\nAlways yours,\nYour Baby`;

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
        className="flex justify-end mt-8 relative z-10"
      >
        <button
          onClick={onBack}
          className="rounded-full bg-rose-500 px-6 py-2 font-bold text-white hover:bg-rose-600 transition-colors shadow-md text-sm md:text-base"
        >
          Close Letter
        </button>
      </motion.div>
    </motion.div>
  );
}

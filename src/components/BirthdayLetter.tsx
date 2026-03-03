import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cake, Gift, Heart } from "lucide-react";

interface BirthdayLetterProps {
  birthdayDate: string;
  birthdayRelative: string;
  openTrigger?: number;
}

export function BirthdayLetter({ birthdayDate, birthdayRelative, openTrigger = 0 }: BirthdayLetterProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (openTrigger > 0) {
      setIsOpen(true);
    }
  }, [openTrigger]);

  const text = `Happy Birthday, my love! 🎂\n\n${birthdayRelative} (${birthdayDate}) is all about you. Thank you for being my sunshine, my comfort, and my favorite person.\n\nI hope your day feels as beautiful as your heart. I want to celebrate every smile, every laugh, and every little thing that makes you, you.\n\nYou are loved beyond words, and I will always choose you.\n\nHappy Birthday and happy 2nd monthsary, baby.\n\nAlways yours,\nYour Baby 💕`;

  return (
    <div id="birthday-letter" className="my-6 w-full max-w-2xl px-4 scroll-mt-6">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-rose-500 px-6 py-4 font-bold text-white shadow-lg hover:shadow-xl transition-all duration-300"
      >
        {isOpen ? "Hide Birthday Letter" : "🎂 Read Birthday Letter"}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-4 rounded-2xl bg-[#fffcf5] p-6 md:p-8 shadow-2xl border-2 border-rose-200 relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none" />

            <div className="relative z-10 mb-4 flex items-center justify-center gap-2 text-rose-600">
              <Cake size={18} />
              <h3 className="text-xl font-bold font-display">Birthday Letter</h3>
              <Gift size={18} />
            </div>

            <div className="relative z-10 rounded-xl bg-white/70 p-4 md:p-6 border border-rose-100 shadow-inner text-center">
              <pre className="whitespace-pre-wrap text-sm md:text-base text-gray-700 leading-relaxed font-sans text-center">
                {text}
              </pre>
            </div>

            <div className="relative z-10 mt-4 text-center text-rose-500 flex items-center justify-center gap-1 text-sm">
              <Heart size={14} fill="#f43f5e" />
              <span>Made with love for your birthday</span>
              <Heart size={14} fill="#f43f5e" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Copy, Check, Mail } from "lucide-react";

interface InvitationMessageProps {
  birthdayDate: string;
  birthdayRelative: string;
  monthsaryDate: string;
  monthsaryRelative: string;
}

const createInvitationText = ({ birthdayDate, birthdayRelative, monthsaryDate, monthsaryRelative }: InvitationMessageProps) => `Hi baby! 💕

Happy 2nd monthsary ${monthsaryRelative.toLowerCase()}, ${monthsaryDate}! 🥂

And for our next memory, here's my official invitation, mahal ko:

Will you spend ${birthdayRelative.toLowerCase()}, ${birthdayDate}, with me from afternoon to evening?

Since it's your birthday, I planned a full itinerary just for us — from cake decorating, cute photo booth sessions, some private bonding time, to a romantic birthday dinner date at the end of the night.

Walang kailangan mong i-prepare — just bring yourself, your smile, and your heart. Ako na bahala sa lahat. 😘

This is my way of saying: "Mahal na mahal kita, and I'll always find ways to celebrate us — not just today, but every day."

Valentine's may be done, but our memories are forever. Happy birthday in advance, my love! 🎉

Let's make your birthday unforgettable. Are you ready? ❤️

Always yours,
Your Baby 💕`;

export function InvitationMessage({ birthdayDate, birthdayRelative, monthsaryDate, monthsaryRelative }: InvitationMessageProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const invitationText = createInvitationText({ birthdayDate, birthdayRelative, monthsaryDate, monthsaryRelative });

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(invitationText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = invitationText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="my-8 w-full max-w-2xl px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-400 to-pink-500 px-6 py-4 font-bold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Mail size={20} />
          <span>{isOpen ? "Hide" : "💌 View"} Invitation Message</span>
          <Heart size={16} fill="white" />
        </button>

        {/* Message Card */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-4 rounded-2xl bg-[#fffcf5] p-6 md:p-8 shadow-2xl border-2 border-rose-200 relative overflow-hidden"
          >
            {/* Paper texture */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 text-center mb-4">
              <h3 className="text-xl font-bold text-rose-600 font-display">
                💌 Invitation Message
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Copy and send to your special someone 💕
              </p>
            </div>

            {/* Message content */}
            <div className="relative z-10 rounded-xl bg-white/70 p-4 md:p-6 border border-rose-100 shadow-inner text-center">
              <pre className="whitespace-pre-wrap text-sm md:text-base text-gray-700 leading-relaxed font-sans text-center">
                {invitationText}
              </pre>
            </div>

            {/* Copy button */}
            <div className="relative z-10 flex justify-center mt-4">
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 rounded-full px-6 py-2.5 font-bold text-white shadow-md transition-all duration-300 ${
                  copied
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-rose-500 hover:bg-rose-600"
                }`}
              >
                {copied ? (
                  <>
                    <Check size={16} />
                    Copied! 💕
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy Message
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

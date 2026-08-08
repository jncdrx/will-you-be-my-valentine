import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { MapPin, Clock, Heart, ChevronDown, ChevronUp, Cake, Camera, Bed, UtensilsCrossed, Sparkles } from "lucide-react";

interface ItineraryStop {
  time: string;
  title: string;
  icon: React.ReactNode;
  location: string;
  place: string;
  whatToDo: string[];
  romanticNote: string;
  color: string;
}

const stops: ItineraryStop[] = [
  {
    time: "1:30 PM",
    title: "Cake Decorating",
    icon: <Cake size={24} />,
    location: "SM Megamall, Mandaluyong",
    place: "IDIM DIY Bakery (Megamall Branch)",
    whatToDo: [
      "Decorate a celebration cake together — make it as cute or chaotic as you want!",
      "Take cute photos & videos while decorating",
      "Light the candles, make a wish, and celebrate your love story",
      "Keep the cake for later — or bring it to dinner!",
    ],
    romanticNote:
      "\"Every sweet layer we add to this cake is like every sweet memory we've built together. Happy 2nd monthsary, my love — you deserve all the sweetness in the world.\"",
    color: "from-pink-400 to-rose-500",
  },
  {
    time: "3:30 PM",
    title: "Photo Booth Session",
    icon: <Camera size={24} />,
    location: "SM Megamall / The Podium / Robinsons Galleria",
    place: "Korean/Aesthetic Photo Booth (various options nearby)",
    whatToDo: [
      "Take aesthetic couple photos together",
      "Try 1–2 sessions with different poses and cute props!",
      "Go silly, go sweet — just be yourselves",
      "Keep the printed photos as a keepsake of this special day",
    ],
    romanticNote:
      "\"Two months of us — and every moment deserves to be remembered. These photos are proof that we're building something beautiful. Happy 2nd Monthsary, baby.\"",
    color: "from-purple-400 to-fuchsia-500",
  },
  {
    time: "4:30 PM",
    title: "Rest & Private Bonding",
    icon: <Bed size={24} />,
    location: "Ortigas / Pasig / Mandaluyong area",
    place: "Victoria Court Hillcrest / Eurotel Megamall / Go Hotels Ortigas Center",
    whatToDo: [
      "Check in, relax, and unwind after a sweet afternoon",
      "Talk, laugh, share stories — just enjoy being together",
      "Optional: Set up a small candle surprise or sweet ambiance",
      "Take your time — this is YOUR private moment together",
    ],
    romanticNote:
      "\"Sa lahat ng ingay ng mundo, ang pinakamagandang tunog ay 'yung tahimik na sandaling kasama kita — walang ibang mahalaga kundi tayo lang dalawa.\"",
    color: "from-rose-400 to-pink-500",
  },
  {
    time: "7:00 PM",
    title: "Birthday Dinner Date",
    icon: <UtensilsCrossed size={24} />,
    location: "SM Megamall",
    place: "Astons",
    whatToDo: [
      "Have a cozy birthday dinner together",
      "Share food, laughs, and maybe a little dessert",
      "End the day with a sweet, heartfelt moment",
      "Give your birthday + monthsary surprise or mini gift",
    ],
    romanticNote:
      "\"From cake decorating to photo booths, from quiet moments to this dinner — today was all about us and your special day. Mahal na mahal kita, and I'll keep showing up for you, every single day. Happy Birthday and Happy 2nd Monthsary, my love.\"",
    color: "from-amber-400 to-orange-500",
  },
];

export function Itinerary() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="my-8 w-full max-w-2xl px-4 mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="rounded-3xl bg-white/50 p-6 md:p-8 shadow-2xl backdrop-blur-md border border-white/60"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Heart className="mx-auto mb-3 text-rose-500 fill-rose-500 shrink-0" size={36} />
          </motion.div>
          <h2 className="text-2xl md:text-3xl font-bold text-rose-600 font-display flex items-center justify-center gap-2">
            <Heart className="text-rose-500 fill-rose-500 shrink-0" size={24} />
            <span>2nd Monthsary + Birthday Itinerary</span>
            <Heart className="text-rose-500 fill-rose-500 shrink-0" size={24} />
          </h2>
          <p className="mt-2 text-sm text-gray-500 italic flex items-center justify-center gap-1">
            <span>A special Saturday birthday date + monthsary plan for our love story</span>
            <Sparkles size={14} className="text-amber-400 inline shrink-0" />
          </p>
          <p className="mt-1 text-xs text-gray-400 flex items-center justify-center gap-1">
            <MapPin size={12} className="text-rose-500 inline shrink-0" />
            <span>SM Megamall &amp; Ortigas Area</span>
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-pink-300 via-purple-300 to-amber-300 hidden md:block" />

          <div className="space-y-4">
            {stops.map((stop, index) => (
              <ItineraryCard
                key={index}
                stop={stop}
                index={index}
                isExpanded={expandedIndex === index}
                onToggle={() => toggleExpand(index)}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-gray-500 italic flex items-center justify-center gap-1.5">
            <Heart size={14} className="text-rose-500 fill-rose-500 inline shrink-0" />
            <span>Every second with you is a celebration</span>
            <Heart size={14} className="text-rose-500 fill-rose-500 inline shrink-0" />
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

function ItineraryCard({
  stop,
  index,
  isExpanded,
  onToggle,
}: {
  stop: ItineraryStop;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      className="relative"
    >
      {/* Timeline dot */}
      <div className="absolute left-4 top-6 w-4 h-4 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 border-2 border-white shadow-md hidden md:block z-10" />

      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`Toggle details for ${stop.title}`}
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        className="md:ml-14 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-400 rounded-2xl transition-all"
      >
        {/* Stop Card */}
        <div className={`rounded-2xl bg-gradient-to-r ${stop.color} p-[2px] shadow-lg hover:shadow-xl transition-shadow duration-300`}>
          <div className="rounded-2xl bg-white/95 p-4 md:p-5">
            {/* Header row */}
            <div className="flex flex-col items-center text-center gap-2">
              <div className={`flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br ${stop.color} text-white shadow-md`}>
                {stop.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  {stop.title}
                </h3>
                <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mt-0.5">
                  <Clock size={12} className="shrink-0" />
                  <span>{stop.time}</span>
                </div>
              </div>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="min-h-[44px] flex items-center justify-center"
              >
                {isExpanded ? (
                  <ChevronUp size={20} className="text-gray-400" />
                ) : (
                  <ChevronDown size={20} className="text-gray-400" />
                )}
              </motion.div>
            </div>

            {/* Location preview */}
            <div className="mt-2 flex items-center justify-center gap-1 text-xs text-rose-400 text-center font-medium">
              <MapPin size={12} className="shrink-0" />
              <span>{stop.place}</span>
            </div>

            {/* Expanded content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {/* Location */}
                    <div className="mb-3 flex flex-col items-center text-center gap-1">
                      <MapPin size={16} className="text-rose-400 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</p>
                        <p className="text-sm text-gray-700">{stop.location}</p>
                        <p className="text-sm text-rose-500 font-medium">{stop.place}</p>
                      </div>
                    </div>

                    {/* What to do */}
                    <div className="mb-4 text-center">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
                        <Sparkles size={12} className="text-amber-500 inline shrink-0" />
                        <span>What to Do</span>
                      </p>
                      <ul className="space-y-1.5">
                        {stop.whatToDo.map((item, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="text-sm text-gray-700"
                          >
                            {item}
                          </motion.li>
                        ))}
                      </ul>
                    </div>

                    {/* Romantic note */}
                    <div className="rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 p-3 border border-rose-100">
                      <div className="flex flex-col items-center text-center gap-2">
                        <Heart size={14} className="text-rose-400 shrink-0" fill="#fb7185" />
                        <p className="text-sm text-rose-600 italic leading-relaxed font-serif">
                          {stop.romanticNote}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

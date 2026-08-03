const baseUrl = import.meta.env.BASE_URL || "/";
const withBase = (path: string) => `${baseUrl.replace(/\/?$/, "/")}${path.replace(/^\//, "")}`;

export interface MemoryItem {
  id: string;
  src: string;
  caption: string;
  chapterName: string;
}

export interface TimelineEvent {
  month: string;
  date: string;
  title: string;
  description: string;
  iconName: "Sprout" | "Cake" | "Sparkles" | "Utensils" | "Coffee" | "Heart" | "Crown";
  color: string;
}

export const monthsaryConfig = {
  // Names & Titles
  girlfriendName: "my dearest baby angel",
  authorName: "Your Baby",
  monthsaryTitle: "Happy 7th Monthsary, my love, my dearest baby angel",
  shortGreeting: "Seven months of loving you, and my heart still skips a beat every time I see your smile. Happy 7th Monthsary, my love, my sweet baby angel.",
  
  // Dates
  startDate: "2026-01-04",
  monthsary7Date: "2026-08-04",

  // Personal Letter Content
  letterTitle: "To My Dearest Love, My Baby Angel,",
  letterParagraphs: [
    "Happy 7th Monthsary, my love, my dearest baby angel!",
    "Seven months ago, you walked into my life and made every single day brighter, warmer, and infinitely sweeter. Thank you for your endless patience, your cute smiles, your soft laugh, and for being my absolute safe haven.",
    "No matter how busy life gets or how far apart we might be at times, my heart always finds its way back to you, my sweet baby angel. You are my favorite thought in the morning and my peaceful comfort at night.",
    "This website is my little gift to you — a space to hold our memories and remind you how deeply loved you are. I can't wait for all the months, years, and sweet adventures ahead of us, my dearest."
  ],
  letterClosing: "Always and forever yours,\nYour Baby",

  // Secret Easter Egg Note (Unlocked after 7 heart taps)
  secretEasterEggMessage: "You found my hidden secret, my love, my dearest baby angel!\nTapping my heart 7 times proves how observant and sweet you are. I love you more than words, code, or all the stars in the night sky.",

  // Playful Messages Shown While Typing Reply (Affectionate variations)
  playfulTypingMessages: [
    { text: "Are you done yet, my love?", icon: "Clock" },
    { text: "Do you love me, my sweet baby angel?", icon: "Heart" },
    { text: "Are you speechless, my dearest?", icon: "Sparkles" },
    { text: "I'm waiting for your sweet reply, my baby angel.", icon: "Hourglass" },
    { text: "Take your time, my love, my baby angel.", icon: "Smile" },
    { text: "I hope I made you smile today, my sweet baby angel!", icon: "Sun" },
    { text: "Don't leave me hanging, my love!", icon: "HeartHandshake" },
    { text: "Writing a novel for me, my dearest baby angel?", icon: "BookOpen" }
  ],

  // 7th Monthsary Timeline
  timelineEvents: [
    {
      month: "1st Month",
      date: "Feb 4, 2026",
      title: "Our Sweet Beginning",
      description: "Where our love story officially started and my heart found its home.",
      iconName: "Sprout",
      color: "from-rose-400 to-pink-500",
    },
    {
      month: "2nd Month",
      date: "Mar 4, 2026",
      title: "Birthday & Cake Date",
      description: "Decorating celebration cakes together and cozy evening dinner dates.",
      iconName: "Cake",
      color: "from-pink-400 to-purple-500",
    },
    {
      month: "3rd Month",
      date: "Apr 4, 2026",
      title: "Starlit Walks & Smiles",
      description: "Late night conversations and holding hands under the stars.",
      iconName: "Sparkles",
      color: "from-purple-400 to-indigo-500",
    },
    {
      month: "4th Month",
      date: "May 4, 2026",
      title: "Japanese Food & Art Dates",
      description: "Exploring art supply shops and sharing Japanese food together.",
      iconName: "Utensils",
      color: "from-indigo-400 to-rose-500",
    },
    {
      month: "5th Month",
      date: "Jun 4, 2026",
      title: "Coffee Time & Mountains",
      description: "Candid coffee dates, scenic views, and sweet mirror selfies.",
      iconName: "Coffee",
      color: "from-rose-400 to-amber-500",
    },
    {
      month: "6th Month",
      date: "Jul 4, 2026",
      title: "A Promise of Memories",
      description: "Building our date bucket list and looking forward to our next warm hug.",
      iconName: "Heart",
      color: "from-amber-400 to-pink-500",
    },
    {
      month: "7th Month",
      date: "Aug 4, 2026",
      title: "Happy 7th Monthsary!",
      description: "Seven months down, a lifetime of love and happiness to go!",
      iconName: "Crown",
      color: "from-pink-500 to-rose-600",
    },
  ] as TimelineEvent[],

  // Memory Photo Gallery
  memories: [
    {
      id: "m7-1",
      src: withBase("images/first_memories/us1.jpg"),
      caption: "Our beginning, forever special",
      chapterName: "Chapter 1",
    },
    {
      id: "m7-2",
      src: withBase("images/seond_memories/367dff07-ffbb-411d-8f91-b03a57cc49a0.jpg"),
      caption: "A moment I'll always keep close",
      chapterName: "Chapter 2",
    },
    {
      id: "m7-3",
      src: withBase("images/third_memories/couple_watercolor.png"),
      caption: "Our love story in color, sweet and beautiful",
      chapterName: "Chapter 3",
    },
    {
      id: "m7-4",
      src: withBase("images/fourth_memories/couple_selfie.jpg"),
      caption: "Pressed close, warm smiles, and pure happiness",
      chapterName: "Chapter 4",
    },
    {
      id: "m7-5",
      src: withBase("images/fifth_memories/mountain.jpg"),
      caption: "Beautiful skies, but nothing as beautiful as you",
      chapterName: "Chapter 5",
    },
    {
      id: "m7-6",
      src: withBase("images/seond_memories/b3b7a383-87e9-4692-aa0e-b2f189ab8e66.jpg"),
      caption: "My happiest place — right next to you",
      chapterName: "Chapter 6",
    },
  ] as MemoryItem[],
};

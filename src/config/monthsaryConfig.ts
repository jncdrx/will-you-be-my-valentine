const baseUrl = import.meta.env.BASE_URL || "/";
const withBase = (path: string) => `${baseUrl.replace(/\/?$/, "/")}${path.replace(/^\//, "")}`;

export interface MemoryPhoto {
  src: string;
  caption: string;
}

export interface MonthDetail {
  monthIndex: number;
  month: string;
  date: string;
  title: string;
  iconName: "Sprout" | "Cake" | "Sparkles" | "Utensils" | "Coffee" | "Heart" | "Crown";
  color: string;
  letterTitle: string;
  letterBody: string[];
  photos: MemoryPhoto[];
}

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

  // Personal Letter Content for Main Experience
  letterTitle: "To My Dearest Love, My Baby Angel,",
  letterParagraphs: [
    "Happy 7th Monthsary, my love, my dearest baby angel!",
    "Seven months ago, you walked into my life and made every single day brighter, warmer, and infinitely sweeter. Thank you for your endless patience, your cute smiles, your soft laugh, and for being my absolute safe haven.",
    "No matter how busy life gets or how far apart we might be at times, my heart always finds its way back to you, my sweet baby angel. You are my favorite thought in the morning and my peaceful comfort at night.",
    "This website is my little gift to you — a space to hold our memories and remind you how deeply loved you are. I can't wait for all the months, years, and sweet adventures ahead of us, my dearest."
  ],
  letterClosing: "Always and forever yours,\nYour Baby",

  // Secret Easter Egg Note
  secretEasterEggMessage: "You found my hidden secret, my love, my dearest baby angel!\nTapping my heart 7 times proves how observant and sweet you are. I love you more than words, code, or all the stars in the night sky.",

  // Playful Messages Shown While Typing Reply
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

  // Detailed Past Monthsaries Content (Letters, Stories & Photos for Months 1 - 7)
  monthDetails: [
    {
      monthIndex: 0,
      month: "1st Month",
      date: "Feb 4, 2026",
      title: "Our Sweet Beginning",
      iconName: "Sprout",
      color: "from-rose-400 to-pink-500",
      letterTitle: "Month 1: The Beginning of Us 🌸",
      letterBody: [
        "February 4th was the day our love story officially began, my dearest baby angel.",
        "When we first held hands and decided to walk this path together, my heart knew it had found its forever home. Thank you for choosing me and making every single day since then feel like a beautiful dream.",
        "I still remember the butterflies in my stomach and how bright your smile was. You changed my life from day one."
      ],
      photos: [
        { src: withBase("images/first_memories/us1.jpg"), caption: "Our very first photo together — forever special in my heart 💕" },
        { src: withBase("images/first_memories/us2.jpg"), caption: "Warm smiles and happy beginnings 🌸" },
        { src: withBase("images/first_memories/us3.jpg"), caption: "Holding you close on our first dates ✨" },
        { src: withBase("images/first_memories/us4.jpg"), caption: "The sweetest moment of month one 💖" },
      ]
    },
    {
      monthIndex: 1,
      month: "2nd Month",
      date: "Mar 4, 2026",
      title: "Birthday & Cake Date",
      iconName: "Cake",
      color: "from-pink-400 to-purple-500",
      letterTitle: "Month 2: Birthday & Sweet Celebrations 🎂",
      letterBody: [
        "Happy 2nd Monthsary & Birthday, my love!",
        "Celebrating your birthday together was one of the happiest days of my life. Decorating our celebration cake at IDIM DIY Bakery, taking cute Korean photo booth pictures, and having dinner at Astons...",
        "Every sweet layer we added to that cake was like every sweet memory we've built together. You deserve all the happiness in the world!"
      ],
      photos: [
        { src: withBase("images/seond_memories/367dff07-ffbb-411d-8f91-b03a57cc49a0.jpg"), caption: "Decorating our celebration cake together 🎂" },
        { src: withBase("images/seond_memories/36fd68b4-846b-484b-a83c-0f4b5845b726.jpg"), caption: "Korean photo booth memories 📸" },
        { src: withBase("images/seond_memories/4a5d4778-b71c-456e-88fb-94283270d9a6.jpg"), caption: "Candid smiles and cozy bonding 💗" },
        { src: withBase("images/seond_memories/5bf162c1-388a-41cb-9afe-2f39a19ca1c8.jpg"), caption: "Birthday celebration sweets 🍰" },
        { src: withBase("images/seond_memories/b3b7a383-87e9-4692-aa0e-b2f189ab8e66.jpg"), caption: "My favorite place — right next to you 🤍" },
        { src: withBase("images/seond_memories/dc10f935-4701-4f8f-9f8f-07d9b9a4b1d9.jpg"), caption: "Ending your special birthday with endless love 🥂" },
      ]
    },
    {
      monthIndex: 2,
      month: "3rd Month",
      date: "Apr 4, 2026",
      title: "Starlit Walks & Smiles",
      iconName: "Sparkles",
      color: "from-purple-400 to-indigo-500",
      letterTitle: "Month 3: Soft Smiles & Starlit Nights ✨",
      letterBody: [
        "Three months of loving you, my sweet baby angel!",
        "April was filled with late night conversations, sharing milkshakes, taking peaceful evening walks under the stars, and holding your hand.",
        "Every moment with you feels as gentle and colorful as a watercolor painting. I love you more and more every single day."
      ],
      photos: [
        { src: withBase("images/third_memories/cherry_blossom.png"), caption: "Walking under soft cherry blossom trees 🌸" },
        { src: withBase("images/third_memories/couple_watercolor.png"), caption: "Our love story painted in soft watercolor colors 🎨" },
        { src: withBase("images/third_memories/milkshake_share.png"), caption: "Sharing sweet milkshakes and cute laughs 🥤" },
        { src: withBase("images/third_memories/starlit_walk.png"), caption: "Starlit evening walks holding your hand ✨" },
      ]
    },
    {
      monthIndex: 3,
      month: "4th Month",
      date: "May 4, 2026",
      title: "Japanese Food & Art Dates",
      iconName: "Utensils",
      color: "from-indigo-400 to-rose-500",
      letterTitle: "Month 4: Art Supply Shops & Japanese Food 🍣",
      letterBody: [
        "Four months together, my dearest!",
        "May was filled with art supply shop adventures at Arternative, eating delicious Japanese food at Oishidon, taking cute mirror selfies, and enjoying every single bite of food and happiness together.",
        "Seeing you smile while looking at art supplies or tasting food is my absolute favorite sight."
      ],
      photos: [
        { src: withBase("images/fourth_memories/arternative_shop.jpg"), caption: "Exploring art supplies at Arternative shop 🎨" },
        { src: withBase("images/fourth_memories/couple_selfie.jpg"), caption: "Pressed close, warm smiles, and pure happiness 🤳" },
        { src: withBase("images/fourth_memories/japanese_food.jpg"), caption: "Delicious Japanese dinner dates together 🍣" },
        { src: withBase("images/fourth_memories/oishidon_sign.jpg"), caption: "Oishidon food date memories 🥢" },
      ]
    },
    {
      monthIndex: 4,
      month: "5th Month",
      date: "Jun 4, 2026",
      title: "Coffee Time & Mountains",
      iconName: "Coffee",
      color: "from-rose-400 to-amber-500",
      letterTitle: "Month 5: Coffee Days & Mountain Views ☕",
      letterBody: [
        "Five months of pure happiness with you, my baby angel!",
        "June brought cozy coffee dates, scenic mountain views, cute outfit mirror selfies, and peaceful afternoons where time seemed to stop whenever we were together.",
        "No matter where we go, being with you makes every place feel like paradise."
      ],
      photos: [
        { src: withBase("images/fifth_memories/cafe_sign.jpg"), caption: "Cozy cafe time and warm coffee ☕" },
        { src: withBase("images/fifth_memories/coffee_time.jpg"), caption: "Sharing coffee and sweet conversations 💬" },
        { src: withBase("images/fifth_memories/mirror_selfie.jpg"), caption: "Cute couple mirror selfie 🤳" },
        { src: withBase("images/fifth_memories/mountain.jpg"), caption: "Beautiful skies, but nothing as beautiful as you 🏔️" },
      ]
    },
    {
      monthIndex: 5,
      month: "6th Month",
      date: "Jul 4, 2026",
      title: "A Promise of Memories",
      iconName: "Heart",
      color: "from-amber-400 to-pink-500",
      letterTitle: "Month 6: Half a Year of Love 💖",
      letterBody: [
        "Six months of us, my love!",
        "Half a year of building our love story, making date bucket lists, holding each other through every up and down, and promising that no matter what, we'll keep showing up for each other every single day.",
        "Six months down, a lifetime of love to go!"
      ],
      photos: [
        { src: withBase("images/seond_memories/b3b7a383-87e9-4692-aa0e-b2f189ab8e66.jpg"), caption: "Half a year of sweet memories and warm hugs 💞" },
        { src: withBase("images/first_memories/us1.jpg"), caption: "Six months down, building our forever ✨" },
        { src: withBase("images/third_memories/starlit_walk.png"), caption: "Promising a lifetime of holding hands 🤝" },
        { src: withBase("images/fourth_memories/couple_selfie.jpg"), caption: "Your laugh is still my favorite sound in the world 😄" },
      ]
    },
    {
      monthIndex: 6,
      month: "7th Month",
      date: "Aug 4, 2026",
      title: "Happy 7th Monthsary!",
      iconName: "Crown",
      color: "from-pink-500 to-rose-600",
      letterTitle: "Month 7: To My Dearest Love, My Baby Angel 👑",
      letterBody: [
        "Happy 7th Monthsary, my love, my dearest baby angel!",
        "Seven months ago, you walked into my life and made every single day brighter, warmer, and infinitely sweeter. Thank you for your endless patience, your cute smiles, your soft laugh, and for being my absolute safe haven.",
        "No matter how busy life gets or how far apart we might be at times, my heart always finds its way back to you, my sweet baby angel. You are my favorite thought in the morning and my peaceful comfort at night.",
        "This website is my little gift to you — a space to hold our memories and remind you how deeply loved you are. I can't wait for all the months, years, and sweet adventures ahead of us, my dearest."
      ],
      photos: [
        { src: withBase("images/first_memories/us1.jpg"), caption: "Chapter 1: Our Sweet Beginning 🌸" },
        { src: withBase("images/seond_memories/367dff07-ffbb-411d-8f91-b03a57cc49a0.jpg"), caption: "Chapter 2: Birthday & Cake Celebration 🎂" },
        { src: withBase("images/third_memories/couple_watercolor.png"), caption: "Chapter 3: Starlit Walks & Smiles ✨" },
        { src: withBase("images/fourth_memories/couple_selfie.jpg"), caption: "Chapter 4: Art & Japanese Food Date 🍣" },
        { src: withBase("images/fifth_memories/mountain.jpg"), caption: "Chapter 5: Mountain & Coffee Days ☕" },
        { src: withBase("images/seond_memories/b3b7a383-87e9-4692-aa0e-b2f189ab8e66.jpg"), caption: "Chapter 6: Half a Year of Love 💖" },
      ]
    }
  ] as MonthDetail[],

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

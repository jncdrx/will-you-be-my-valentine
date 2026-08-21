import { monthsaryConfig } from "./monthsaryConfig";

export interface AngelFlixItem {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  imageUrl: string;
  category: string;
  date?: string;
  photos?: { src: string; caption: string }[];
  videoUrl?: string;
  tags?: string[];
  isFavorite?: boolean;
}

export const angelflixConfig = {
  brand: {
    name: "ANGELFLIX",
    subtitle: "Our Private Cinema",
    since: "Since 2024",
    tagline: "Every moment matters · Forever yours",
  },
  hero: {
    title: "A Love Worth Remembering",
    tags: ["Romance", "Memories", "Adventures"],
    meta: "Since 2024 · Every moment matters · Forever yours",
    description:
      "A collection of our most precious moments together - first dates, monthsary highlights, trips, laughter, and quiet nights.",
    backdropImage: "/angelflix/hero-banner.png",
    watchButtonText: "Watch Together",
    favoritesButtonText: "Our Favorites",
    loveButtonText: "Made with love",
  },
  recentMemories: [
    {
      id: "rm-1",
      title: "First Date",
      subtitle: "A quiet night that changed everything",
      description:
        "From our very first awkward smile to talking for hours and forgetting about time. The night where my whole world changed.",
      imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
      category: "First Dates",
      date: "Feb 4, 2026",
      tags: ["Beginning", "First Date", "Romantic"],
      photos: monthsaryConfig.monthDetails[0]?.photos || [],
      isFavorite: true,
    },
    {
      id: "rm-2",
      title: "Monthsary Highlights",
      subtitle: "Little moments that add up",
      description:
        "7 months of sweet surprises, cake decorating, silly selfies, and growing deeper in love every single day.",
      imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80",
      category: "Highlights",
      date: "Aug 4, 2026",
      tags: ["Highlights", "7 Months", "Milestone"],
      photos: monthsaryConfig.monthDetails[6]?.photos || [],
      isFavorite: true,
    },
    {
      id: "rm-3",
      title: "Travel Adventures",
      subtitle: "Exploring together",
      description:
        "Sunset views, mountain air, discovering new coffee shops, and exploring the world with my favorite person.",
      imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
      category: "Travel",
      date: "Jun 4, 2026",
      tags: ["Adventures", "Nature", "Mountains"],
      photos: monthsaryConfig.monthDetails[4]?.photos || [],
      isFavorite: true,
    },
    {
      id: "rm-4",
      title: "Funny Moments",
      subtitle: "Laughter is the best memory",
      description:
        "Unfiltered laughter, teasing each other, goofy face photos, and the cute giggles that make everything better.",
      imageUrl: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80",
      category: "Laughs",
      date: "May 4, 2026",
      tags: ["Laughter", "Joy", "Candids"],
      photos: monthsaryConfig.monthDetails[3]?.photos || [],
      isFavorite: false,
    },
    {
      id: "rm-5",
      title: "Sweet Messages",
      subtitle: "Words that stay forever",
      description:
        "Every love note, midnight text, sweet reassuring words, and love letters that keep our hearts connected.",
      imageUrl: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80",
      category: "Letters",
      date: "Apr 4, 2026",
      tags: ["Letters", "Sweet", "Heartfelt"],
      photos: monthsaryConfig.monthDetails[2]?.photos || [],
      isFavorite: true,
    },
    {
      id: "rm-6",
      title: "Our Favorites",
      subtitle: "The ones we replay most",
      description:
        "The memories we replay in our minds over and over because they hold the warmest hugs and sweetest smiles.",
      imageUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
      category: "Favorites",
      date: "Mar 4, 2026",
      tags: ["Favorites", "Warmth", "Love"],
      photos: monthsaryConfig.monthDetails[1]?.photos || [],
      isFavorite: true,
    },
  ] as AngelFlixItem[],
  chapters: monthsaryConfig.monthDetails.map((detail) => ({
    id: `chapter-${detail.monthIndex + 1}`,
    title: `Chapter ${detail.monthIndex + 1}: ${detail.title}`,
    subtitle: detail.month,
    description: detail.letterBody.join(" "),
    imageUrl:
      detail.photos[0]?.src ||
      "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80",
    category: "Chapters of Us",
    date: detail.date,
    photos: detail.photos,
    tags: [detail.month, "Chapter"],
    isFavorite: true,
  })) as AngelFlixItem[],
};

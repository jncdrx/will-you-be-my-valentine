export type Category = 'Monthsaries' | 'Dates' | 'Adventures' | 'Messages' | 'Funny Moments' | 'Special Days';

export interface Memory {
  id: string;
  title: string;
  date: string;
  dateSort: string;
  duration: string;
  durationSec: number;
  category: Category;
  description: string;
  thumbnail: string;
  backdropUrl: string;
  location?: string;
  videoSrc?: string; // 'idb:<id>' for IndexedDB-stored blobs, or a direct URL
}

export const MEMORIES: Memory[] = [];

export const COLLECTIONS = [
  {
    id: 'monthsaries',
    name: 'Our Monthsaries',
    description: 'Every month we\'ve chosen each other.',
    thumbnail: 'https://images.unsplash.com/photo-1556229868-7b2d4b56b909?w=800&h=500&fit=crop&auto=format',
    category: 'Monthsaries' as Category,
  },
  {
    id: 'dates',
    name: 'Our Dates',
    description: 'The ordinary and extraordinary nights together.',
    thumbnail: 'https://images.unsplash.com/photo-1561240055-102e7eaa2961?w=800&h=500&fit=crop&auto=format',
    category: 'Dates' as Category,
  },
  {
    id: 'adventures',
    name: 'Our Adventures',
    description: 'Everywhere we\'ve gone together.',
    thumbnail: 'https://images.unsplash.com/photo-1542460533-50ac46fb13d7?w=800&h=500&fit=crop&auto=format',
    category: 'Adventures' as Category,
  },
  {
    id: 'messages',
    name: 'Messages For You',
    description: 'Things I wanted you to hear from me.',
    thumbnail: 'https://images.unsplash.com/photo-1578660692094-da697dfc1c78?w=800&h=500&fit=crop&auto=format',
    category: 'Messages' as Category,
  },
  {
    id: 'funny',
    name: 'Funny Moments',
    description: "The clips we'll probably never stop laughing at.",
    thumbnail: 'https://images.unsplash.com/photo-1494774157365-9e04c6720e47?w=800&h=500&fit=crop&auto=format',
    category: 'Funny Moments' as Category,
  },
  {
    id: 'special',
    name: 'Special Days',
    description: 'Birthdays, celebrations, surprises, and everything between.',
    thumbnail: 'https://images.unsplash.com/photo-1591969851586-adbbd4accf81?w=800&h=500&fit=crop&auto=format',
    category: 'Special Days' as Category,
  },
];

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

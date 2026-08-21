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

export const MEMORIES: Memory[] = [
  {
    id: '1',
    title: 'Our 7th Monthsary',
    date: 'August 7, 2026',
    dateSort: '2026-08-07',
    duration: '18 min',
    durationSec: 1100,
    category: 'Monthsaries',
    description: 'Another month with you, another collection of little moments I never want to forget. This one is ours forever.',
    thumbnail: 'https://images.unsplash.com/photo-1556229868-7b2d4b56b909?w=640&h=360&fit=crop&auto=format',
    backdropUrl: 'https://images.unsplash.com/photo-1556229868-7b2d4b56b909?w=1440&h=700&fit=crop&auto=format',
    location: 'General Trias, Cavite',
  },
  {
    id: '2',
    title: 'The Night We Got Lost',
    date: 'July 12, 2026',
    dateSort: '2026-07-12',
    duration: '9 min',
    durationSec: 540,
    category: 'Dates',
    description: 'We took the wrong turn and somehow ended up somewhere more beautiful. I\'d get lost with you any night.',
    thumbnail: 'https://images.unsplash.com/photo-1640273296013-e4b54eaf52eb?w=640&h=360&fit=crop&auto=format',
    backdropUrl: 'https://images.unsplash.com/photo-1640273296013-e4b54eaf52eb?w=1440&h=700&fit=crop&auto=format',
  },
  {
    id: '3',
    title: 'Our Little Road Trip',
    date: 'June 5, 2026',
    dateSort: '2026-06-05',
    duration: '24 min',
    durationSec: 1440,
    category: 'Adventures',
    description: 'Windows down, your playlist on, nowhere specific to be. This is what freedom feels like.',
    thumbnail: 'https://images.unsplash.com/photo-1542460533-50ac46fb13d7?w=640&h=360&fit=crop&auto=format',
    backdropUrl: 'https://images.unsplash.com/photo-1542460533-50ac46fb13d7?w=1440&h=700&fit=crop&auto=format',
  },
  {
    id: '4',
    title: 'For You, Angel',
    date: 'May 21, 2026',
    dateSort: '2026-05-21',
    duration: '6 min',
    durationSec: 360,
    category: 'Messages',
    description: 'Some things are easier to say on camera. This one\'s just for you.',
    thumbnail: 'https://images.unsplash.com/photo-1578660692094-da697dfc1c78?w=640&h=360&fit=crop&auto=format',
    backdropUrl: 'https://images.unsplash.com/photo-1578660692094-da697dfc1c78?w=1440&h=700&fit=crop&auto=format',
  },
  {
    id: '5',
    title: 'That Coffee Date',
    date: 'May 8, 2026',
    dateSort: '2026-05-08',
    duration: '14 min',
    durationSec: 840,
    category: 'Dates',
    description: 'Just the two of us, a table by the window, and three hours that felt like twenty minutes.',
    thumbnail: 'https://images.unsplash.com/photo-1561240055-102e7eaa2961?w=640&h=360&fit=crop&auto=format',
    backdropUrl: 'https://images.unsplash.com/photo-1561240055-102e7eaa2961?w=1440&h=700&fit=crop&auto=format',
  },
  {
    id: '6',
    title: "The Day We Couldn't Stop Laughing",
    date: 'April 19, 2026',
    dateSort: '2026-04-19',
    duration: '11 min',
    durationSec: 660,
    category: 'Funny Moments',
    description: 'Still not sure what was so funny. Still laugh every time I watch this.',
    thumbnail: 'https://images.unsplash.com/photo-1494774157365-9e04c6720e47?w=640&h=360&fit=crop&auto=format',
    backdropUrl: 'https://images.unsplash.com/photo-1494774157365-9e04c6720e47?w=1440&h=700&fit=crop&auto=format',
  },
  {
    id: '7',
    title: 'Our First Adventure',
    date: 'March 14, 2026',
    dateSort: '2026-03-14',
    duration: '22 min',
    durationSec: 1320,
    category: 'Adventures',
    description: 'The first of many. You held my hand the whole way and I knew this was just the beginning.',
    thumbnail: 'https://images.unsplash.com/photo-1496433998859-da21e208bd42?w=640&h=360&fit=crop&auto=format',
    backdropUrl: 'https://images.unsplash.com/photo-1496433998859-da21e208bd42?w=1440&h=700&fit=crop&auto=format',
  },
  {
    id: '8',
    title: 'A Random Tuesday With You',
    date: 'March 3, 2026',
    dateSort: '2026-03-03',
    duration: '8 min',
    durationSec: 480,
    category: 'Dates',
    description: 'Nothing planned. Nothing special. Just a Tuesday that turned into one of my favorite memories.',
    thumbnail: 'https://images.unsplash.com/photo-1521033719794-41049d18b8d4?w=640&h=360&fit=crop&auto=format',
    backdropUrl: 'https://images.unsplash.com/photo-1521033719794-41049d18b8d4?w=1440&h=700&fit=crop&auto=format',
  },
  {
    id: '9',
    title: 'Our 6th Monthsary',
    date: 'July 7, 2026',
    dateSort: '2026-07-07',
    duration: '16 min',
    durationSec: 960,
    category: 'Monthsaries',
    description: 'Six months of choosing each other, every single day.',
    thumbnail: 'https://images.unsplash.com/photo-1615966650071-855b15f29ad1?w=640&h=360&fit=crop&auto=format',
    backdropUrl: 'https://images.unsplash.com/photo-1615966650071-855b15f29ad1?w=1440&h=700&fit=crop&auto=format',
    location: 'General Trias, Cavite',
  },
  {
    id: '10',
    title: 'Your Birthday Surprise',
    date: 'February 14, 2026',
    dateSort: '2026-02-14',
    duration: '19 min',
    durationSec: 1140,
    category: 'Special Days',
    description: 'You weren\'t supposed to see this coming. The look on your face was everything.',
    thumbnail: 'https://images.unsplash.com/photo-1591969851586-adbbd4accf81?w=640&h=360&fit=crop&auto=format',
    backdropUrl: 'https://images.unsplash.com/photo-1591969851586-adbbd4accf81?w=1440&h=700&fit=crop&auto=format',
  },
];

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

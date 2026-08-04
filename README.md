# Monthsary Surprise Website for Angel

Welcome to the repository for the romantic, interactive website I built for my girlfriend, Angel. My name is John Cedrix, and I designed and developed this application to celebrate our relationship milestones, shared memories, love letters, and special moments together.

Live Website: https://jncdrx.github.io/will-you-be-my-valentine/

---

## About My Project

I created this application as a personalized digital experience and memory vault for Angel and me. Rather than building a basic static greeting page, I wanted to give her an immersive, step-by-step romantic journey that combines real-time relationship tracking, interactive love letters, Polaroid-style photo galleries, a milestone timeline, a response form for her, and a private administration portal for myself.

This website serves both as a live celebration space for our monthsary milestones and as an ongoing digital keepsake where our past letters, photo memories, date itineraries, and love notes are preserved forever.

---

## Overview of Features and Experience

### 1. Private Authentication Gate
I built a private authentication gate tailored specifically for Angel to open the site. She authenticates with her credentials before unlocking the surprise journey. I set up server-side verification against Supabase site configurations, complete with smooth visual error feedback if wrong credentials are entered.

### 2. Welcome Screen and Live Relationship Counter
Upon entering, Angel sees a personalized greeting alongside a live relationship timer I programmed. The counter dynamically calculates the exact number of days, hours, minutes, and seconds we have spent together from our anniversary start date. I also included a secret note hidden behind a heart icon on this screen.

### 3. Interactive Love Letter Envelope
I designed a love letter section featuring a wax-sealed envelope that opens with realistic animations when clicked. Inside, my personal letter renders line by line with a typewriter effect. I also built a 1-tap canvas exporter so Angel can save the formatted letter directly to her device as a high-resolution image.

### 4. Memory Gallery and Milestone Timeline
The memory section showcases an interactive Polaroid photo carousel I curated with custom captions and lightbox modal image viewing. Accompanying the photo gallery is a chronological milestone timeline I created to document key dates, celebrations, and adventures we have shared throughout our relationship.

### 5. Angel's Interactive Reaction Form
To make the experience interactive and reciprocal, I built a dedicated reaction section where Angel can write her thoughts, feelings, and replies to me. As she types, a playful prompt system I designed displays sweet live messages. She can also attach photos, which are uploaded directly to cloud storage.

### 6. Submission Confirmation and Reply Management
When Angel submits her reply, the page triggers a confetti display and presents a summary card of her response. I programmed a secure response token system so she can return and edit or update her reply whenever she wishes.

### 7. Private Admin Dashboard
I created a protected administration portal for myself accessible via a hidden hash route (`#admin`). Protected by Supabase Auth, this dashboard allows me to read Angel's submitted replies, inspect timestamped records, and download any photos she attaches in real time.

### 8. Past Monthsary Archive and Background Music Player
I added a top navigation bar enabling Angel to explore archives from our past monthsaries, including previous letters, lists of reasons why I love her, date itineraries, and photo collections. I also implemented a persistent background audio player so she can listen to romantic tracks with a custom song selection menu.

---

## Technical Stack and Infrastructure

- Frontend Framework: React 18 with TypeScript 5 and Vite 5
- Styling and Motion: Tailwind CSS 3 and Framer Motion 12
- Icons and UI Components: Lucide React Icons
- Interactive Utilities: Canvas Confetti, HTML2Canvas, Typewriter Effect
- Audio System: Howler.js and Use-Sound
- Backend and Database: Supabase PostgreSQL with Row Level Security (RLS)
- File Storage: Supabase Storage Bucket
- Hosting and Deployment: GitHub Pages via gh-pages static deployment

---

## Project Ownership

This repository and application are custom built exclusively by me, John Cedrix, for my girlfriend Angel.

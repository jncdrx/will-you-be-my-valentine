# Happy 7th Monthsary Surprise Website for Angel 💕

A romantic, interactive step-by-step surprise website built for **Angel** to celebrate our **7th Monthsary**.

Features a step-by-step journey (Welcome Screen with duration counter & secret heart tap Easter egg, envelope Love Letter with image download, Polaroid Memory Carousel with 7-month timeline, Angel's Reaction Form with image uploads & playful typing prompts, and a private Supabase-authenticated Admin view).

---

## 🌟 Key Features

1. **Step-by-Step Romantic Experience**:
   - **Welcome Screen**: "Happy 7th Monthsary, Angel" greeting, live relationship counter, countdown timer, romantic music player, and secret Easter egg note (tap heart 7 times).
   - **Love Letter Section**: Interactive envelope reveal, typewriter effect, customizable placeholders, and 1-tap "Save Letter as Image".
   - **Memories & Photo Gallery**: Interactive photo carousel, 7-month milestone timeline, and Lightbox modal view.
   - **Angel's Reaction Section**: Name input, reply textarea with playful prompt rotator ("Are you done yet?", "Do you love me?", etc.), multi-image reaction upload (JPG, PNG, WEBP, max 5MB), and secure Supabase submission.
   - **Submission Confirmation**: Celebratory confetti, saved reply summary card, and token-authorized edit mode.
   - **Private Admin Dashboard**: Protected view (`#admin`) with Supabase Auth to read, manage, and inspect Angel's submitted replies and photos.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite 5, TypeScript 5, Tailwind CSS 3, Framer Motion 12, Lucide Icons, Canvas Confetti, HTML2Canvas.
- **Backend & Storage**: Supabase PostgreSQL (`monthsary_responses` table) and Supabase Storage (`monthsary-reactions` bucket).
- **Deployment**: Static deployment via GitHub Pages (`gh-pages`).

---

## 🗄️ Supabase Backend Setup

### 1. Database Schema Execution
Navigate to your **Supabase SQL Editor** and run the contents of [`supabase/schema.sql`](file:///e:/Workspace/monthsarry/supabase/schema.sql):

```sql
-- Creates monthsary_responses table, RLS policies, and monthsary-reactions storage bucket
```

### 2. Environment Variables Setup
Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Add your Supabase Project URL and Anon Key:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## 🚀 Local Development & Build Verification

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Lint code
pnpm lint

# Build for production
pnpm build
```

---

## 🌐 Deploy to GitHub Pages

Deploy directly using `gh-pages`:

```bash
pnpm deploy
```

The app will be published to: `https://username.github.io/repository-name/`

---

## 🔒 Security Assurance

- **No Service-Role Keys**: The frontend exclusively uses the public anonymous Supabase key.
- **Row Level Security (RLS)**: Public visitors can only insert a response and read their own response matching their secure `response_token`.
- **Admin Isolation**: Admin dashboard operations require Supabase Auth user credentials.

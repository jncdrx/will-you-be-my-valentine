# AngelFlix Backend & Cloudinary Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a complete Express + Cloudinary backend API and Admin Studio UI for uploading, managing, and streaming romantic videos and photo memories inside AngelFlix.

**Architecture:** Express server integrates Cloudinary v2 SDK for streaming video uploads, automatic mobile/desktop video compression, and poster snapshot generation. Media records are stored in database with resilient local fallback. The Admin Dashboard includes a dedicated "AngelFlix Studio" panel with live progress, and `AngelFlixPlayerModal` supports full HTML5 video playback.

**Tech Stack:** Node.js, Express, Cloudinary SDK v2, Multer, React 18, TypeScript, Tailwind CSS, Framer Motion, Lucide React, Vitest.

## Global Constraints
- Keep Cloudinary secrets securely on the server; client only interacts via authenticated backend API.
- Maintain existing MP3 and YouTube conversion server endpoints intact.
- Seamlessly support both video playback (with scrubber/volume controls) and photo slideshows in `AngelFlixPlayerModal`.
- Full TypeScript typing and 100% passing tests.

---

### Task 1: Environment & Cloudinary Dependencies

**Files:**
- Modify: `package.json`
- Modify: `.env`
- Modify: `.env.local`
- Create: `server/cloudinary.js`

- [ ] **Step 1: Install `cloudinary` dependency in `package.json`**
Add `"cloudinary": "^2.0.1"` to `package.json` and install with `npm install` or `pnpm add cloudinary`.

- [ ] **Step 2: Add Cloudinary credentials to `.env` and `.env.local`**
```env
CLOUDINARY_CLOUD_NAME=et8ihd4g
CLOUDINARY_API_KEY=572471945166596
CLOUDINARY_API_SECRET=yF_DAxW5XIvusgzc1SA1EixLH8k
CLOUDINARY_URL=cloudinary://572471945166596:yF_DAxW5XIvusgzc1SA1EixLH8k@et8ihd4g
```

- [ ] **Step 3: Create `server/cloudinary.js`**
```javascript
// server/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'et8ihd4g',
  api_key: process.env.CLOUDINARY_API_KEY || '572471945166596',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'yF_DAxW5XIvusgzc1SA1EixLH8k',
  secure: true,
});

export default cloudinary;
```

- [ ] **Step 4: Commit**
```bash
git add package.json server/cloudinary.js .env .env.local
git commit -m "chore: configure Cloudinary SDK and environment variables"
```

---

### Task 2: Backend Handlers & REST API Endpoints

**Files:**
- Create: `server/angelflixHandler.js`
- Modify: `server/index.js`
- Test: `server/__tests__/angelflixHandler.test.js`

- [ ] **Step 1: Write test for `server/angelflixHandler.js`**

- [ ] **Step 2: Implement `server/angelflixHandler.js`**
Handle `uploadMedia`, `getMediaList`, `updateMedia`, `deleteMedia` with Cloudinary buffer streaming and database persistence.

- [ ] **Step 3: Register endpoints in `server/index.js`**
```javascript
app.post('/api/angelflix/upload', upload.single('file'), handleAngelFlixUpload);
app.get('/api/angelflix/media', handleGetAngelFlixMedia);
app.patch('/api/angelflix/media/:id', handleUpdateAngelFlixMedia);
app.delete('/api/angelflix/media/:id', handleDeleteAngelFlixMedia);
```

- [ ] **Step 4: Run backend tests to verify endpoints**

- [ ] **Step 5: Commit**
```bash
git add server/angelflixHandler.js server/index.js server/__tests__/angelflixHandler.test.js
git commit -m "feat: add AngelFlix Cloudinary upload and media API endpoints"
```

---

### Task 3: Frontend API Client (`src/lib/angelflixApi.ts`)

**Files:**
- Create: `src/lib/angelflixApi.ts`
- Test: `src/lib/__tests__/angelflixApi.test.ts`

- [ ] **Step 1: Write test for `angelflixApi.ts`**

- [ ] **Step 2: Implement `src/lib/angelflixApi.ts`**
Export functions: `fetchAngelFlixMedia()`, `uploadAngelFlixMedia()`, `updateAngelFlixMedia()`, `deleteAngelFlixMedia()`.

- [ ] **Step 3: Run test to verify it passes**

- [ ] **Step 4: Commit**
```bash
git add src/lib/angelflixApi.ts src/lib/__tests__/angelflixApi.test.ts
git commit -m "feat: add AngelFlix frontend API client"
```

---

### Task 4: Admin AngelFlix Studio Panel (`AdminAngelFlixPanel.tsx`)

**Files:**
- Create: `src/components/admin/AdminAngelFlixPanel.tsx`
- Modify: `src/components/admin/AdminDashboard.tsx`
- Test: `src/components/admin/__tests__/AdminAngelFlixPanel.test.tsx`

- [ ] **Step 1: Write test for `AdminAngelFlixPanel.tsx`**

- [ ] **Step 2: Implement `src/components/admin/AdminAngelFlixPanel.tsx`**
Includes video/photo upload form, live upload progress bar, category selector, description input, and media manager cards with live preview and delete.

- [ ] **Step 3: Update `AdminDashboard.tsx` to include "AngelFlix Studio" tab**

- [ ] **Step 4: Run tests to verify it passes**

- [ ] **Step 5: Commit**
```bash
git add src/components/admin/AdminAngelFlixPanel.tsx src/components/admin/AdminDashboard.tsx src/components/admin/__tests__/AdminAngelFlixPanel.test.tsx
git commit -m "feat: add AdminAngelFlixPanel and integrate into AdminDashboard"
```

---

### Task 5: Video Player & Dynamic AngelFlix UI

**Files:**
- Modify: `src/components/AngelFlixPlayerModal.tsx`
- Modify: `src/components/AngelFlix.tsx`

- [ ] **Step 1: Update `AngelFlixPlayerModal.tsx` with HTML5 Video Player**
Support video playback with controls (play/pause, progress scrubber, volume, loop toggle, and auto-play).

- [ ] **Step 2: Update `AngelFlix.tsx` to dynamically fetch media from API**
Load uploaded Cloudinary videos and display in "Our Videos", "Recent Memories", and "Chapters".

- [ ] **Step 3: Run all unit and component tests**
Run: `npm test`

- [ ] **Step 4: Commit**
```bash
git add src/components/AngelFlixPlayerModal.tsx src/components/AngelFlix.tsx
git commit -m "feat: add video playback and dynamic API media loading to AngelFlix"
```

---

### Task 6: Final Verification & Smoke Testing

- [ ] **Step 1: Run TypeScript type check (`npx tsc --noEmit`)**
- [ ] **Step 2: Run full build (`npm run build`)**
- [ ] **Step 3: Run all test suites (`npm test`)**

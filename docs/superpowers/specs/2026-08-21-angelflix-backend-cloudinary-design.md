# AngelFlix Backend & Cloudinary Storage Design Specification

**Date:** 2026-08-21  
**Status:** Approved  
**Author:** Antigravity  

---

## 1. Overview & Objective
Add a dedicated backend API and Cloudinary media storage system for **AngelFlix**, allowing administrators to upload, store, optimize, and manage romantic videos and photo memories from the Admin Dashboard, which stream directly in the AngelFlix private cinema player.

---

## 2. Architecture & Data Flow

```mermaid
flowchart TD
    A[Admin User / Admin Dashboard] -->|Upload Video / Photo| B[Express Server /api/angelflix/upload]
    B -->|Stream to Cloudinary| C[Cloudinary Media Cloud]
    C -->|Return Optimized Video & Poster URLs| B
    B -->|Save Record| D[(Supabase angelflix_media Table / Memory Fallback)]
    B -->|Success Response| A
    E[AngelFlix Client UI] -->|GET /api/angelflix/media| B
    E -->|Stream Video with Adaptive Bitrate| C
    E -->|Open in Player Modal| F[AngelFlix Cinema Video Player]
```

---

## 3. Backend Endpoints & Cloudinary Integration

### 3.1 Credentials & Environment Variables
- `CLOUDINARY_CLOUD_NAME`: `et8ihd4g`
- `CLOUDINARY_API_KEY`: `572471945166596`
- `CLOUDINARY_API_SECRET`: `yF_DAxW5XIvusgzc1SA1EixLH8k`
- `CLOUDINARY_URL`: `cloudinary://572471945166596:yF_DAxW5XIvusgzc1SA1EixLH8k@et8ihd4g`

### 3.2 Endpoints in `server/angelflixHandler.js` & `server/index.js`
1. **`POST /api/angelflix/upload`** (Admin Protected)
   - Accepts multipart `file`, `title`, `subtitle`, `category`, `description`, `tags`, `is_favorite`.
   - Uploads directly to Cloudinary folder `monthsarry/angelflix`.
   - Generates auto-optimized streaming video URL (`f_auto,q_auto`) and video poster frame thumbnail.
   - Inserts record into database (`angelflix_media`).
2. **`GET /api/angelflix/media`** (Public/Authenticated)
   - Returns all active media items ordered by `created_at DESC`.
3. **`PATCH /api/angelflix/media/:id`** (Admin Protected)
   - Updates title, category, subtitle, description, or favorite status.
4. **`DELETE /api/angelflix/media/:id`** (Admin Protected)
   - Deletes media from Cloudinary via `cloudinary.uploader.destroy` and removes database record.

---

## 4. Frontend & Admin UI Components

### 4.1 Admin Studio Panel (`src/components/admin/AdminAngelFlixPanel.tsx`)
- Integrated as a dedicated tab in `AdminDashboard.tsx`.
- Drag-and-drop video and image uploader with live upload progress percentage.
- Metadata fields: Title, Subtitle, Category (*Recent Memories*, *Our Videos*, *Chapters of Us*, *Our Favorites*), Description, Tags, Favorite switch.
- Media management grid with in-line video playback preview, quick edit, and delete confirmation.

### 4.2 Cinema Player Modal Video Player (`AngelFlixPlayerModal.tsx`)
- Automatically detects `videoUrl` and renders a custom dark HTML5 video player with play/pause, scrub bar, duration time, volume slider, loop toggle, and fullscreen mode.
- Supports smooth fallback to photo slideshows if the item is a photo album.

---

## 5. Verification Strategy
1. Unit tests for server Cloudinary handlers and Supabase fallback mechanisms.
2. Component tests for `AdminAngelFlixPanel.tsx` and updated `AngelFlixPlayerModal.tsx`.
3. End-to-end test verifying media upload -> Cloudinary response -> database insertion -> player rendering.
4. TypeScript validation (`npx tsc --noEmit`) and production build check (`npm run build`).

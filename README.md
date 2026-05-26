# ST BEIP 🎵

A premium, ad-free music streaming platform with audio-reactive visuals, real-time room sync, and a dynamic theme engine.

> **Built with Next.js 15, TypeScript, Tailwind CSS, Zustand, Framer Motion, and Socket.io.**

---

## ✨ Features

### 🎨 Audio-Reactive Edge Lighting
Real-time RGB glow border that wraps the viewport, driven by the Web Audio API. Three modes: **Static Cycle**, **Beat Flicker** (syncs with bass), and **Off**.

### 🌐 Multi-Device Room Sync
Create or join synchronized listening rooms via unique codes. Host actions (play, pause, seek, track change) sync instantly across all peers with latency compensation.

### 🔗 Multi-Device Audio Matrix
If you join a room from two of your own devices, a smart UI lets you route audio: **Device 1**, **Device 2**, or **Both in perfect sync**.

### 🎭 Custom Theme Builder
5 premium themes (Dark, Light, Cyberpunk, AMOLED Black, Minimalist Pastel) plus a full **Custom Theme Creator** with color pickers for every UI element — saved to your browser.

### 🖥️ Desktop Side-Player
Collapsible right-hand vertical panel with album art, controls, progress bar, volume slider, and edge light brightness control. Smooth expand/collapse animation.

### 📱 Mobile Gesture System
Persistent bottom bar on mobile with touch gestures: **swipe right side** for volume, **swipe left side** for edge light brightness. No clutter.

### 🎧 Media Ingestion
Unified service layer supporting **Spotify Web API** (OAuth PKCE, playlists, search) and **YouTube stream resolution** with caching.

---

## 🚀 Deployment

### One-Click Deploy with Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Manual Deployment via GitHub + Vercel

#### 1. Push to GitHub

```bash
# Initialize git
cd st-beip
git init
git add .
git commit -m "Initial commit: ST BEIP music streaming platform"

# Create a repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/st-beip.git
git branch -M main
git push -u origin main
```

#### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign up (free tier)
2. Click **"Add New" → "Project"**
3. Import your `st-beip` GitHub repository
4. Vercel auto-detects Next.js — just click **"Deploy"**
5. Your site is live at `https://st-beip.vercel.app`

---

## 🛠️ Local Development

```bash
# Navigate to the project
cd st-beip

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🏗️ Project Structure

```
st-beip/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Home page
│   │   └── room/[id]/        # Room sync pages
│   ├── components/
│   │   ├── edge-lighting/    # Audio-reactive RGB glow
│   │   ├── layout/           # App shell, side player, mobile player
│   │   ├── player/           # Audio engine, controls
│   │   ├── room/             # Room system, device matrix
│   │   └── theme/            # Theme provider, theme creator
│   ├── lib/
│   │   ├── audio/            # Web Audio API analyser
│   │   ├── hooks/            # Custom React hooks
│   │   ├── room/             # Socket.io client
│   │   ├── services/         # Spotify & YouTube API services
│   │   └── store/            # Zustand state stores
│   └── types/                # TypeScript type definitions
├── tailwind.config.ts
├── next.config.js
├── tsconfig.json
└── package.json
```

---

## 🧩 Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 15** | React framework with App Router |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Utility-first styling |
| **Zustand** | Lightweight state management |
| **Framer Motion** | Hardware-accelerated animations |
| **Socket.io** | Real-time room synchronization |
| **Web Audio API** | Audio frequency analysis |

---

## 📄 License

MIT

# 🌴 TripMate — The Ultimate Trip Operating System (Trip OS)

A production-ready, shared operating system designed for group trips. TripMate combines precision multi-payer expense splitting with UPI settlement deep links, high-res photo/video vault storage, real-time balances, analytics, and timeline stories.

---

## ✨ Key Features

### 1. 💸 Precision Expense Engine & Settlements
- **Split Methods**: Equal splits, Exact ₹ amounts, Custom percentages (%), and Ratio shares.
- **Integer Paise Arithmetic**: All calculations in exact integer paise to prevent floating-point rounding discrepancies.
- **Greedy Debt Simplification**: Reduces complex multi-party debts into the minimum number of direct peer-to-peer transactions.
- **UPI Deep Linking & QR Codes**: Instant 1-tap checkout via Google Pay, PhonePe, and Paytm with auto-generated dynamic UPI payment URIs.
- **Receipt & Bill Attachments**: Attach bill receipts to any expense for instant crew verification.

### 2. 📸 High-Resolution Media Vault
- **Plug-and-Play Cloud Architecture**: Cloudinary & Supabase storage integration supporting photos, live clips, and 4K videos.
- **Original Quality Preservation**: Zero downscaling, direct original quality downloads and ZIP batch downloads.
- **Smart Crew Tagging**: Tag friends in media with multi-avatar badges.
- **Album Organization**: Themed albums (Beach, Food, Stay, Travel, Activities) with preview stack cards.
- **Full-Screen Lightbox**: Slideshow mode, zoom, keyboard arrow navigation, and favorite toggles.

### 3. 👥 Crew Perspective & Dynamic Pulse
- **Instant Perspective Switcher**: Switch active view between any crew member seamlessly to view personal debt balances.
- **Trip Pulse AI Analytics**: Live automated highlights on total burn, top spenders, category distributions, and superlatives (e.g. *Chief Banker*, *Main Character*).
- **Interactive Recharts**: Interactive category pie charts, spending per crew member bar charts, and daily spending velocity graphs.

### 4. 🚀 PWA & Mobile-First Experience
- **Progressive Web App**: Installable to iOS and Android home screens with standalone display mode.
- **Modern Glassmorphic UI**: Dynamic ambient gradient waves, geometric mountain backdrops, and mobile bottom navigation.
- **Offline Reliability & Fast Caching**: Service worker caching and responsive touch targets.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, Server Components & Route Handlers)
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security)
- **Media Storage**: Cloudinary Media API + Supabase Storage
- **Styling**: Tailwind CSS v4, Vanilla CSS Custom Properties, Framer Motion
- **Visuals & Charts**: Recharts, Lucide Icons, Canvas QR Code Generator, Sonner Toasts
- **Deployment**: Docker, Docker Compose, Vercel, Netlify

---

## ⚡ Quickstart & Setup

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd Tripmate
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and fill in your credentials:
```bash
cp .env.example .env.local
```

Key configuration parameters:
```env
NEXT_PUBLIC_SUPABASE_URL=https://mvpamkktglxmbvraowvh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_tk2ghB6HgFt9UWEKfXA9gg_5xLdniQT
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

NEXT_PUBLIC_STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=dgxdwpppt
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 3. Run Migrations & Seed Data
Execute the SQL schema in `supabase/migrations/` on your Supabase SQL editor:
- `supabase/migrations/001_initial_schema.sql`

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker Deployment

To build and run the production container:
```bash
docker-compose up --build -d
```

---

## 🧪 Running Settlement Tests
The pure algorithmic settlement engine and currency mathematics have automated unit tests:
```bash
npx tsx lib/settlement/engine.test.ts
```

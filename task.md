# TripMate Overhaul — Master Task & Feature Log

Last Updated: 2026-09-15

---

## 🟢 PHASE 1: CORE MANUAL FUNCTIONALITY (COMPLETED)

### Phase A: Build & Deployment Fixes
- [x] Removed incompatible `next-pwa` dependency from `package.json`
- [x] Stripped `withPWA` wrapper from `next.config.ts` for Next.js 16 + Turbopack compatibility
- [x] Verified clean production build (`npm run build` exits with code 0)

### Phase B: Safe Additive Database Migrations
- [x] `002_itemized_splits.sql`: Created `expense_items`, `expense_item_assignments`, and `expense_participants` tables; added GST and itemized fields to `expenses`
- [x] `003_payment_states.sql`: Added payment proof upload and status fields (`pending`, `proof_submitted`, `verified`, `rejected`) to `settlements`
- [x] `004_member_soft_deletion.sql`: Added `is_active` column to `members` table for soft member deletion

### Phase C: Design System & Neumorphic Dual-Theme
- [x] Modernized `app/globals.css` with semantic CSS variables (`--background: #eef2f7`, `--accent: #2b56ff`)
- [x] Dual-shadow neumorphic extrusions (`-8px -8px 16px #ffffff` highlight + `8px 8px 18px #c3cbd7` dark shadow)
- [x] Light & Dark mode support via `data-theme` attribute and `ThemeScript` in `layout.tsx`

### Phase D: UI Component Library
- [x] `Card.tsx` (Raised, Inset, Glass variants)
- [x] `Button.tsx` (Tactile button, Gradient button, Icon button)
- [x] `Badge.tsx` (Status badges for pending, settled, partial, rejected)
- [x] `Avatar.tsx` (Member avatars with background colors and initials fallback)
- [x] `BottomSheet.tsx` (Touch-friendly mobile modal bottom sheet)
- [x] `ProgressBar.tsx` (Financial settlement & budget progress tracks)

### Phase E: UI Page Redesigns
- [x] `TripHeader.tsx`: Polished responsive header, mobile logo, tactile member selector dropdown
- [x] `BottomNav.tsx`: Neumorphic bottom navigation bar with active state indicators
- [x] `Sidebar.tsx`: Desktop sidebar with trip switcher and navigation
- [x] Home / Dashboard (`/trip/[slug]`): Hero balance widget, quick action buttons, recent bills, memories grid
- [x] Money Hub (`/trip/[slug]/money`): Expense filters, itemized split preview, balance breakdown
- [x] People (`/trip/[slug]/people`): Member directory, inline UPI ID editor, member deletion with dues check, UPI QR code modal
- [x] Memories (`/trip/[slug]/memories`): Media gallery, album organization, media viewer
- [x] Analytics (`/trip/[slug]/analytics`): Category pie charts, daily spending curves, top spender breakdown (Neumorphic Light & Dark)
- [x] Settings (`/trip/[slug]/settings`): Theme switcher (System/Dark/Light), QR invite generator
- [x] Landing Page (`app/page.tsx`): Feature showcases, active trips list, trip creator CTA
- [x] Create Trip (`app/create/page.tsx`): Step-by-step trip setup wizard

### Phase F: Expense & Split Engine
- [x] `ItemizedSplitEditor.tsx`: Add line-items, set quantities, unit prices, assign specific members per item, stepper buttons (- / +)
- [x] `ExpenseFormModal.tsx`: Supports Equal, Exact, Percentage, Shares, and Itemized splits
- [x] GST Engine (`lib/currency/index.ts`): Proportional GST attribution (inclusive/exclusive) with exact integer paise reconciliation
- [x] Expenses API (`/api/expenses`): Complete CRUD support for line-items and item assignments

### Phase G: Payment & Individual Debt Settlement
- [x] `PaymentCard.tsx`: Individual pairwise debt card with member avatars, amount, and direct Settle trigger
- [x] `SmartSettlePanel.tsx`: Debt simplification panel with options to settle individual debts or run full group settlement
- [x] `SettleUpModal.tsx`: UPI deep-link generation, QR code rendering, custom amount input, payment proof upload
- [x] Settlements API (`/api/settlements`): Status logging and payment proof storage

### Phase H: Member Removal Safeguards & UPI Management
- [x] Dues Check: Automatically checks net balance before removal and blocks deletion if outstanding dues > 0 with exact error details.
- [x] Soft Deactivation: Sets `is_active = false` so historical expense records and photo attributions are preserved.
- [x] Member UPI ID & QR Code Modal (`MemberQrModal.tsx`): Edit UPI ID for any member at any time and view/share personal member UPI QR codes.

---

## 🔵 PHASE 2: AI & OCR ENHANCEMENTS (COMPLETED / VERCEL-READY)

- [x] Tesseract.js AI Receipt OCR Scanner (`lib/ai/ocrScanner.ts`, `BillOcrModal.tsx`): Upload or capture bill images to automatically extract merchant, subtotal, GST, and line items with interactive review screen.
- [x] Natural Language Item Parser (`lib/ai/itemParser.ts`): Parses inputs like "Ved ate a dosa for 170 and coffee 40. Bro ate a dosa and tea 20."
- [x] AI Item Assistant Modal (`BillAiPromptModal.tsx`): Interactive review & accept workflow for natural language bill entry. 100% Vercel-ready!
- [x] Payment Proof Upload & UPI Verification Workflow: Upload screenshot proof with user review before marking settled.

---

## 📌 Maintenance & Next Steps for Next Developer / Session
1. **Apply Supabase Migration Scripts**:
   Run `supabase/migrations/002_itemized_splits.sql`, `003_payment_states.sql`, and `004_member_soft_deletion.sql` in Supabase SQL Editor.
2. **Deploy to Vercel**:
   Push main branch to GitHub or run `vercel --prod`.

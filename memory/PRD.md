# DMS — Home Meals Mobile View (Feature Addition)

## Problem Statement
Repo: https://github.com/ashakuteer/DMS (NGO Donor Management System — Next.js 14 + NestJS + Prisma + PostgreSQL).

User explicitly requested:
- Keep existing stack, backend, database and core logic **unchanged**.
- Build a **new mobile-first "Home Meals View"** page for `HOME_INCHARGE` users.
- Path: `/dashboard/meals/mobile-view`
- Purpose: Kitchen in-charge simply opens mobile and sees *"What to prepare today"*.
- Read-only for donor data; two light-touch actions allowed:
  - Mark meal **Prepared / Served**
  - Mark **Donor Visited**
- No editing of donor data, no donor add.
- Big readable cards, very fast loading, clean and practical.
- Add a **"📱 Home Meals View"** button on the Meals dashboard that opens this page.

## Architecture (unchanged)
- Frontend: Next.js 14 (App Router) @ `apps/web`
- Backend: NestJS (untouched) @ `apps/api`
- DB: PostgreSQL via Prisma (untouched)

## What was implemented (Apr 22, 2026)
- **New page** `apps/web/src/app/(dashboard)/dashboard/meals/mobile-view/page.tsx`:
  - Mobile-first (`max-w-xl mx-auto`), zero clutter, sticky header with back/refresh/logout.
  - Fetches today's meals via existing `GET /api/meals?mealServiceDate=...` endpoint.
  - Auto-polls every 60s + refetch on focus for near-live kitchen usage.
  - Groups cards by **Breakfast / Lunch / Snacks / Dinner** (one card per slot-to-prepare).
  - Each card shows: donor name, **Call** pill (tel: link) using existing phone, **VEG / NON-VEG** badge with icon, slot chip, prepared status, donor-visit status, occasion, **Menu** chips, **Special Menu**, **Notes**.
  - Actions: **Mark Prepared** (PATCH `/api/meals/:id/post-meal` with `mealCompleted`), **Donor Visited** (PATCH with `donorVisited: true`) — identical contract to existing `today-mobile`.
  - No donor edit, no meal edit, no CRUD, no sidebar.
  - All interactive elements have `data-testid`s.
- **Layout update** `apps/web/src/app/(dashboard)/layout.tsx`: Added `/dashboard/meals/mobile-view` to the `HOME_INCHARGE` allowed-prefix list so the role guard doesn't redirect away.
- **Meals dashboard header** `apps/web/src/app/(dashboard)/dashboard/meals/page.tsx`: Added new outlined button **"📱 Home Meals View"** (testid `button-home-meals-view`) next to the existing "Mobile View" / "Add Meal Sponsorship" buttons.
- **Today-mobile header** added a small 📱 toggle button so HOME_INCHARGE users can hop into the simplified view.

## Backend / DB / Core logic
- Not touched. Zero schema or controller changes.
- Re-uses only the existing endpoints listed above.

## Verification
- `npx tsc --noEmit` in `apps/web` passes with **zero TypeScript errors** after the changes.
- Preview cannot be run inside Emergent (Next.js + NestJS + PostgreSQL stack, not the managed React + FastAPI + Mongo stack) — user explicitly accepted this constraint.

## Files changed
- NEW  `apps/web/src/app/(dashboard)/dashboard/meals/mobile-view/page.tsx`
- MOD  `apps/web/src/app/(dashboard)/layout.tsx`
- MOD  `apps/web/src/app/(dashboard)/dashboard/meals/page.tsx`
- MOD  `apps/web/src/app/(dashboard)/dashboard/meals/today-mobile/page.tsx`

## Backlog / Next Action Items
- [P1] Optional: add i18n strings (English/Hindi/Telugu) to match the rest of the app (`apps/web/src/locales/*`). Currently English-only, matching today-mobile.
- [P2] Optional: pull-to-refresh gesture on the body for even faster UX.
- [P2] Optional: offline cache with a service worker so kitchen staff see yesterday's cached data if Wi-Fi drops.
- [P2] Optional: add a "Tomorrow" quick-peek at the bottom so staff can pre-plan prep.

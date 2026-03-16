# Workspace

## Overview

NGO Donor Hub — full management system for an NGO managing homes for underprivileged people. Features donor management with photo upload, donation tracking, beneficiary management, sponsorships, communications, reports, and the Time Machine module for impact stories.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/donor-hub) at previewPath `/`
- **API framework**: Express 5 (artifacts/api-server) at `/api`
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Storage**: Supabase Storage (bucket: `ngo-donor-hub`)
- **File uploads**: multer (memory storage) + Supabase client

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   │   └── src/
│   │       ├── lib/supabase.ts   # Supabase storage helper
│   │       └── routes/           # Route handlers per module
│   └── donor-hub/          # React + Vite frontend
│       └── src/
│           ├── pages/           # All pages (dashboard, donors, etc.)
│           ├── components/      # layout, theme-toggle, UI components
│           └── hooks/           # use-uploads.ts for photo uploads
├── lib/
│   ├── api-spec/openapi.yaml    # Full OpenAPI contract
│   ├── api-client-react/        # Generated React Query hooks
│   ├── api-zod/                 # Generated Zod schemas
│   └── db/src/schema/           # Drizzle table definitions
└── scripts/
```

## Database Tables

- `donors` — name, email, phone, address, city, country, donorType, status, photoUrl, notes
- `donations` — donorId, amount, currency, donationDate, paymentMethod, purpose, receiptNumber, notes
- `beneficiaries` — name, dateOfBirth, gender, home, admissionDate, status, photoUrl, medicalInfo, educationInfo, notes
- `sponsorships` — donorId, beneficiaryId, startDate, endDate, monthlyAmount, currency, status, notes
- `communications` — donorId, subject, body, type, sentAt
- `time_machine` — title, description, category, home, eventDate, photos[] (array of URLs)

## Supabase Storage

- Bucket: `ngo-donor-hub` (auto-created on first upload)
- Folders: `donors/`, `beneficiaries/`, `timemachine/`
- Upload helper: `artifacts/api-server/src/lib/supabase.ts`
- Photo upload endpoints:
  - `POST /api/donors/:id/photo` (field: `photo`)
  - `POST /api/beneficiaries/:id/photo` (field: `photo`)
  - `POST /api/timemachine/:id/photos` (field: `photos`, multiple)

## API Modules

- Donors: CRUD + photo upload
- Donations: CRUD
- Beneficiaries: CRUD + photo upload
- Sponsorships: CRUD
- Reports: summary stats
- Communications: CRUD
- Time Machine: CRUD + multi-photo upload

## Time Machine Categories

- Success Story, Inspiring Story, Recognition, Donor Support, Event by Kids, Visitor Visit, Challenge / Problem, General Update

## Time Machine Homes

- All Homes, Girls Home - Uppal, Blind Home - Begumpet, Old Age Home - Peerzadiguda

## TypeScript & Composite Projects

- `lib/*` packages are composite and emit declarations via `tsc --build`
- `artifacts/*` are leaf packages checked with `tsc --noEmit`
- Root `tsconfig.json` is a solution file for libs only

## Key Commands

- `pnpm --filter @workspace/api-spec run codegen` — regenerate API types after spec changes
- `pnpm --filter @workspace/db run push` — push schema changes to DB
- `pnpm --filter @workspace/api-server run dev` — run API server
- `pnpm --filter @workspace/donor-hub run dev` — run frontend

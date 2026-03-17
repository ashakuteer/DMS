# NGO Donor Management System

## Overview

This project is a comprehensive donor management system for NGOs, designed to streamline the tracking of donors, donations, and beneficiaries. It provides a robust platform for fundraising, financial reporting, and donor engagement, incorporating features like role-based access control, detailed audit logging, and AI-powered insights. The system supports various donor categories, donation types, and payment modes, with automated receipt generation and email delivery. The business vision is to empower non-profits with a scalable and secure tool to efficiently manage their operations, enhance donor relationships, and maximize their impact.

## User Preferences

No specific user preferences were provided in the original document.

## System Architecture

The project is structured as a monorepo with a Next.js 14 frontend and a NestJS backend. A shared package centralizes TypeScript types and enums. PostgreSQL is used as the database, managed by Prisma ORM. Authentication is handled via JWT and refresh tokens, implementing Role-Based Access Control (RBAC) with 7 distinct roles (ADMIN, STAFF, TELECALLER, ACCOUNTANT, MANAGER, CARETAKER, VIEWER).

**UI/UX Decisions:**
The frontend uses Next.js 14 with the App Router and Tailwind CSS. Recharts is used for data visualization. Donation receipts are generated as professional PDF documents. Email and PDF templates are text-based.

**UI Theme (Orange NGO Design):**
- Primary accent color: Orange (`#f97316` / `hsl(25 95% 53%)`) — used for CTA buttons, active nav, highlight cards, hero backgrounds
- Sidebar: Light white/off-white (`hsl(210 40% 98%)`) with dark text, orange active pills (shadow-sm), collapsible labeled groups, orange group headings when a child is active
- Login page: Two-column hero layout — left side orange gradient with brand text + feature list, right side clean white login card
- Dashboard: Dark blue gradient hero (no action buttons), 8 KPI cards in 2 rows, Quick Actions row (4 cards below KPI), Donation Analytics (line + pie), Home-wise Performance cards, Donor Intelligence + Smart Insights, Follow-ups Due, Next Best Actions, Recent Activity. Data fetched unconditionally via `safeFetch` — no role gating at fetch level, backend enforces 403.
- Dark mode: Dark backgrounds (`gray-900/gray-800`) with same orange accent maintained
- CSS variables in `globals.css` — all shadcn components (buttons, badges, rings) inherit orange automatically

**Technical Implementations:**
- **Monorepo:** Organizes frontend, backend, and shared code.
- **API Proxy:** Next.js rewrites proxy requests to the NestJS backend to prevent CORS issues.
- **Database Schema:** Includes models for User, Donor, Donation, Pledge, Campaign, and Beneficiary, with soft delete.
- **Authentication & Authorization:** JWT-based authentication with refresh tokens and strict RBAC across frontend and backend. Admin-configurable permission matrix with database-backed RolePermission model, in-memory caching, and default permission seeding. Sensitive data (donor contacts, beneficiary health) masked unless user has `viewSensitive` permission. Permission management UI at `/dashboard/permissions`. Backend: `apps/api/src/role-permissions/` module. Frontend: `apps/web/src/lib/permissions.ts`, `apps/web/src/lib/permission-provider.tsx`.
- **Audit Logging:** Logs critical actions for security and compliance, including PERMISSION_CHANGE and SENSITIVE_DATA_ACCESS events.
- **Reporting:** Comprehensive reporting functionalities with export options.
- **AI-Powered Insights:** Provides role-specific insights (MoM change, donation concentration, next best action, follow-up donors, best call time) and smart summaries on donor profiles, enforcing backend RBAC. Enhanced Relationship Health Score (0-100) factoring in last donation date, special day acknowledgment, overdue reminders, last contact recency (from communication logs), and pending pledge status. Four actionable insight cards on dashboard: Follow-up Needed (donors not contacted in 30+ days), High Value Donors (top 10% by FY donations), Dormant Donors (no donation in 180+ days), and Pledges Due This Week. Daily 5AM cron recalculates all health scores. Backend: `apps/api/src/health-score/` module, `GET /api/dashboard/insight-cards`. Frontend: insight cards grid on `/dashboard`.
- **Donor Management:** CRUD operations for donors with extensive profiles, auto-generated codes, and family/special day tracking.
- **Donation Management:** Records diverse donation types, generates receipts, and handles email delivery. Supports assigning donations to specific homes.
- **Pledge Tracking:** Manages future donations with status tracking and automatic reminders.
- **Donor Follow-up Reminders:** Staff follow-up tracking system with custom notes, due dates, priority levels, and status.
- **Campaign Management:** Comprehensive fundraising campaign management with goals, timelines, progress tracking, beneficiary/home association, photo/update uploads, donor lists, and performance dashboards.
- **Beneficiary Management:** Comprehensive module for tracking individuals, including personal details, home assignment, education/health notes, and privacy protection. Photos stored in Supabase Storage.
    - **Sponsorships:** Links donors to beneficiaries with various types, amounts, frequencies, and status tracking. Includes payment automation, reminder emails, and updates.
    - **Beneficiary Updates:** Staff can post progress reports and share with sponsors.
    - **Timeline Events:** Automated milestone tracking for beneficiary activities.
    - **Health & Growth Tracking:** Quarterly height/weight metrics and health event logging.
    - **Academic Progress Cards:** Term-wise academic tracking.
    - **Documents Vault:** Secure document storage with RBAC and donor sharing controls.
- **Dashboard:** Displays key statistics, trends, payment distribution, top donors, and recent donations. Two-phase loading: fast core queries (stats, trends, insights) unblock the spinner first; heavy analytics (impact, retention) load in the background and populate sections without re-triggering the loading spinner. All dashboard services have 5-minute in-memory TTL caches (trends, impact, retention, insights, actions). Dashboard query performance: trends uses 12 parallel queries (was sequential); impact uses a fully parallel batch (was 12 sequential rounds of 4 queries each = 48 serial round-trips); retention uses DB-level `groupBy` aggregation instead of loading all donors+donations into Node.js memory.
- **Communication Features:** WhatsApp quick-send, email composer with templates, and a communication log.
- **Auto Reminders Engine:** Automated generation of reminders for special days and pledges via daily cron jobs.
- **Daily Actions Inbox:** Centralized dashboard for upcoming special days, follow-ups, pledges, and sponsorships due.
- **Sponsor Birthday Wishes:** Personalized birthday wish system for donors with privacy-safe beneficiary photo selection and customizable templates.
- **Duplicate Donors Detection & Merge:** Admin-only tool to detect and merge duplicate donor profiles.
- **Email Queue Management:** Automated email queue system with retry logic and admin-configurable SMTP settings.
- **Analytics Dashboard:** Admin-only board-ready donor engagement analytics with KPIs, charts, and donor segments.
- **Donation Auto-Communication:** Automatic donor communication on donation success with configurable toggles for email and WhatsApp (via Twilio Content API).
- **WhatsApp Template Key Mapping:** Abstracted WhatsApp template system mapping 4 template keys (DONATION_THANK_YOU, PLEDGE_DUE, SPECIAL_DAY_WISH, FOLLOWUP_REMINDER) to Twilio Content SID environment variables. Shared `normalizeToE164()` phone utility in `apps/api/src/common/phone-utils.ts`. Admin-configurable toggles for each automation type (donation, pledge, special day, follow-up). Auto-WhatsApp triggers on special day reminders (offset=0) and donation creation. Backend: `apps/api/src/communications/` module with `sendByTemplateKey()` method. API endpoints: `POST /api/communications/whatsapp/send-by-key`, `GET /api/communications/whatsapp/templates`. Frontend settings: `/dashboard/settings/donation-notifications`.
- **Data Backup & Restore:** Admin-only feature for full database backup and restore as downloadable JSON ZIP files.
- **Manual Donor Updates:** Staff/Admin can create and send general organizational updates to selected donors via email or WhatsApp.
- **Donor Reports:** Admin-only quarterly/annual/custom donor report generation with data aggregation, PDF/Excel export, and email sharing.
- **Home-wise Monthly Summary Reports:** Per-home monthly aggregation of beneficiary counts, health, education, and movement, exportable as PDF or Excel.
- **Beneficiary Progress Reports:** Comprehensive progress report generator combining health events, growth, academic progress, and updates into a single sharable PDF per beneficiary.
- **Global Smart Search:** Single search functionality across Donors, Beneficiaries, Donations, and Campaigns with entity tabs, filter panels (date range, amount, donation type, home), saved filters, and recent searches. Frontend: `apps/web/src/components/global-search.tsx`. Backend: `GET /api/search`.
- **Sponsor Engagement Timeline:** Unified timeline of all donor interactions (donations, messages, birthday wishes, visits, follow-ups, pledges, sponsorships) inside the donor profile, with date range and activity type filters, pagination, and type-specific icons/badges. Backend endpoint: `GET /api/donors/:id/timeline`.
- **NGO Document Vault:** Secure document management for NGO certificates, compliance documents, MOUs, and other organizational files. Features: upload/categorize documents (8 categories), role-based access (ADMIN full, STAFF view/upload), expiry date tracking with daily cron reminders, version history with change notes, download functionality, access audit log (ADMIN-only). Files stored locally in `uploads/ngo-documents/`. Backend: `apps/api/src/ngo-documents/` module. Frontend: `/dashboard/ngo-documents`.
- **Impact Dashboard:** Organizational KPI dashboard showing beneficiary counts, donor/sponsor statistics, 12-month growth trends, home-wise metrics with donation aggregation. Backend: `GET /api/dashboard/impact`. Frontend: `/dashboard/impact`. Access: ADMIN, STAFF, MANAGER.
- **Donor Retention Analytics:** Tracks repeat donors, identifies lapsed supporters (6+ months inactive), monitors retention percentage over time. Features: 4 KPI cards (repeat donors, one-time donors, lapsed donors, active donors), retention rate area chart, donor segments pie chart, monthly new vs returning donors bar chart, tabbed repeat/lapsed donor tables with CSV export. Backend: `GET /api/dashboard/retention`. Frontend: `/dashboard/retention`. Access: ADMIN, STAFF, MANAGER.
- **NGO Branding & Template Management:** Customizable organization branding applied to all PDFs, receipts, and reports. Features: brand color picker (hex), logo upload (PNG/JPEG/WebP/SVG, 5MB max), signature image upload (PNG/JPEG/WebP, 2MB max), custom report header/footer text. Shared PDF branding helper (`apps/api/src/common/pdf-branding.ts`) provides standardized `addPdfHeader`, `addPdfFooter`, `addReceiptBranding`, `addReceiptFooterBranding`, and `addPdfWatermark` functions used by all 6 PDF services (receipt, analytics, home-summary, donor-reports, beneficiary-progress-reports, reports). Logo/signature files stored in `uploads/organization/`. Upload endpoints: `POST /api/organization-profile/upload-logo`, `POST /api/organization-profile/upload-signature`. Frontend: `/dashboard/settings/organization` with live branding preview card.
- **Staff Task Management:** Complete task assignment and tracking system for staff members. Features: StaffTask model with status (TODO/IN_PROGRESS/REVIEW/DONE/CANCELLED), priority (LOW/MEDIUM/HIGH/URGENT), category (FOLLOW_UP/DATA_ENTRY/CALL/REPORT/VISIT/OTHER). RBAC: ADMIN/MANAGER full access; STAFF/TELECALLER limited to assigned tasks. 11 API endpoints including Kanban board view, performance scoring, and task statistics. Frontend: Kanban board with drag-and-drop status changes, staff list with task counts, performance analytics dashboard with scoring formula (Base 50% + OnTime 30% - Overdue 20% + follow-ups 10% + donor responses 10%). Backend: `apps/api/src/staff-tasks/` module. Frontend: `/dashboard/staff-tasks`.
- **Donor Engagement Tracking:** Three-tier engagement classification (HOT/WARM/COLD) on donor profiles. Color-coded badges displayed on donor list and follow-ups pages. Engagement filter on both donors and follow-ups pages. Quick actions for WhatsApp and phone contact on follow-ups. Today's summary card showing due, overdue, and completed follow-ups. Backend: `engagementLevel` field on Donor model (DonorEngagement enum). Frontend: integrated into `/dashboard/donors` and `/dashboard/follow-ups`.
- **Broadcasting:** Targeted donor communication tool for sending WhatsApp (via Twilio Content API) or Email broadcasts to filtered donor groups. Features: multi-filter audience builder (gender, category, city, religion, engagement level, donation frequency, assigned staff, support preferences, age range), real-time audience preview with reachable/unreachable counts, WhatsApp template selection, custom email composition with variable substitution ({{donorName}}, {{date}}), batch sending with per-donor status tracking, audit logging (BROADCAST_SENT). Access: ADMIN, MANAGER. Backend: `apps/api/src/broadcasting/` module. API endpoints: `POST /api/broadcasting/preview`, `POST /api/broadcasting/send`, `GET /api/broadcasting/whatsapp-templates`, `GET /api/broadcasting/email-templates`, `GET /api/broadcasting/staff-list`. Frontend: `/dashboard/broadcasting`.
- **UX Improvements:** Loading skeletons on Dashboard, Donors, and Donations pages replacing simple spinners. Error states with retry buttons. Contextual empty states with icons and descriptions. Enhanced information density in follow-ups table view.

## External Dependencies

- **Frontend Framework:** Next.js 14
- **Styling:** Tailwind CSS
- **Charting Library:** Recharts
- **Backend Framework:** NestJS
- **Database:** PostgreSQL
- **ORM:** Prisma
- **PDF Generation:** pdfkit
- **Email Sending:** nodemailer
- **Excel Export:** exceljs
- **Authentication:** JWT
- **Cloud Storage:** Supabase Storage (for beneficiary photos)

## Replit Migration Notes

This project was migrated to Replit from a pnpm monorepo setup. Key changes made:

- **Startup Script (`start.sh`):** Because `package.json` specifies `pnpm@10.30.3` (unavailable on Replit), a custom `start.sh` uses `npm install --legacy-peer-deps` to install dependencies for each workspace separately.
- **Port Configuration:** Replit sets `PORT=5000` globally. NestJS API uses `API_PORT=3001` (set in `.replit` `[userenv.shared]`) to avoid conflict. `main.ts` now checks `API_PORT` first. Next.js explicitly binds to port 5000.
- **API Proxy:** `next.config.js` rewrites `/api/*` to `http://localhost:3001` (via `NEXT_PUBLIC_API_URL` env var set in `.replit`).
- **Shared Package:** `@ngo-donor/shared` uses pnpm `workspace:*` protocol which npm doesn't support. Removed from `apps/web/package.json` since it is not used in the web frontend.
- **CORS:** NestJS API allows all `*.replit.dev`, `*.repl.co`, and `*.replit.app` origins.
- **Database:** PostgreSQL Replit database, schema synced via `prisma db push` in startup script.
- **Supabase Storage:** Optional; file uploads will be unavailable unless `SUPABASE_URL` and `SUPABASE_KEY` are set as environment variables. `StorageService` gracefully handles missing credentials.
- **Beneficiary Detail Page Fix:** `apps/web/src/app/(dashboard)/dashboard/beneficiaries/[id]/hooks/useBeneficiary.ts` was created (the file previously existed as 1 byte / empty, and `page.tsx` imported from a non-existent path). The hook now extracts all state and handlers from `pageback.tsx` (the reference implementation). `page.tsx` was also corrected to pass individual props to `BeneficiaryHeader` (previously passed an `actions` object) and to pass all required props to each tab component and dialog component.
# NGO Donor Management System

A production-ready monorepo for managing NGO donors, donations, and beneficiaries.

<!-- Last updated: 2026-03-14 -->

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: NestJS + TypeScript (REST API)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: JWT + Refresh Tokens + RBAC (Admin, Staff, Telecaller, Accountant)

## Project Structure

```
├── apps/
│   ├── api/          # NestJS backend
│   │   ├── prisma/   # Prisma schema and migrations
│   │   └── src/      # NestJS source code
│   └── web/          # Next.js frontend
│       └── src/      # Next.js source code
├── packages/
│   └── shared/       # Shared types and utilities
└── README.md
```

## Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- PostgreSQL database

## Getting Started

### 1. Install Dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install
```

### 2. Set Up Environment Variables

Copy the example environment files:

```bash
# For the API
cp apps/api/.env.example apps/api/.env

# For the Web app
cp apps/web/.env.example apps/web/.env.local
```

Update the `.env` files with your database credentials and other configuration.

### 3. Set Up Database

```bash
# Navigate to the API directory
cd apps/api

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed the database with initial data
npx tsx prisma/seed.ts
```

### 4. Start Development Servers

From the root directory:

```bash
# Start both API and Web servers
npm run dev

# Or start individually:
# API (runs on port 3001)
cd apps/api && npm run dev

# Web (runs on port 5000)
cd apps/web && npm run dev
```

## Default Users (Seeded)

| Role       | Email                | Password      |
|------------|----------------------|---------------|
| Admin      | admin@ngo.org        | admin123      |
| Staff      | staff@ngo.org        | staff123      |
| Telecaller | telecaller@ngo.org   | telecaller123 |
| Accountant | accountant@ngo.org   | accountant123 |

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user (Admin only in production)
- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/logout` - Logout (requires authentication)
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get current user profile

### Users (Admin only)

- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id/role` - Update user role
- `PATCH /api/users/:id/toggle-active` - Toggle user active status

## Role-Based Access Control (RBAC)

| Feature      | Admin | Staff | Telecaller | Accountant |
|--------------|-------|-------|------------|------------|
| Dashboard    | ✅    | ✅    | ✅         | ✅         |
| Donors       | ✅    | ✅    | ✅         | ✅         |
| Donations    | ✅    | ✅    | ✅         | ✅         |
| Beneficiaries| ✅    | ✅    | ✅         | ✅         |
| Reports      | ✅    | ❌    | ❌         | ✅         |
| Users        | ✅    | ❌    | ❌         | ❌         |
| Settings     | ✅    | ❌    | ❌         | ❌         |

## Development Phases

### Phase 1 (Current) ✅
- [x] Monorepo structure setup
- [x] Prisma schema with User, Donor, Donation, Beneficiary models
- [x] NestJS auth with JWT + refresh tokens
- [x] RBAC guards for role-based access
- [x] Next.js login page
- [x] Protected dashboard layout with sidebar navigation
- [x] Empty module pages

### Phase 2 (Upcoming)
- [ ] Donor CRUD operations
- [ ] Donation management
- [ ] Beneficiary management
- [ ] File uploads (S3)

### Phase 3 (Future)
- [ ] Reports and analytics
- [ ] Dashboard charts with Recharts
- [ ] PDF receipt generation

### Phase 4 (Future)
- [ ] Background jobs with BullMQ + Redis
- [ ] Email notifications
- [ ] Scheduled reminders

## Deployment

🚀 **Ready to deploy? Start here: [`START_HERE.md`](START_HERE.md)**

### Deployment Options

**Option A: All on Railway (Recommended)**
- Everything in one place: Database + API + Frontend
- Simplest setup
- Follow: [`RAILWAY_DEPLOYMENT.md`](RAILWAY_DEPLOYMENT.md)
- Time: 20 minutes

**Option B: Railway + Vercel**
- Railway: Database + API
- Vercel: Frontend (better for Next.js)
- Follow: [`QUICK_START.md`](QUICK_START.md)
- Time: 15 minutes

### Documentation

- 📖 [`START_HERE.md`](START_HERE.md) - Start here! Overview and guide
- 🚂 [`RAILWAY_DEPLOYMENT.md`](RAILWAY_DEPLOYMENT.md) - Deploy everything on Railway
- ⚡ [`RAILWAY_QUICK_REFERENCE.md`](RAILWAY_QUICK_REFERENCE.md) - Quick commands cheat sheet
- 🔧 [`RAILWAY_TROUBLESHOOTING.md`](RAILWAY_TROUBLESHOOTING.md) - Fix common issues
- 📋 [`DEPLOYMENT_CHECKLIST.md`](DEPLOYMENT_CHECKLIST.md) - Verify your deployment
- 💡 [`DEPLOYMENT_SUMMARY.md`](DEPLOYMENT_SUMMARY.md) - Why? How? Cost?
- 🏗️ [`ARCHITECTURE.md`](ARCHITECTURE.md) - System architecture details

### Quick Commands

```bash
# Your code is already on GitHub!
# Repository: https://github.com/ashakuteer/DMS.git

# Next: Follow RAILWAY_DEPLOYMENT.md to deploy
```

## License

MIT
trigger redeploy
hello

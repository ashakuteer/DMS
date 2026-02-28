# Deployment Architecture Diagram

## Current Setup (Local Development)

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Computer                             │
│                                                              │
│  ┌────────────────┐    ┌────────────────┐                  │
│  │   Frontend     │    │   Backend      │                  │
│  │   Next.js      │───▶│   NestJS       │                  │
│  │   Port 3000    │    │   Port 3001    │                  │
│  └────────────────┘    └────────┬───────┘                  │
│                                  │                           │
│                                  ▼                           │
│                         ┌────────────────┐                  │
│                         │   PostgreSQL   │                  │
│                         │   Port 5432    │                  │
│                         └────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

---

## After Railway Deployment (Production)

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RAILWAY PLATFORM                              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Service: web                                              │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  Next.js Frontend                                    │ │ │
│  │  │  - User Interface                                    │ │ │
│  │  │  - Login, Dashboard, Forms                           │ │ │
│  │  │  - Built from: apps/web/                             │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │  URL: https://web-production-xxxx.up.railway.app          │ │
│  │  Environment:                                              │ │
│  │    NEXT_PUBLIC_API_URL=https://api-production...          │ │
│  └────────────────────────────┬───────────────────────────────┘ │
│                               │                                  │
│                               │ REST API Calls                   │
│                               ▼                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Service: api                                              │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  NestJS Backend API                                  │ │ │
│  │  │  - Authentication (JWT)                              │ │ │
│  │  │  - Business Logic                                    │ │ │
│  │  │  - RBAC (Role-based Access)                          │ │ │
│  │  │  - Built from: apps/api/                             │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │  URL: https://api-production-xxxx.up.railway.app          │ │
│  │  Environment:                                              │ │
│  │    DATABASE_URL=${{Postgres.DATABASE_URL}}                │ │
│  │    JWT_SECRET=...                                          │ │
│  │    FRONTEND_URL=https://web-production...                 │ │
│  └────────────────────────────┬───────────────────────────────┘ │
│                               │                                  │
│                               │ SQL Queries                      │
│                               ▼                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Service: Postgres                                         │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  PostgreSQL Database                                 │ │ │
│  │  │  - Users, Donors, Donations                          │ │ │
│  │  │  - Beneficiaries, Campaigns                          │ │ │
│  │  │  - Audit Logs, Reports                               │ │ │
│  │  │  - Managed by Prisma ORM                             │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │  Internal URL: containers-us-west-xxx.railway.app:7432    │ │
│  │  Auto-backups: Daily                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: User Login Example

```
1. User visits frontend
   https://web-production-xxxx.up.railway.app
   │
   ▼
2. User enters credentials
   Email: admin@ngo.org
   Password: admin123
   │
   ▼
3. Frontend sends POST request
   POST https://api-production-xxxx.up.railway.app/api/auth/login
   Body: { email, password }
   │
   ▼
4. API validates credentials
   - Checks database for user
   - Verifies password (bcrypt)
   - Generates JWT tokens
   │
   ▼
5. Database query
   SELECT * FROM users WHERE email = 'admin@ngo.org'
   │
   ▼
6. API returns tokens
   Response: {
     accessToken: "eyJhbGc...",
     refreshToken: "eyJhbGc...",
     user: { id, email, name, role }
   }
   │
   ▼
7. Frontend stores tokens
   - Saves in memory/localStorage
   - Redirects to dashboard
   │
   ▼
8. Frontend requests dashboard data
   GET https://api-production-xxxx.up.railway.app/api/dashboard
   Headers: { Authorization: "Bearer eyJhbGc..." }
   │
   ▼
9. API verifies JWT
   - Validates token signature
   - Checks expiration
   - Extracts user info
   │
   ▼
10. Database queries
    - Get donor count
    - Get donation stats
    - Get recent activities
    │
    ▼
11. API returns data
    Response: {
      totalDonors: 150,
      totalDonations: 50000,
      recentDonations: [...]
    }
    │
    ▼
12. Frontend displays dashboard
    User sees their personalized dashboard
```

---

## Deployment Flow: Code to Production

```
┌─────────────────────────────────────────────────────────────┐
│  Developer (You)                                             │
│                                                              │
│  1. Write code locally                                       │
│  2. Test locally (npm run dev)                               │
│  3. Commit changes                                           │
│     git add .                                                │
│     git commit -m "Add new feature"                          │
│  4. Push to GitHub                                           │
│     git push origin main                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Git Push
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  GitHub Repository                                           │
│  https://github.com/ashakuteer/DMS                          │
│                                                              │
│  - Stores your code                                          │
│  - Version control                                           │
│  - Triggers webhooks                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Webhook Trigger
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Railway Platform                                            │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Build Process                                      │   │
│  │  1. Clone repository                                │   │
│  │  2. Install dependencies (npm install)              │   │
│  │  3. Generate Prisma client                          │   │
│  │  4. Build application (npm run build)               │   │
│  │  5. Create Docker container                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                    │
│                         │ If build succeeds                  │
│                         ▼                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Deploy Process                                     │   │
│  │  1. Stop old container (if exists)                  │   │
│  │  2. Start new container                             │   │
│  │  3. Health check                                    │   │
│  │  4. Route traffic to new version                    │   │
│  │  5. Keep old version for rollback                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                    │
│                         │ Deployment complete                │
│                         ▼                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Live Application                                   │   │
│  │  - Frontend: https://web-production-xxxx...         │   │
│  │  - API: https://api-production-xxxx...              │   │
│  │  - Database: Running and connected                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Service Communication

```
┌──────────────────────────────────────────────────────────────┐
│                    Railway Project                            │
│                                                               │
│  ┌─────────────┐                                             │
│  │   web       │                                             │
│  │  (Frontend) │                                             │
│  └──────┬──────┘                                             │
│         │                                                     │
│         │ HTTP Requests                                       │
│         │ (NEXT_PUBLIC_API_URL)                              │
│         │                                                     │
│         ▼                                                     │
│  ┌─────────────┐                                             │
│  │    api      │                                             │
│  │  (Backend)  │                                             │
│  └──────┬──────┘                                             │
│         │                                                     │
│         │ SQL Queries                                         │
│         │ (DATABASE_URL)                                      │
│         │                                                     │
│         ▼                                                     │
│  ┌─────────────┐                                             │
│  │  Postgres   │                                             │
│  │ (Database)  │                                             │
│  └─────────────┘                                             │
│                                                               │
│  All services in same project = Fast internal networking     │
└──────────────────────────────────────────────────────────────┘
```

---

## Environment Variables Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Railway Dashboard                                           │
│                                                              │
│  Service: api                                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Variables Tab                                          │ │
│  │                                                        │ │
│  │ DATABASE_URL=${{Postgres.DATABASE_URL}}               │ │
│  │ JWT_SECRET=your-secret-here                           │ │
│  │ FRONTEND_URL=https://web-production...                │ │
│  └────────────────────────────────────────────────────────┘ │
│                         │                                    │
│                         │ Injected at runtime                │
│                         ▼                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Running Container                                      │ │
│  │                                                        │ │
│  │ process.env.DATABASE_URL = "postgresql://..."         │ │
│  │ process.env.JWT_SECRET = "your-secret-here"           │ │
│  │ process.env.FRONTEND_URL = "https://web..."           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: HTTPS (Railway Default)                           │
│  - All traffic encrypted                                     │
│  - Automatic SSL certificates                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: CORS (API Configuration)                          │
│  - Only frontend URL allowed                                 │
│  - Blocks unauthorized origins                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: JWT Authentication                                │
│  - Token-based auth                                          │
│  - Refresh token rotation                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 4: Role-Based Access Control (RBAC)                  │
│  - Admin, Staff, Telecaller, Accountant                     │
│  - Permission guards on routes                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 5: Database Security                                 │
│  - Prisma ORM (SQL injection prevention)                    │
│  - Password hashing (bcrypt)                                 │
│  - Private network (Railway internal)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Monitoring & Logs

```
┌─────────────────────────────────────────────────────────────┐
│  Railway Dashboard                                           │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │  web service   │  │  api service   │  │  Postgres    │  │
│  │                │  │                │  │              │  │
│  │  ✅ Running    │  │  ✅ Running    │  │  ✅ Running  │  │
│  │  CPU: 5%       │  │  CPU: 12%      │  │  Size: 50MB  │  │
│  │  RAM: 100MB    │  │  RAM: 200MB    │  │              │  │
│  └────────┬───────┘  └────────┬───────┘  └──────┬───────┘  │
│           │                   │                  │           │
│           │                   │                  │           │
│  ┌────────▼───────────────────▼──────────────────▼───────┐  │
│  │                    Logs View                          │  │
│  │                                                        │  │
│  │  [web] Server listening on port 3000                  │  │
│  │  [api] Nest application successfully started          │  │
│  │  [api] Database connection established                │  │
│  │  [api] POST /api/auth/login 200 45ms                  │  │
│  │  [web] GET /dashboard 200 120ms                       │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Cost Breakdown

```
┌─────────────────────────────────────────────────────────────┐
│  Railway Free Tier: $5 credit/month                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Service: web (Frontend)                               │ │
│  │  Cost: ~$0.15/day                                      │ │
│  │  - 512MB RAM                                           │ │
│  │  - Shared CPU                                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Service: api (Backend)                                │ │
│  │  Cost: ~$0.15/day                                      │ │
│  │  - 512MB RAM                                           │ │
│  │  - Shared CPU                                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Service: Postgres (Database)                          │ │
│  │  Cost: ~$0.20/day                                      │ │
│  │  - 1GB storage                                         │ │
│  │  - Daily backups                                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Total: ~$0.50/day = ~$15/month                             │
│  Free credit covers: ~10 days                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Scaling Path

```
Current (Free Tier)
┌─────────────────┐
│ 1 web instance  │
│ 1 api instance  │
│ 1 db instance   │
└─────────────────┘
~50 concurrent users

         │
         │ Upgrade to Hobby ($5/month)
         ▼

Hobby Plan
┌─────────────────┐
│ 1 web instance  │
│ 1 api instance  │
│ 1 db instance   │
└─────────────────┘
~100 concurrent users
More resources per instance

         │
         │ Upgrade to Pro ($20/month)
         ▼

Pro Plan
┌─────────────────┐
│ 2 web instances │ ← Horizontal scaling
│ 2 api instances │ ← Load balanced
│ 1 db instance   │ ← Larger database
└─────────────────┘
~500 concurrent users
Auto-scaling enabled
```

---

**Ready to deploy? Follow [`RAILWAY_DEPLOYMENT.md`](RAILWAY_DEPLOYMENT.md)!**

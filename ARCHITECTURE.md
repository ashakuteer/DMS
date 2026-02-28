# System Architecture

## Overview

This is a full-stack NGO Donor Management System built as a monorepo with separate frontend and backend applications.

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                                │
│                    (Browsers/Devices)                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL (Frontend)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Next.js 14 Application                       │ │
│  │  - App Router                                          │ │
│  │  - React 18 + TypeScript                              │ │
│  │  - Tailwind CSS + Radix UI                            │ │
│  │  - Client-side routing                                │ │
│  │  - JWT token management                               │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ REST API calls
                     │ (NEXT_PUBLIC_API_URL)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   RAILWAY (Backend)                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              NestJS API Server                         │ │
│  │  - RESTful API endpoints                              │ │
│  │  - JWT authentication                                 │ │
│  │  - Role-based access control (RBAC)                   │ │
│  │  - Passport.js strategies                             │ │
│  │  - Prisma ORM                                         │ │
│  │  - Business logic & validation                        │ │
│  └────────────────┬───────────────────────────────────────┘ │
│                   │                                          │
│                   │ Prisma Client                            │
│                   ▼                                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           PostgreSQL Database                          │ │
│  │  - User accounts & authentication                     │ │
│  │  - Donor information                                  │ │
│  │  - Donation records                                   │ │
│  │  - Beneficiary data                                   │ │
│  │  - Campaigns & sponsorships                           │ │
│  │  - Audit logs                                         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend (Next.js)
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **State Management**: React hooks + Context API
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **HTTP Client**: Fetch API

### Backend (NestJS)
- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Authentication**: JWT + Refresh Tokens
- **Authorization**: Role-based access control (RBAC)
- **Validation**: class-validator + class-transformer
- **ORM**: Prisma
- **API Style**: RESTful

### Database
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Migrations**: Prisma Migrate
- **Seeding**: TypeScript seed scripts

---

## Data Models

### Core Entities

1. **User**
   - Authentication & authorization
   - Roles: Admin, Staff, Telecaller, Accountant
   - JWT token management

2. **Donor**
   - Personal information
   - Contact details (phone, email, WhatsApp)
   - Donation preferences
   - Family members
   - Special occasions

3. **Donation**
   - Amount & currency
   - Type (cash, kind, service)
   - Purpose & campaign
   - Receipt generation
   - Tax documentation

4. **Beneficiary**
   - Personal details
   - Home type (orphanage, old age home, etc.)
   - Education & health records
   - Progress tracking
   - Sponsorship links

5. **Sponsorship**
   - Donor-Beneficiary relationship
   - Payment schedule
   - Status tracking
   - Reminders

6. **Campaign**
   - Fundraising campaigns
   - Goal tracking
   - Updates & reports

---

## Authentication Flow

```
┌──────────┐                                    ┌──────────┐
│  Client  │                                    │   API    │
└────┬─────┘                                    └────┬─────┘
     │                                               │
     │  POST /api/auth/login                         │
     │  { email, password }                          │
     ├──────────────────────────────────────────────>│
     │                                               │
     │                                               │ Validate credentials
     │                                               │ Generate JWT tokens
     │                                               │
     │  { accessToken, refreshToken, user }          │
     │<──────────────────────────────────────────────┤
     │                                               │
     │  Store tokens in memory/localStorage          │
     │                                               │
     │                                               │
     │  GET /api/donors                              │
     │  Authorization: Bearer <accessToken>          │
     ├──────────────────────────────────────────────>│
     │                                               │
     │                                               │ Verify JWT
     │                                               │ Check permissions
     │                                               │
     │  { donors: [...] }                            │
     │<──────────────────────────────────────────────┤
     │                                               │
     │                                               │
     │  (Token expires)                              │
     │                                               │
     │  POST /api/auth/refresh                       │
     │  { refreshToken }                             │
     ├──────────────────────────────────────────────>│
     │                                               │
     │                                               │ Validate refresh token
     │                                               │ Generate new access token
     │                                               │
     │  { accessToken }                              │
     │<──────────────────────────────────────────────┤
     │                                               │
```

---

## Role-Based Access Control (RBAC)

### Roles & Permissions

| Feature              | Admin | Staff | Telecaller | Accountant |
|---------------------|-------|-------|------------|------------|
| Dashboard           | ✅    | ✅    | ✅         | ✅         |
| View Donors         | ✅    | ✅    | ✅         | ✅         |
| Create/Edit Donors  | ✅    | ✅    | ✅         | ❌         |
| Delete Donors       | ✅    | ❌    | ❌         | ❌         |
| View Donations      | ✅    | ✅    | ✅         | ✅         |
| Record Donations    | ✅    | ✅    | ❌         | ✅         |
| View Beneficiaries  | ✅    | ✅    | ✅         | ✅         |
| Manage Beneficiaries| ✅    | ✅    | ❌         | ❌         |
| Financial Reports   | ✅    | ❌    | ❌         | ✅         |
| User Management     | ✅    | ❌    | ❌         | ❌         |
| System Settings     | ✅    | ❌    | ❌         | ❌         |
| Audit Logs          | ✅    | ❌    | ❌         | ❌         |

### Implementation

Guards are applied at the controller level:
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.STAFF)
@Get()
findAll() { ... }
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get current user

### Donors
- `GET /api/donors` - List donors (paginated, filtered)
- `GET /api/donors/:id` - Get donor details
- `POST /api/donors` - Create donor
- `PATCH /api/donors/:id` - Update donor
- `DELETE /api/donors/:id` - Soft delete donor

### Donations
- `GET /api/donations` - List donations
- `GET /api/donations/:id` - Get donation details
- `POST /api/donations` - Record donation
- `PATCH /api/donations/:id` - Update donation
- `GET /api/donations/receipt/:id` - Generate receipt PDF

### Beneficiaries
- `GET /api/beneficiaries` - List beneficiaries
- `GET /api/beneficiaries/:id` - Get beneficiary details
- `POST /api/beneficiaries` - Create beneficiary
- `PATCH /api/beneficiaries/:id` - Update beneficiary

### Sponsorships
- `GET /api/sponsorships` - List sponsorships
- `POST /api/sponsorships` - Create sponsorship
- `PATCH /api/sponsorships/:id` - Update sponsorship
- `GET /api/sponsorships/reminders` - Get payment reminders

### Analytics
- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/analytics/donations` - Donation analytics
- `GET /api/analytics/donors` - Donor analytics

---

## Deployment Architecture

### Production Setup

```
Internet
   │
   ├─> Vercel (Frontend)
   │   └─> Next.js App
   │       └─> Static assets served via CDN
   │
   └─> Railway (Backend)
       ├─> NestJS API (Docker container)
       └─> PostgreSQL Database
```

### Environment Variables

**Frontend (Vercel)**
```env
NEXT_PUBLIC_API_URL=https://api.railway.app
```

**Backend (Railway)**
```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
FRONTEND_URL=https://app.vercel.app
NODE_ENV=production
API_PORT=3001
```

---

## Security Features

1. **Authentication**
   - JWT-based authentication
   - Refresh token rotation
   - Secure password hashing (bcrypt)

2. **Authorization**
   - Role-based access control
   - Permission guards on routes
   - Resource ownership validation

3. **Data Protection**
   - Input validation on all endpoints
   - SQL injection prevention (Prisma)
   - XSS protection
   - CORS configuration

4. **Audit Trail**
   - All critical actions logged
   - User activity tracking
   - Change history

---

## Scalability Considerations

### Current Architecture
- Suitable for 100-1000 concurrent users
- Single database instance
- Stateless API (horizontal scaling ready)

### Future Enhancements
- Redis for session management
- Background job processing (BullMQ)
- File storage (S3/Supabase Storage)
- Email service integration
- Real-time notifications (WebSockets)
- Database read replicas
- CDN for static assets

---

## Monitoring & Maintenance

### Logging
- Application logs via Railway/Vercel
- Error tracking (can integrate Sentry)
- Performance monitoring

### Backups
- Automated database backups (Railway)
- Point-in-time recovery
- Manual backup exports

### Updates
- Automatic deployments on git push
- Zero-downtime deployments
- Rollback capability

---

## Development Workflow

```
Local Development
      │
      │ git push
      ▼
GitHub Repository
      │
      ├─> Vercel (auto-deploy frontend)
      │
      └─> Railway (auto-deploy backend)
```

### Local Setup
1. Clone repository
2. Install dependencies (`npm install`)
3. Set up local PostgreSQL
4. Run migrations (`npx prisma migrate dev`)
5. Seed database (`npx tsx prisma/seed.ts`)
6. Start dev servers (`npm run dev`)

---

## Performance Optimization

### Frontend
- Server-side rendering (SSR)
- Static generation where possible
- Code splitting
- Image optimization
- Lazy loading

### Backend
- Database query optimization
- Prisma query batching
- Response caching (future)
- Connection pooling

### Database
- Indexed columns for fast queries
- Efficient schema design
- Regular VACUUM operations

---

## Future Roadmap

### Phase 2
- Complete CRUD operations
- File uploads
- Advanced search & filters

### Phase 3
- Reports & analytics
- PDF generation
- Dashboard charts

### Phase 4
- Email notifications
- SMS/WhatsApp integration
- Scheduled reminders
- Background jobs

### Phase 5
- Mobile app (React Native)
- Advanced analytics
- AI-powered insights
- Multi-tenancy support

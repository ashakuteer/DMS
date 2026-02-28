# Deployment Guide - NGO Donor Management System

## Prerequisites

- GitHub account
- Railway account (https://railway.app)
- Vercel account (https://vercel.com)
- Git installed locally

---

## Step 1: Push Code to GitHub

### 1.1 Initialize Git (if not already done)

```bash
git init
git add .
git commit -m "Initial commit"
```

### 1.2 Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., "ngo-donor-management")
3. Don't initialize with README (you already have one)

### 1.3 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/ngo-donor-management.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Database + API to Railway

### 2.1 Create Railway Account

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project"

### 2.2 Add PostgreSQL Database

1. Click "New" → "Database" → "Add PostgreSQL"
2. Railway will provision a database
3. Copy the `DATABASE_URL` from the "Variables" tab

### 2.3 Deploy API

1. Click "New" → "GitHub Repo"
2. Select your repository
3. Railway will detect the `railway.json` config
4. Add environment variables:

```env
DATABASE_URL=<from-postgresql-service>
JWT_SECRET=your-super-secret-jwt-key-change-in-production-xyz123
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-abc456
API_PORT=3001
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
```

5. Click "Deploy"

### 2.4 Run Database Migrations

After deployment, go to Railway dashboard:

1. Click on your API service
2. Go to "Settings" → "Deploy"
3. Add a "Deploy Command":

```bash
npx prisma migrate deploy && npx prisma db seed
```

Or run manually in Railway CLI:

```bash
railway run npx prisma migrate deploy
railway run npx tsx prisma/seed.ts
```

### 2.5 Get API URL

1. Go to "Settings" → "Networking"
2. Click "Generate Domain"
3. Copy the URL (e.g., `https://your-api.railway.app`)

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account

1. Go to https://vercel.com
2. Sign up with GitHub

### 3.2 Import Project

1. Click "Add New" → "Project"
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 3.3 Add Environment Variables

In Vercel project settings → Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://your-api.railway.app
```

### 3.4 Deploy

1. Click "Deploy"
2. Vercel will build and deploy your frontend
3. You'll get a URL like `https://your-app.vercel.app`

### 3.5 Update Railway API Environment

Go back to Railway and update the API's `FRONTEND_URL`:

```env
FRONTEND_URL=https://your-app.vercel.app
```

Redeploy the API service.

---

## Step 4: Update vercel.json

Update the `vercel.json` file with your actual Railway API URL:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://YOUR-ACTUAL-API.railway.app/api/:path*"
    }
  ]
}
```

Commit and push:

```bash
git add vercel.json
git commit -m "Update API URL"
git push
```

Vercel will auto-deploy.

---

## Alternative: Deploy Everything on Railway

If you want to keep it simple and deploy everything on Railway:

### Option: Railway Only (API + Database + Frontend)

1. Deploy PostgreSQL (as above)
2. Deploy API (as above)
3. Deploy Frontend:
   - Click "New" → "GitHub Repo"
   - Select your repository
   - Set root directory: `apps/web`
   - Add environment variable:
     ```env
     NEXT_PUBLIC_API_URL=https://your-api.railway.app
     ```
   - Deploy

---

## Alternative: Use Supabase for Database

If you prefer Supabase for the database:

### 1. Create Supabase Project

1. Go to https://supabase.com
2. Create new project
3. Wait for database to provision
4. Go to "Settings" → "Database"
5. Copy the "Connection string" (URI format)

### 2. Update Railway API

Replace the `DATABASE_URL` in Railway with Supabase connection string:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

### 3. Run Migrations

```bash
# Set DATABASE_URL locally
export DATABASE_URL="your-supabase-connection-string"

# Run migrations
cd apps/api
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

---

## Post-Deployment Checklist

- [ ] API is accessible at Railway URL
- [ ] Frontend is accessible at Vercel URL
- [ ] Database migrations ran successfully
- [ ] Seed data is loaded
- [ ] Can login with default users:
  - admin@ngo.org / admin123
  - staff@ngo.org / staff123
- [ ] CORS is configured (FRONTEND_URL in API)
- [ ] Environment variables are set correctly
- [ ] JWT secrets are strong and unique

---

## Monitoring & Logs

### Railway
- Go to your service → "Deployments" → Click on deployment
- View logs in real-time

### Vercel
- Go to your project → "Deployments" → Click on deployment
- View function logs and build logs

---

## Updating Your Application

### For API Changes

```bash
git add .
git commit -m "Update API"
git push
```

Railway will auto-deploy.

### For Frontend Changes

```bash
git add .
git commit -m "Update frontend"
git push
```

Vercel will auto-deploy.

---

## Troubleshooting

### API won't start
- Check Railway logs
- Verify DATABASE_URL is correct
- Ensure Prisma migrations ran

### Frontend can't connect to API
- Check NEXT_PUBLIC_API_URL in Vercel
- Verify CORS settings in API (FRONTEND_URL)
- Check Railway API is running

### Database connection errors
- Verify DATABASE_URL format
- Check database is running
- Ensure IP whitelist (if using Supabase)

---

## Cost Estimates

### Free Tier Limits

**Railway:**
- $5 free credit/month
- ~500 hours of usage
- Suitable for small projects

**Vercel:**
- 100 GB bandwidth/month
- Unlimited deployments
- Perfect for frontend

**Supabase:**
- 500 MB database
- 2 GB bandwidth
- Good for starting out

### Paid Plans (if needed)

- Railway: $5-20/month
- Vercel: $20/month (Pro)
- Supabase: $25/month (Pro)

---

## Security Recommendations

1. Change default JWT secrets
2. Use strong database passwords
3. Enable 2FA on all platforms
4. Regularly update dependencies
5. Monitor logs for suspicious activity
6. Set up database backups

---

## Need Help?

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Prisma Docs: https://www.prisma.io/docs

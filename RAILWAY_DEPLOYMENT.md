# Deploy Everything on Railway - Step by Step Guide

## Overview

We'll deploy your entire application on Railway:
- ✅ PostgreSQL Database
- ✅ NestJS Backend API
- ✅ Next.js Frontend

**Time Required**: 20 minutes
**Cost**: Free tier ($5 credit/month)

---

## Step 1: Sign Up for Railway (2 minutes)

1. Go to https://railway.app
2. Click "Login" → "Login with GitHub"
3. Authorize Railway to access your GitHub account
4. You'll get $5 free credit per month

---

## Step 2: Create New Project (1 minute)

1. Click "New Project" button
2. You'll see an empty project dashboard
3. This is where all your services will live

---

## Step 3: Add PostgreSQL Database (2 minutes)

1. In your project, click "+ New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will provision a PostgreSQL database
4. Wait ~30 seconds for it to be ready
5. Click on the PostgreSQL service
6. Go to "Variables" tab
7. **Copy the `DATABASE_URL`** - you'll need this soon

Example format:
```
postgresql://postgres:password@containers-us-west-xxx.railway.app:7432/railway
```

---

## Step 4: Deploy Backend API (5 minutes)

### 4.1 Add API Service

1. Click "+ New" in your project
2. Select "GitHub Repo"
3. If this is your first time, click "Configure GitHub App"
4. Select your repository: `ashakuteer/DMS`
5. Click "Add Repository"
6. Select the repository again from the list

### 4.2 Configure API Service

1. Railway will start deploying automatically
2. Click on the service (it might be called "DMS" or similar)
3. Go to "Settings" tab
4. Scroll to "Service Name" and rename it to `api`
5. Scroll to "Root Directory" and set it to: `apps/api`
6. Scroll to "Start Command" and set it to: `npm run start:prod`
7. Scroll to "Build Command" and set it to: `npm install && npm run build`

### 4.3 Add Environment Variables

1. Go to "Variables" tab
2. Click "+ New Variable"
3. Add these variables one by one:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=ngo-donor-jwt-secret-production-2024-change-this-xyz123
JWT_REFRESH_SECRET=ngo-donor-refresh-secret-production-2024-change-this-abc456
API_PORT=3001
NODE_ENV=production
FRONTEND_URL=https://dms-production.up.railway.app
```

**Important Notes:**
- For `DATABASE_URL`, Railway has a special syntax: `${{Postgres.DATABASE_URL}}`
  - This automatically links to your PostgreSQL service
  - If your PostgreSQL service has a different name, adjust accordingly
- Change the JWT secrets to your own random strings
- We'll update `FRONTEND_URL` later after deploying the frontend

4. Click "Add" for each variable

### 4.4 Generate Public Domain

1. Go to "Settings" tab
2. Scroll to "Networking" section
3. Click "Generate Domain"
4. Railway will give you a URL like: `https://api-production-xxxx.up.railway.app`
5. **Copy this URL** - this is your API URL

### 4.5 Run Database Migrations

1. Wait for the deployment to complete (check "Deployments" tab)
2. Once deployed, go to "Settings" tab
3. Scroll to "Deploy" section
4. You'll see a "Custom Start Command" option
5. We need to run migrations manually first

**Option A: Using Railway CLI** (Recommended)

Install Railway CLI:
```bash
# On Windows (PowerShell)
iwr https://railway.app/install.ps1 | iex

# On Mac/Linux
curl -fsSL https://railway.app/install.sh | sh
```

Then run:
```bash
# Login to Railway
railway login

# Link to your project
railway link

# Select the API service
railway service

# Run migrations
railway run npx prisma migrate deploy

# Seed the database
railway run npx tsx prisma/seed.ts
```

**Option B: Using Railway Dashboard**

1. Go to your API service
2. Click "Settings" → "Deploy"
3. Under "Custom Start Command", temporarily change to:
   ```
   npx prisma migrate deploy && npx tsx prisma/seed.ts && npm run start:prod
   ```
4. Redeploy the service
5. After successful deployment, change the start command back to: `npm run start:prod`

---

## Step 5: Deploy Frontend (5 minutes)

### 5.1 Add Frontend Service

1. Click "+ New" in your project
2. Select "GitHub Repo"
3. Select your repository: `ashakuteer/DMS`
4. Railway will start deploying

### 5.2 Configure Frontend Service

1. Click on the new service
2. Go to "Settings" tab
3. Rename service to `web`
4. Set "Root Directory" to: `apps/web`
5. Set "Build Command" to: `npm install && npm run build`
6. Set "Start Command" to: `npm run start`

### 5.3 Add Environment Variables

1. Go to "Variables" tab
2. Add this variable:

```env
NEXT_PUBLIC_API_URL=https://api-production-xxxx.up.railway.app
```

Replace with your actual API URL from Step 4.4

### 5.4 Generate Public Domain

1. Go to "Settings" tab
2. Scroll to "Networking"
3. Click "Generate Domain"
4. You'll get a URL like: `https://web-production-xxxx.up.railway.app`
5. **Copy this URL** - this is your frontend URL

---

## Step 6: Update API with Frontend URL (2 minutes)

1. Go back to your API service
2. Go to "Variables" tab
3. Find `FRONTEND_URL` variable
4. Update it with your frontend URL from Step 5.4
5. The API will automatically redeploy

---

## Step 7: Test Your Deployment (3 minutes)

### 7.1 Check API

1. Open your API URL in browser: `https://api-production-xxxx.up.railway.app`
2. You should see a response (might be "Cannot GET /")
3. Try: `https://api-production-xxxx.up.railway.app/api/auth/profile`
4. Should return 401 Unauthorized (this is correct - means API is working)

### 7.2 Check Frontend

1. Open your frontend URL: `https://web-production-xxxx.up.railway.app`
2. You should see the login page
3. Try logging in with:
   - Email: `admin@ngo.org`
   - Password: `admin123`
4. You should be redirected to the dashboard

### 7.3 Check Logs

If something doesn't work:

**API Logs:**
1. Go to API service
2. Click "Deployments" tab
3. Click on the latest deployment
4. View logs for errors

**Frontend Logs:**
1. Go to Web service
2. Click "Deployments" tab
3. Click on the latest deployment
4. View logs for errors

---

## Your Railway Project Structure

After deployment, your Railway project should look like this:

```
My Project
├── Postgres (Database)
│   └── DATABASE_URL: postgresql://...
│
├── api (Backend)
│   ├── Root Directory: apps/api
│   ├── Domain: https://api-production-xxxx.up.railway.app
│   └── Variables:
│       ├── DATABASE_URL=${{Postgres.DATABASE_URL}}
│       ├── JWT_SECRET=...
│       ├── JWT_REFRESH_SECRET=...
│       ├── API_PORT=3001
│       ├── NODE_ENV=production
│       └── FRONTEND_URL=https://web-production-xxxx.up.railway.app
│
└── web (Frontend)
    ├── Root Directory: apps/web
    ├── Domain: https://web-production-xxxx.up.railway.app
    └── Variables:
        └── NEXT_PUBLIC_API_URL=https://api-production-xxxx.up.railway.app
```

---

## Troubleshooting

### API Won't Start

**Check Logs:**
1. Go to API service → Deployments → Latest deployment
2. Look for errors

**Common Issues:**
- `DATABASE_URL` not set correctly
  - Should be: `${{Postgres.DATABASE_URL}}`
- Migrations not run
  - Run: `railway run npx prisma migrate deploy`
- Build failed
  - Check if `apps/api/package.json` has build script

### Frontend Won't Start

**Check Logs:**
1. Go to Web service → Deployments → Latest deployment
2. Look for errors

**Common Issues:**
- `NEXT_PUBLIC_API_URL` not set
- Build failed - check if `apps/web/package.json` has build script
- Wrong root directory - should be `apps/web`

### Can't Login

**Check:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors

**Common Issues:**
- CORS error: Update `FRONTEND_URL` in API service
- 404 error: Check `NEXT_PUBLIC_API_URL` in frontend
- Database not seeded: Run seed command

### Database Connection Failed

**Check:**
1. PostgreSQL service is running (green status)
2. `DATABASE_URL` in API uses Railway reference: `${{Postgres.DATABASE_URL}}`
3. Migrations ran successfully

---

## Cost Estimate

### Free Tier
- $5 credit per month
- Covers ~500 hours of usage
- Suitable for:
  - Development
  - Small NGOs (< 50 users)
  - Testing

### Usage Breakdown
- PostgreSQL: ~$0.20/day
- API Service: ~$0.15/day
- Web Service: ~$0.15/day
- **Total**: ~$0.50/day = ~$15/month

**Your $5 credit covers ~10 days of usage**

### When You Need More

**Hobby Plan**: $5/month
- $5 credit + $5 subscription
- Covers ~20 days

**Pro Plan**: $20/month
- More resources
- Better performance
- Priority support

---

## Updating Your Application

### Make Code Changes

```bash
# Make your changes locally
git add .
git commit -m "Update feature"
git push origin main
```

Railway will automatically:
1. Detect the push
2. Rebuild affected services
3. Deploy new version
4. Zero downtime deployment

### Manual Redeploy

If you need to redeploy without code changes:
1. Go to service
2. Click "Deployments" tab
3. Click "..." on latest deployment
4. Click "Redeploy"

---

## Custom Domain (Optional)

### Add Your Own Domain

1. Go to Web service
2. Go to "Settings" → "Networking"
3. Click "Custom Domain"
4. Enter your domain (e.g., `donors.yourngo.org`)
5. Add the CNAME record to your DNS provider:
   ```
   CNAME: donors.yourngo.org → web-production-xxxx.up.railway.app
   ```
6. Wait for DNS propagation (~5-60 minutes)
7. Railway will automatically provision SSL certificate

### Update API CORS

After adding custom domain:
1. Go to API service
2. Update `FRONTEND_URL` to your custom domain
3. Redeploy

---

## Monitoring & Maintenance

### Daily Checks
- [ ] All services are running (green status)
- [ ] No errors in logs
- [ ] Application is accessible

### Weekly Checks
- [ ] Review resource usage
- [ ] Check remaining credit
- [ ] Review error logs
- [ ] Test critical features

### Monthly Checks
- [ ] Database backup (Railway auto-backups)
- [ ] Update dependencies
- [ ] Review security
- [ ] Plan for scaling

---

## Backup & Recovery

### Database Backups

Railway automatically backs up your database:
- Frequency: Daily
- Retention: 7 days (free tier)
- Location: Railway infrastructure

### Manual Backup

```bash
# Using Railway CLI
railway run pg_dump $DATABASE_URL > backup.sql

# Restore
railway run psql $DATABASE_URL < backup.sql
```

### Code Backup

Your code is already backed up on GitHub!

---

## Security Checklist

- [ ] Changed default user passwords
- [ ] Strong JWT secrets (not the examples)
- [ ] Database password is strong (Railway auto-generated)
- [ ] 2FA enabled on GitHub
- [ ] 2FA enabled on Railway
- [ ] Environment variables are not in code
- [ ] CORS configured correctly
- [ ] HTTPS enabled (Railway default)

---

## Next Steps

1. **Test thoroughly**: Try all features
2. **Change passwords**: Update default user passwords
3. **Add users**: Create accounts for your staff
4. **Customize**: Add your NGO's branding
5. **Train staff**: Show them how to use the system
6. **Monitor**: Keep an eye on logs and usage
7. **Scale**: Upgrade when needed

---

## Support

### Railway Support
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway
- Status: https://status.railway.app

### Your Application
- GitHub: https://github.com/ashakuteer/DMS
- Issues: https://github.com/ashakuteer/DMS/issues

---

## Summary

✅ **Deployed**: PostgreSQL + API + Frontend on Railway
✅ **Cost**: ~$15/month (free $5 credit covers 10 days)
✅ **Time**: 20 minutes
✅ **Complexity**: Low (everything in one place)
✅ **Auto-deploy**: Yes (on git push)
✅ **Backups**: Automatic
✅ **SSL**: Automatic
✅ **Monitoring**: Built-in dashboard

**Your application is now live! 🎉**

Frontend: `https://web-production-xxxx.up.railway.app`
API: `https://api-production-xxxx.up.railway.app`

Login with: `admin@ngo.org` / `admin123`

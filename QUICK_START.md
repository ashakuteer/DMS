# Quick Start - Deploy in 15 Minutes

## What You'll Deploy

- **Backend API** (NestJS) → Railway
- **Database** (PostgreSQL) → Railway
- **Frontend** (Next.js) → Vercel

---

## Step-by-Step Guide

### 1. Push to GitHub (5 minutes)

```bash
# Initialize git if needed
git init
git add .
git commit -m "Ready for deployment"

# Create repo on GitHub: https://github.com/new
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

### 2. Deploy Database + API on Railway (5 minutes)

1. **Sign up**: https://railway.app (use GitHub login)

2. **Create PostgreSQL Database**:
   - Click "New Project" → "Provision PostgreSQL"
   - Copy the `DATABASE_URL` from Variables tab

3. **Deploy API**:
   - Click "New" → "GitHub Repo" → Select your repo
   - Railway auto-detects configuration
   
4. **Add Environment Variables** (in Railway API service):
   ```
   DATABASE_URL=<paste-from-postgres-service>
   JWT_SECRET=change-this-to-random-string-xyz123abc
   JWT_REFRESH_SECRET=change-this-to-another-random-string-def456
   API_PORT=3001
   FRONTEND_URL=https://your-app.vercel.app
   NODE_ENV=production
   ```

5. **Generate Domain**:
   - Settings → Networking → "Generate Domain"
   - Copy URL (e.g., `https://your-api.railway.app`)

6. **Run Database Setup**:
   - In Railway, go to API service
   - Click "..." → "Run Command"
   - Run: `npx prisma migrate deploy`
   - Then: `npx tsx prisma/seed.ts`

---

### 3. Deploy Frontend on Vercel (5 minutes)

1. **Sign up**: https://vercel.com (use GitHub login)

2. **Import Project**:
   - Click "Add New" → "Project"
   - Select your GitHub repo
   
3. **Configure**:
   - Framework: Next.js
   - Root Directory: `apps/web`
   - Build Command: `npm run build`
   - Output Directory: `.next`

4. **Add Environment Variable**:
   ```
   NEXT_PUBLIC_API_URL=https://your-api.railway.app
   ```
   (Use the Railway API URL from step 2.5)

5. **Deploy**:
   - Click "Deploy"
   - Wait 2-3 minutes
   - Copy your Vercel URL (e.g., `https://your-app.vercel.app`)

---

### 4. Final Configuration (2 minutes)

1. **Update Railway API**:
   - Go back to Railway
   - Update `FRONTEND_URL` to your Vercel URL
   - Redeploy

2. **Test Your App**:
   - Visit your Vercel URL
   - Login with: `admin@ngo.org` / `admin123`

---

## Done! 🎉

Your app is now live:
- Frontend: `https://your-app.vercel.app`
- API: `https://your-api.railway.app`

---

## Common Issues

**"Cannot connect to API"**
- Check `NEXT_PUBLIC_API_URL` in Vercel matches Railway API URL
- Verify `FRONTEND_URL` in Railway matches Vercel URL

**"Database connection failed"**
- Ensure `DATABASE_URL` is copied correctly from Railway PostgreSQL
- Check migrations ran successfully

**"Build failed"**
- Check build logs in Railway/Vercel
- Ensure all dependencies are in package.json

---

## What's Next?

- Change default passwords
- Update JWT secrets to strong random strings
- Set up custom domain (optional)
- Configure email service (for notifications)
- Set up monitoring

See `DEPLOYMENT.md` for detailed documentation.

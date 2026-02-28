# Railway Deployment - Quick Reference Card

## 🚀 Your Repository
**GitHub**: https://github.com/ashakuteer/DMS.git

---

## 📋 Deployment Steps (Copy & Paste)

### 1. PostgreSQL Database
```
Action: New → Database → Add PostgreSQL
Copy: DATABASE_URL from Variables tab
```

### 2. Backend API Service
```
Action: New → GitHub Repo → ashakuteer/DMS

Settings:
  Service Name: api
  Root Directory: apps/api
  Build Command: npm install && npm run build
  Start Command: npm run start:prod

Variables:
  DATABASE_URL=${{Postgres.DATABASE_URL}}
  JWT_SECRET=ngo-donor-jwt-secret-production-2024-xyz123
  JWT_REFRESH_SECRET=ngo-donor-refresh-secret-production-2024-abc456
  API_PORT=3001
  NODE_ENV=production
  FRONTEND_URL=https://web-production-xxxx.up.railway.app

Networking:
  Generate Domain → Copy API URL
```

### 3. Run Migrations
```bash
# Install Railway CLI
curl -fsSL https://railway.app/install.sh | sh

# Login and link
railway login
railway link
railway service  # Select 'api'

# Run migrations
railway run npx prisma migrate deploy
railway run npx tsx prisma/seed.ts
```

### 4. Frontend Service
```
Action: New → GitHub Repo → ashakuteer/DMS

Settings:
  Service Name: web
  Root Directory: apps/web
  Build Command: npm install && npm run build
  Start Command: npm run start

Variables:
  NEXT_PUBLIC_API_URL=<YOUR_API_URL_FROM_STEP_2>

Networking:
  Generate Domain → Copy Frontend URL
```

### 5. Update API
```
Go to API service → Variables
Update: FRONTEND_URL=<YOUR_FRONTEND_URL_FROM_STEP_4>
```

---

## 🔑 Default Login Credentials

After deployment, login with:

| Role       | Email                | Password      |
|------------|----------------------|---------------|
| Admin      | admin@ngo.org        | admin123      |
| Staff      | staff@ngo.org        | staff123      |
| Telecaller | telecaller@ngo.org   | telecaller123 |
| Accountant | accountant@ngo.org   | accountant123 |

**⚠️ Change these passwords immediately after first login!**

---

## 🔧 Environment Variables Cheat Sheet

### API Service (apps/api)
```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<generate-random-string>
JWT_REFRESH_SECRET=<generate-different-random-string>
API_PORT=3001
NODE_ENV=production
FRONTEND_URL=<your-frontend-url>
```

### Web Service (apps/web)
```env
NEXT_PUBLIC_API_URL=<your-api-url>
```

---

## 🐛 Troubleshooting Commands

### Check API Logs
```
Railway Dashboard → api service → Deployments → Latest → View Logs
```

### Check Frontend Logs
```
Railway Dashboard → web service → Deployments → Latest → View Logs
```

### Check Database
```bash
railway run psql $DATABASE_URL
```

### Re-run Migrations
```bash
railway service  # Select 'api'
railway run npx prisma migrate deploy
```

### Re-seed Database
```bash
railway service  # Select 'api'
railway run npx tsx prisma/seed.ts
```

---

## ❌ Common Errors & Fixes

### Error: "Cannot connect to database"
**Fix**: Check DATABASE_URL uses Railway reference
```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

### Error: "CORS policy blocked"
**Fix**: Update FRONTEND_URL in API service to match your frontend URL exactly

### Error: "Module not found"
**Fix**: Check Root Directory is set correctly
- API: `apps/api`
- Web: `apps/web`

### Error: "Build failed"
**Fix**: Check build command includes `npm install`
```
npm install && npm run build
```

### Error: "Cannot GET /"
**Fix**: This is normal for API. Try `/api/auth/profile` instead

---

## 💰 Cost Tracking

### Free Tier
- $5 credit/month
- ~500 hours usage
- ~10 days for 3 services

### Monitor Usage
```
Railway Dashboard → Project → Usage
```

### Upgrade When Needed
```
Settings → Billing → Subscribe to Hobby ($5/month)
```

---

## 🔄 Update Application

### Push Changes
```bash
git add .
git commit -m "Your changes"
git push origin main
```

Railway auto-deploys! ✨

### Manual Redeploy
```
Service → Deployments → ... → Redeploy
```

---

## 📊 Service Status

### Healthy Deployment
- ✅ Green status indicator
- ✅ No errors in logs
- ✅ Domain accessible
- ✅ Can login to application

### Check Health
```
API: https://your-api-url.railway.app/api/auth/profile
Frontend: https://your-web-url.railway.app
```

---

## 🔐 Security Checklist

- [ ] Changed JWT_SECRET from example
- [ ] Changed JWT_REFRESH_SECRET from example
- [ ] Changed all default user passwords
- [ ] Enabled 2FA on GitHub
- [ ] Enabled 2FA on Railway
- [ ] FRONTEND_URL matches exactly
- [ ] NEXT_PUBLIC_API_URL matches exactly

---

## 📞 Support Links

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Your Repo**: https://github.com/ashakuteer/DMS
- **Full Guide**: See `RAILWAY_DEPLOYMENT.md`

---

## ✅ Success Checklist

- [ ] PostgreSQL service running (green)
- [ ] API service running (green)
- [ ] Web service running (green)
- [ ] Migrations completed
- [ ] Database seeded
- [ ] Can access frontend URL
- [ ] Can login with admin@ngo.org
- [ ] Dashboard loads correctly
- [ ] No CORS errors in browser console

---

## 🎯 Your URLs

Fill these in after deployment:

```
Frontend: https://________________________________.up.railway.app
API:      https://________________________________.up.railway.app
Database: (Railway Dashboard → Postgres → Connect)
```

---

**Need detailed instructions? See `RAILWAY_DEPLOYMENT.md`**

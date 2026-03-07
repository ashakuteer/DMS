# Quick Reference Card

## 🎯 Your Project Details

**Project Name**: DMS Donor Management System  
**Tech Stack**: NestJS + Prisma + Supabase + Railway  
**API Location**: `DMS-main/apps/api`

---

## 🔗 Important URLs

### Supabase
- Dashboard: https://supabase.com/dashboard
- Your Project: `ovxfbfcrtwrhfugvwjym`
- Region: `ap-south-1`

### Railway (after deployment)
- Dashboard: https://railway.app/dashboard
- Your API URL: `https://[your-app].up.railway.app`

### GitHub (after setup)
- Your Repo: `https://github.com/[YOUR-USERNAME]/dms-donor-management`

---

## 📋 Environment Variables (for Railway)

```env
DATABASE_URL=postgresql://postgres.ovxfbfcrtwrhfugvwjym:AshaSupaDb26*@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true

DIRECT_URL=postgresql://postgres.ovxfbfcrtwrhfugvwjym:AshaSupaDb26*@aws-1-ap-south-1.pooler.supabase.com:5432/postgres

JWT_SECRET=railway-production-jwt-secret-2024-CHANGE-THIS

JWT_REFRESH_SECRET=railway-production-refresh-secret-2024-CHANGE-THIS

NODE_ENV=production

FRONTEND_URL=http://localhost:5000
```

---

## 🛠️ Railway Configuration

**Root Directory**: `apps/api`

**Build Command**:
```bash
npm install && npx prisma generate --schema=prisma/schema.prisma && npm run build
```

**Start Command**:
```bash
npx prisma migrate deploy --schema=prisma/schema.prisma && npm run start:prod
```

---

## 📝 Git Commands (Quick Copy-Paste)

```bash
# First time setup
cd C:\Users\G.Sruthi\Downloads\DMS-main\DMS-main
git init
git config user.name "Your Name"
git config user.email "your.email@example.com"
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/dms-donor-management.git
git push -u origin main

# Future updates
git add .
git commit -m "Your update message"
git push
```

---

## 🔍 Useful Commands

### Check Git Installation
```bash
git --version
```

### Check Node/npm Installation
```bash
node --version
npm --version
```

### View Railway Logs (in Railway Dashboard)
Deployments → Click deployment → View Logs

### Check Supabase Tables
Supabase Dashboard → Table Editor

---

## 📞 Support Links

- **Git Download**: https://git-scm.com/download/win
- **GitHub Signup**: https://github.com/signup
- **Railway Signup**: https://railway.app
- **Supabase Docs**: https://supabase.com/docs
- **NestJS Docs**: https://docs.nestjs.com
- **Prisma Docs**: https://www.prisma.io/docs

---

## ✅ Deployment Checklist

- [ ] Git installed
- [ ] GitHub account created
- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Railway account created
- [ ] Railway project created
- [ ] Root directory set to `apps/api`
- [ ] All environment variables added
- [ ] Build & start commands configured
- [ ] Deployment successful
- [ ] API URL accessible
- [ ] Supabase tables created

---

## 🎯 What to Do Right Now

1. Open `START_HERE.md`
2. Follow the steps in order
3. Don't skip any steps
4. Check off items as you complete them

**Estimated Time**: 20-30 minutes total

# Deployment Checklist

Use this checklist to ensure a smooth deployment process.

---

## Pre-Deployment

### Code Preparation
- [ ] All code is committed to Git
- [ ] `.env` files are in `.gitignore` (not committed)
- [ ] `.env.example` files exist with sample values
- [ ] Dependencies are listed in `package.json`
- [ ] Build scripts work locally (`npm run build`)
- [ ] Tests pass (if you have tests)

### Accounts Setup
- [ ] GitHub account created
- [ ] Railway account created (https://railway.app)
- [ ] Vercel account created (https://vercel.com)
- [ ] All accounts verified via email

### Documentation Review
- [ ] Read `QUICK_START.md`
- [ ] Understand `DEPLOYMENT_SUMMARY.md`
- [ ] Review environment variables needed

---

## GitHub Setup

- [ ] Created new repository on GitHub
- [ ] Repository is public or private (your choice)
- [ ] Local git initialized (`git init`)
- [ ] All files added (`git add .`)
- [ ] Initial commit made (`git commit -m "Initial commit"`)
- [ ] Remote added (`git remote add origin ...`)
- [ ] Code pushed to GitHub (`git push -u origin main`)
- [ ] Verify code is visible on GitHub

---

## Railway Deployment

### Database Setup
- [ ] Logged into Railway dashboard
- [ ] Created new project
- [ ] Added PostgreSQL database
- [ ] Database is provisioned and running
- [ ] Copied `DATABASE_URL` from Variables tab

### API Deployment
- [ ] Clicked "New" → "GitHub Repo"
- [ ] Selected correct repository
- [ ] Railway detected `railway.json` config
- [ ] Deployment started automatically

### Environment Variables
- [ ] Added `DATABASE_URL` (from PostgreSQL service)
- [ ] Added `JWT_SECRET` (strong random string)
- [ ] Added `JWT_REFRESH_SECRET` (different random string)
- [ ] Added `API_PORT=3001`
- [ ] Added `FRONTEND_URL` (will update after Vercel)
- [ ] Added `NODE_ENV=production`
- [ ] Saved all variables

### Domain & Networking
- [ ] Went to Settings → Networking
- [ ] Generated public domain
- [ ] Copied API URL (e.g., `https://xxx.railway.app`)
- [ ] API is accessible (check in browser)

### Database Migration
- [ ] Opened Railway API service
- [ ] Clicked "..." → "Run Command"
- [ ] Ran: `npx prisma migrate deploy`
- [ ] Migration completed successfully
- [ ] Ran: `npx tsx prisma/seed.ts`
- [ ] Seed data loaded successfully

### Verification
- [ ] API is running (green status)
- [ ] No errors in logs
- [ ] Can access API URL in browser
- [ ] Database has tables (check in Railway DB tab)

---

## Vercel Deployment

### Project Import
- [ ] Logged into Vercel dashboard
- [ ] Clicked "Add New" → "Project"
- [ ] Selected GitHub repository
- [ ] Authorized Vercel to access repo

### Configuration
- [ ] Framework preset: Next.js (auto-detected)
- [ ] Root directory: `apps/web`
- [ ] Build command: `npm run build` (auto-detected)
- [ ] Output directory: `.next` (auto-detected)

### Environment Variables
- [ ] Added `NEXT_PUBLIC_API_URL`
- [ ] Value is Railway API URL (from previous step)
- [ ] Applied to Production, Preview, Development

### Deployment
- [ ] Clicked "Deploy"
- [ ] Build started
- [ ] Build completed successfully (no errors)
- [ ] Deployment is live
- [ ] Copied Vercel URL (e.g., `https://xxx.vercel.app`)

### Verification
- [ ] Can access Vercel URL in browser
- [ ] Login page loads correctly
- [ ] No console errors in browser DevTools

---

## Final Configuration

### Update Railway
- [ ] Went back to Railway dashboard
- [ ] Opened API service
- [ ] Updated `FRONTEND_URL` to Vercel URL
- [ ] Saved changes
- [ ] Redeployed API service

### Update vercel.json (Optional)
- [ ] Opened `vercel.json` in code editor
- [ ] Updated API URL in rewrites section
- [ ] Committed and pushed changes
- [ ] Vercel auto-deployed

---

## Testing

### Authentication
- [ ] Opened Vercel URL in browser
- [ ] Login page loads
- [ ] Tried login with: `admin@ngo.org` / `admin123`
- [ ] Login successful
- [ ] Redirected to dashboard
- [ ] JWT token stored correctly

### API Connection
- [ ] Dashboard loads data from API
- [ ] No CORS errors in console
- [ ] Can navigate between pages
- [ ] Logout works

### All User Roles
- [ ] Admin login works
- [ ] Staff login works (`staff@ngo.org` / `staff123`)
- [ ] Telecaller login works (`telecaller@ngo.org` / `telecaller123`)
- [ ] Accountant login works (`accountant@ngo.org` / `accountant123`)

### Permissions
- [ ] Admin can access all pages
- [ ] Staff has appropriate access
- [ ] Telecaller has limited access
- [ ] Accountant has appropriate access

---

## Security Hardening

### Passwords
- [ ] Changed admin password from default
- [ ] Changed staff password from default
- [ ] Changed telecaller password from default
- [ ] Changed accountant password from default
- [ ] All passwords are strong (12+ characters)

### Secrets
- [ ] JWT_SECRET is strong random string (not default)
- [ ] JWT_REFRESH_SECRET is different from JWT_SECRET
- [ ] Database password is strong (Railway auto-generated)

### Access Control
- [ ] Enabled 2FA on GitHub account
- [ ] Enabled 2FA on Railway account
- [ ] Enabled 2FA on Vercel account
- [ ] Reviewed team access (if applicable)

### CORS
- [ ] FRONTEND_URL in Railway matches Vercel URL exactly
- [ ] No trailing slashes in URLs
- [ ] CORS errors resolved

---

## Monitoring Setup

### Railway
- [ ] Bookmarked Railway dashboard
- [ ] Checked logs for errors
- [ ] Set up email notifications (optional)
- [ ] Reviewed resource usage

### Vercel
- [ ] Bookmarked Vercel dashboard
- [ ] Checked deployment logs
- [ ] Reviewed analytics (optional)
- [ ] Set up email notifications (optional)

### Database
- [ ] Verified database backups enabled (Railway auto-backup)
- [ ] Noted backup schedule
- [ ] Tested database connection

---

## Documentation

### Internal Docs
- [ ] Documented deployment URLs
- [ ] Saved environment variables securely
- [ ] Created admin guide for staff
- [ ] Documented user roles and permissions

### URLs to Save
```
Frontend URL: https://_____.vercel.app
API URL: https://_____.railway.app
Database: (Railway dashboard)
GitHub Repo: https://github.com/_____/_____
```

### Credentials to Save (Securely!)
```
Railway Login: _____
Vercel Login: _____
GitHub Login: _____
Database Password: (in Railway)
JWT_SECRET: _____
JWT_REFRESH_SECRET: _____
```

---

## Post-Deployment

### Communication
- [ ] Notified team that system is live
- [ ] Shared login URLs with users
- [ ] Provided initial credentials (to be changed)
- [ ] Scheduled training session

### Monitoring
- [ ] Checked system daily for first week
- [ ] Monitored error logs
- [ ] Collected user feedback
- [ ] Fixed any issues promptly

### Optimization
- [ ] Reviewed performance metrics
- [ ] Optimized slow queries (if any)
- [ ] Adjusted resource allocation (if needed)
- [ ] Planned for scaling (if needed)

---

## Troubleshooting

If something goes wrong, check:

### Frontend Issues
- [ ] Vercel build logs for errors
- [ ] Browser console for errors
- [ ] `NEXT_PUBLIC_API_URL` is correct
- [ ] API is accessible from browser

### Backend Issues
- [ ] Railway logs for errors
- [ ] Database connection is working
- [ ] Environment variables are set
- [ ] Migrations ran successfully

### Connection Issues
- [ ] CORS configuration (FRONTEND_URL)
- [ ] URLs don't have trailing slashes
- [ ] HTTPS is used (not HTTP)
- [ ] Firewall/network not blocking

### Database Issues
- [ ] DATABASE_URL is correct
- [ ] Database is running
- [ ] Migrations are up to date
- [ ] Seed data is loaded

---

## Success Criteria

Your deployment is successful when:

✅ Frontend loads at Vercel URL
✅ Can login with all user roles
✅ Dashboard displays correctly
✅ API responds to requests
✅ Database stores data
✅ No errors in logs
✅ CORS is configured correctly
✅ All security measures in place

---

## Next Steps

After successful deployment:

1. **Customize**: Add your NGO's branding and logo
2. **Train**: Teach staff how to use the system
3. **Data Entry**: Start adding real donors and donations
4. **Monitor**: Keep an eye on logs and performance
5. **Iterate**: Gather feedback and improve
6. **Scale**: Upgrade resources as needed

---

## Need Help?

- Check `DEPLOYMENT.md` for detailed instructions
- Review `DEPLOYMENT_SUMMARY.md` for FAQ
- Check Railway/Vercel documentation
- Review error logs for specific issues

---

**Congratulations on deploying your NGO Donor Management System! 🎉**

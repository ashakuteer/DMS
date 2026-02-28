# Railway Deployment Troubleshooting Guide

## Common Issues & Solutions for Monorepo Deployment

---

## Issue 1: "Cannot find module '@ngo-donor/shared'"

### Symptoms
- Build fails with module not found error
- Error mentions `@ngo-donor/shared`

### Cause
Railway doesn't understand workspace dependencies by default

### Solution

**Option A: Update package.json (Recommended)**

In `apps/api/package.json` and `apps/web/package.json`, change:
```json
"@ngo-donor/shared": "workspace:*"
```
to:
```json
"@ngo-donor/shared": "file:../../packages/shared"
```

**Option B: Use pnpm**

In Railway service settings:
- Build Command: `npm install -g pnpm && pnpm install && pnpm build`
- Start Command: `pnpm start:prod` (for API) or `pnpm start` (for web)

---

## Issue 2: "Prisma Client Not Generated"

### Symptoms
- Error: `@prisma/client did not initialize yet`
- Build succeeds but runtime fails

### Cause
Prisma client not generated during build

### Solution

The `postinstall` script should handle this, but if it doesn't:

**Update Build Command:**
```
npm install && npx prisma generate --schema=prisma/schema.prisma && npm run build
```

---

## Issue 3: "Database Connection Failed"

### Symptoms
- Error: `Can't reach database server`
- Error: `Connection refused`

### Cause
DATABASE_URL not configured correctly

### Solution

1. Check DATABASE_URL format in API service:
   ```env
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```

2. Verify PostgreSQL service is running (green status)

3. Check service linking:
   - Go to API service → Settings → Service Variables
   - Ensure Postgres service is linked

4. If using manual URL, format should be:
   ```
   postgresql://postgres:password@host:port/database
   ```

---

## Issue 4: "Migrations Not Applied"

### Symptoms
- Error: `Table 'users' doesn't exist`
- Database is empty

### Cause
Migrations haven't been run

### Solution

**Using Railway CLI:**
```bash
railway login
railway link
railway service  # Select 'api'
railway run npx prisma migrate deploy
```

**Using Custom Start Command (Temporary):**
1. Go to API service → Settings
2. Change Start Command to:
   ```
   npx prisma migrate deploy && npm run start:prod
   ```
3. Redeploy
4. After successful deployment, change back to: `npm run start:prod`

---

## Issue 5: "CORS Error in Browser"

### Symptoms
- Browser console shows: `Access to fetch blocked by CORS policy`
- API works in Postman but not in browser

### Cause
FRONTEND_URL in API doesn't match actual frontend URL

### Solution

1. Get exact frontend URL from Railway (including https://)
2. Update API service environment variable:
   ```env
   FRONTEND_URL=https://web-production-xxxx.up.railway.app
   ```
3. Ensure NO trailing slash
4. Redeploy API service

---

## Issue 6: "Build Succeeds but Service Crashes"

### Symptoms
- Build completes successfully
- Service starts then immediately crashes
- Logs show "Application failed to start"

### Cause
Usually wrong start command or missing dependencies

### Solution

**For API:**
1. Check Start Command: `npm run start:prod`
2. Verify `dist/src/main.js` exists after build
3. Check logs for specific error

**For Web:**
1. Check Start Command: `npm run start`
2. Verify `.next` folder exists after build
3. Ensure PORT environment variable is not set (Next.js uses 3000 by default)

---

## Issue 7: "Cannot Seed Database"

### Symptoms
- Migrations work but seed fails
- Error: `Cannot find module 'tsx'`

### Cause
`tsx` is in devDependencies but needed for seeding

### Solution

**Option A: Install tsx globally in Railway**
```bash
railway run npm install -g tsx
railway run tsx prisma/seed.ts
```

**Option B: Use ts-node**
Update `apps/api/package.json`:
```json
"prisma:seed": "ts-node prisma/seed.ts"
```

**Option C: Compile seed file**
```bash
railway run npx tsc prisma/seed.ts
railway run node prisma/seed.js
```

---

## Issue 8: "Frontend Can't Connect to API"

### Symptoms
- Frontend loads but shows no data
- Network tab shows 404 or connection refused

### Cause
NEXT_PUBLIC_API_URL not set or incorrect

### Solution

1. Verify API URL is accessible:
   ```
   curl https://api-production-xxxx.up.railway.app/api/auth/profile
   ```

2. Check Web service environment variable:
   ```env
   NEXT_PUBLIC_API_URL=https://api-production-xxxx.up.railway.app
   ```

3. Ensure NO trailing slash

4. Redeploy Web service (environment variables require rebuild)

---

## Issue 9: "Root Directory Not Found"

### Symptoms
- Error: `No such file or directory: apps/api`
- Build fails immediately

### Cause
Root directory path is incorrect

### Solution

1. Go to service → Settings
2. Set Root Directory to exactly:
   - For API: `apps/api`
   - For Web: `apps/web`
3. Case-sensitive! Must match your repo structure
4. No leading or trailing slashes

---

## Issue 10: "Out of Memory During Build"

### Symptoms
- Build fails with: `JavaScript heap out of memory`
- Build works locally but fails on Railway

### Cause
Railway free tier has limited memory

### Solution

**Option A: Increase Node memory**
Update Build Command:
```
NODE_OPTIONS="--max-old-space-size=4096" npm install && npm run build
```

**Option B: Optimize build**
- Remove unused dependencies
- Use production build only
- Clear cache before build

**Option C: Upgrade Railway plan**
- Hobby plan has more resources

---

## Issue 11: "JWT Token Invalid"

### Symptoms
- Login works but subsequent requests fail
- Error: `Unauthorized` or `Invalid token`

### Cause
JWT_SECRET mismatch or not set

### Solution

1. Verify JWT_SECRET is set in API service
2. Ensure it's the same value used to sign tokens
3. Check JWT_REFRESH_SECRET is also set
4. Restart API service after changing secrets

---

## Issue 12: "Port Already in Use"

### Symptoms
- Error: `Port 3001 is already in use`
- Service fails to start

### Cause
Railway assigns dynamic ports

### Solution

Update your API main file to use Railway's PORT:

```typescript
// apps/api/src/main.ts
const port = process.env.PORT || process.env.API_PORT || 3001;
await app.listen(port);
```

Then in Railway, you can remove API_PORT variable or keep it as fallback.

---

## Issue 13: "Workspace Dependencies Not Resolving"

### Symptoms
- Error: `Cannot find package '@ngo-donor/shared'`
- Build fails when importing shared package

### Cause
Monorepo workspace protocol not supported

### Solution

**Option A: Use file: protocol**

Update both `apps/api/package.json` and `apps/web/package.json`:
```json
{
  "dependencies": {
    "@ngo-donor/shared": "file:../../packages/shared"
  }
}
```

**Option B: Copy shared package**

Create a build script that copies shared package:
```bash
# In apps/api or apps/web
cp -r ../../packages/shared ./node_modules/@ngo-donor/
```

**Option C: Use pnpm**

Railway supports pnpm workspaces better:
```
Build Command: npm install -g pnpm && pnpm install && pnpm build
```

---

## Issue 14: "Environment Variables Not Loading"

### Symptoms
- `process.env.VARIABLE_NAME` is undefined
- Works locally but not on Railway

### Cause
Variables not set in Railway or wrong service

### Solution

1. Go to correct service (api or web)
2. Go to Variables tab
3. Add variable
4. **Important**: Redeploy after adding variables
5. For Next.js, variables must start with `NEXT_PUBLIC_` to be available in browser

---

## Issue 15: "Database Seeding Fails with Unique Constraint"

### Symptoms
- Error: `Unique constraint failed on the fields: (email)`
- Seed script fails

### Cause
Database already has seeded data

### Solution

**Option A: Clear database first**
```bash
railway run npx prisma migrate reset --force
railway run npx tsx prisma/seed.ts
```

**Option B: Update seed script to handle existing data**
Use `upsert` instead of `create` in seed file.

---

## Debugging Tips

### 1. Check Service Logs
```
Railway Dashboard → Service → Deployments → Latest → View Logs
```

### 2. Use Railway CLI for Interactive Debugging
```bash
railway login
railway link
railway service  # Select service
railway run bash  # Get shell access
```

### 3. Test API Endpoints
```bash
# Test health
curl https://your-api.railway.app/api/auth/profile

# Test with auth
curl -H "Authorization: Bearer YOUR_TOKEN" https://your-api.railway.app/api/donors
```

### 4. Check Environment Variables
```bash
railway run env  # List all environment variables
```

### 5. Verify Build Output
```bash
railway run ls -la dist/  # For API
railway run ls -la .next/  # For Web
```

---

## Getting Help

### 1. Check Railway Status
https://status.railway.app

### 2. Railway Discord
https://discord.gg/railway
- Very active community
- Railway team responds quickly

### 3. Railway Docs
https://docs.railway.app

### 4. GitHub Issues
https://github.com/ashakuteer/DMS/issues

---

## Prevention Checklist

Before deploying:
- [ ] Test build locally: `npm run build`
- [ ] Verify all dependencies in package.json
- [ ] Check environment variables are documented
- [ ] Test database connection locally
- [ ] Run migrations locally first
- [ ] Verify seed script works
- [ ] Check CORS configuration
- [ ] Review logs for warnings

---

## Emergency Rollback

If deployment breaks production:

1. Go to Service → Deployments
2. Find last working deployment
3. Click "..." → "Redeploy"
4. Railway will rollback to that version

---

## Still Stuck?

1. **Check logs first** - 90% of issues are visible in logs
2. **Verify environment variables** - Most common issue
3. **Test locally** - Ensure it works on your machine
4. **Search Railway Discord** - Someone likely had same issue
5. **Ask for help** - Provide logs and error messages

---

**Remember**: Railway logs are your best friend! Always check them first.

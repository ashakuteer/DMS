# Push Updated Dockerfile to GitHub

## You Need to Do This Manually (Git Not Installed)

### Option 1: Install Git and Push (Recommended)

1. **Download Git**: https://git-scm.com/download/win
2. **Install it** (use default settings)
3. **Restart VS Code**
4. **Open terminal and run**:
   ```bash
   cd C:\Users\G.Sruthi\Downloads\DMS-main\DMS-main
   git add apps/api/Dockerfile
   git commit -m "Fix Dockerfile for Railway"
   git push
   ```

### Option 2: Use GitHub Desktop (Easier)

1. **Download GitHub Desktop**: https://desktop.github.com
2. **Install and sign in**
3. **Add your repository** (File → Add Local Repository)
4. **Select**: `C:\Users\G.Sruthi\Downloads\DMS-main\DMS-main`
5. **You'll see "Dockerfile" in changed files**
6. **Write commit message**: "Fix Dockerfile for Railway"
7. **Click "Commit to main"**
8. **Click "Push origin"**

### Option 3: Upload Directly on GitHub Website

1. **Go to your GitHub repository**
2. **Navigate to**: `apps/api/`
3. **Click on "Dockerfile"**
4. **Click the pencil icon** (Edit this file)
5. **Replace ALL content with this**:

```dockerfile
# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate --schema=prisma/schema.prisma

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port (Railway will override this)
EXPOSE 3001

# Start command
CMD ["sh", "-c", "npx prisma db push --schema=prisma/schema.prisma && npm run start:prod"]
```

6. **Scroll down**
7. **Write commit message**: "Fix Dockerfile for Railway"
8. **Click "Commit changes"**

---

## After Pushing to GitHub

### Go Back to Railway:

1. **Railway will automatically detect the new commit**
2. **It will start a new deployment**
3. **Watch the logs**
4. **This time it should work!**

### If Railway Doesn't Auto-Deploy:

1. **Go to Deployments tab**
2. **Click "Redeploy"**
3. **Select the latest commit**

---

## What the New Dockerfile Does:

✅ Works with Root Directory set to `apps/api`  
✅ Doesn't need monorepo files  
✅ Installs dependencies with npm  
✅ Generates Prisma Client  
✅ Builds NestJS app  
✅ Pushes schema to Supabase on startup  
✅ Starts the production server  

---

## Expected Build Output:

```
✅ Pulling Docker image node:20-alpine
✅ Installing dependencies...
✅ Generating Prisma Client...
✅ Building NestJS application...
✅ Starting server...
✅ Pushing schema to Supabase...
✅ API server running on port 3001
```

---

## Next Step:

Choose ONE of the 3 options above to push the updated Dockerfile to GitHub, then Railway will automatically redeploy!

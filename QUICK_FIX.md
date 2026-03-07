# Quick Fix for Setup Issues

## Problem
npm is looking for `mingw-get-setup.exe` which is causing installation failures.

## Solution

### Step 1: Clean npm Cache
Open PowerShell or Command Prompt and run:
```bash
npm cache clean --force
```

### Step 2: Delete node_modules (if needed)
```bash
cd C:\Users\G.Sruthi\Downloads\DMS-main\DMS-main
rmdir /s /q node_modules
```

### Step 3: Install Dependencies Again
```bash
npm install
```
Wait for this to complete (5-10 minutes).

### Step 4: Generate Prisma Client
```bash
npx prisma generate --schema=apps/api/prisma/schema.prisma
```

### Step 5: Push Schema to Supabase
```bash
npx prisma db push --schema=apps/api/prisma/schema.prisma
```

### Step 6: Start the API
```bash
cd apps\api
npm run dev
```

---

## Alternative: Use the Installed Prisma

If npm install completed successfully, try:

```bash
cd C:\Users\G.Sruthi\Downloads\DMS-main\DMS-main

# Generate Prisma Client
node_modules\.bin\prisma generate --schema=apps/api/prisma/schema.prisma

# Push to Supabase
node_modules\.bin\prisma db push --schema=apps/api/prisma/schema.prisma

# Start API
cd apps\api
npm run dev
```

---

## Check if Dependencies are Installed

Run this to see if node_modules exists and has content:
```bash
dir node_modules
```

You should see folders like `@prisma`, `prisma`, `@nestjs`, etc.

---

## If Still Having Issues

The `mingw-get-setup.exe` error suggests npm's PATH is corrupted. Try:

1. Close all terminals
2. Restart VS Code
3. Open a NEW terminal
4. Try the commands again

Or use the full path to npm:
```bash
"C:\Program Files\nodejs\npm.cmd" install
```

# Supabase Connection Setup Guide

## Prerequisites
- You have a Supabase account at https://supabase.com
- You have created a project in Supabase
- Node.js and npm are installed on your machine

---

## Step 1: Get Your Supabase Connection Strings

### 1.1 Open Supabase Dashboard
- Go to https://supabase.com/dashboard
- Click on your project

### 1.2 Navigate to Database Settings
- On the left sidebar, click the **Settings** icon (gear icon at bottom)
- Click **Database** from the settings menu

### 1.3 Find Connection Strings
Scroll down to the **Connection string** section. You'll see several tabs:

#### Tab 1: "URI" or "Connection Pooling"
- Click on the **URI** tab
- You'll see a dropdown - select **Transaction** mode
- Copy the entire connection string
- It looks like: `postgresql://postgres.xxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
- **IMPORTANT**: Replace `[YOUR-PASSWORD]` with your actual database password
- This is your **DATABASE_URL** (uses port 6543)

#### Tab 2: "Session" or Direct Connection  
- Click on the **Session** tab (or look for "Direct connection")
- Copy this connection string
- It looks like: `postgresql://postgres.xxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres`
- **IMPORTANT**: Replace `[YOUR-PASSWORD]` with your actual database password
- This is your **DIRECT_URL** (uses port 5432)

### 1.4 Find Your Database Password
If you forgot your database password:
- In the same Database settings page
- Scroll to **Database password** section
- Click **Reset database password**
- Copy the new password immediately (you won't see it again!)

---

---

## Step 2: Create Your .env File

### 2.1 Navigate to API Directory
Open your terminal and run:
```bash
cd DMS-main/apps/api
```

### 2.2 Check if .env.example Exists
```bash
ls -la
```
You should see `.env.example` in the list.

### 2.3 Create .env File
**On Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**On Windows (CMD):**
```cmd
copy .env.example .env
```

**On Mac/Linux:**
```bash
cp .env.example .env
```

---

## Step 3: Update Your .env File

### 3.1 Open .env File
Open the newly created `.env` file in your code editor (VS Code, Notepad++, etc.)

### 3.2 Replace Database URLs
Find these lines at the top:
```env
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

Replace them with your actual Supabase connection strings from Step 1.

### 3.3 Example
If your Supabase gave you:
- Transaction mode: `postgresql://postgres.abcdefghijk:MySecretPass123@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
- Session mode: `postgresql://postgres.abcdefghijk:MySecretPass123@aws-0-us-east-1.pooler.supabase.com:5432/postgres`

Your .env should look like:
```env
DATABASE_URL="postgresql://postgres.abcdefghijk:MySecretPass123@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.abcdefghijk:MySecretPass123@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"

API_PORT=3001
FRONTEND_URL="http://localhost:5000"
```

### 3.4 Update JWT Secrets (Important for Security!)
Change these to random, secure strings:
```env
JWT_SECRET="change-this-to-a-long-random-string-abc123xyz789"
JWT_REFRESH_SECRET="change-this-to-another-long-random-string-def456uvw012"
```

### 3.5 Save the File
Press `Ctrl+S` (Windows/Linux) or `Cmd+S` (Mac) to save.

---

---

## Step 4: Install Dependencies

### 4.1 Make Sure You're in the API Directory
```bash
cd DMS-main/apps/api
```

### 4.2 Install Node Modules
```bash
npm install
```

Wait for all packages to install. This might take a few minutes.

---

## Step 5: Setup Database Tables in Supabase

Now we'll create all the tables your application needs in Supabase.

### 5.1 Generate Prisma Client
```bash
npm run prisma:generate
```

You should see: `✔ Generated Prisma Client`

### 5.2 Push Schema to Supabase
This creates all your database tables:
```bash
npm run prisma:push
```

You'll see output like:
```
🚀  Your database is now in sync with your Prisma schema.
✔ Generated Prisma Client
```

### 5.3 Verify Tables Were Created
- Go back to your Supabase dashboard
- Click **Table Editor** in the left sidebar
- You should now see all your tables: users, donors, donations, beneficiaries, etc.

### 5.4 (Optional) Seed Initial Data
If you want to add sample data:
```bash
npm run prisma:seed
```

---

## Step 6: Test Your Connection

### 6.1 Start the API Server
```bash
npm run dev
```

### 6.2 Check for Success
You should see output like:
```
[Nest] 12345  - 01/01/2024, 10:00:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 01/01/2024, 10:00:00 AM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 01/01/2024, 10:00:01 AM     LOG [NestApplication] Nest application successfully started
[Nest] 12345  - 01/01/2024, 10:00:01 AM     LOG Application is running on: http://localhost:3001
```

### 6.3 Test API Endpoint
Open your browser and go to:
```
http://localhost:3001
```

Or test with curl:
```bash
curl http://localhost:3001
```

If you see a response (not an error), your API is connected to Supabase successfully! 🎉

---

---

## Important Notes

### Why Two Connection Strings?
- **DATABASE_URL** (port 6543): Uses connection pooling - handles many connections efficiently. Your app uses this.
- **DIRECT_URL** (port 5432): Direct connection - required for database migrations and schema changes.

### Security
- ⚠️ **NEVER** commit your `.env` file to git
- ⚠️ Keep your database password secure
- ⚠️ Change JWT secrets to random strings in production

### Supabase Limits
- Free tier: 500MB database, 2GB bandwidth/month
- Connection pooling helps manage connection limits
- Upgrade if you need more resources

---

## Troubleshooting

### Error: "Can't reach database server"
**Solution:**
1. Check your internet connection
2. Verify the connection string is correct (no extra spaces)
3. Make sure you replaced `[YOUR-PASSWORD]` with actual password
4. Check if your Supabase project is active (not paused)

### Error: "Authentication failed"
**Solution:**
1. Your password is wrong
2. Go to Supabase Dashboard > Settings > Database
3. Reset your database password
4. Update the password in your `.env` file

### Error: "prepared statement already exists"
**Solution:**
- This happens when using wrong connection for migrations
- Make sure `DIRECT_URL` is set in your `.env`
- Use `npm run prisma:push` instead of `prisma migrate`

### Error: "Port 3001 already in use"
**Solution:**
1. Another app is using port 3001
2. Change `API_PORT=3002` in your `.env` file
3. Or stop the other application

### Tables Not Showing in Supabase
**Solution:**
1. Make sure `npm run prisma:push` completed successfully
2. Refresh your Supabase dashboard
3. Check the Table Editor tab (not SQL Editor)

### Connection Works Locally But Not in Production
**Solution:**
1. Make sure environment variables are set in your hosting platform
2. Use the correct connection string for your environment
3. Check if your hosting platform's IP is allowed in Supabase

---

## Quick Reference Commands

```bash
# Navigate to API folder
cd DMS-main/apps/api

# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate

# Create/update database tables
npm run prisma:push

# Seed sample data
npm run prisma:seed

# Start development server
npm run dev

# Start production server
npm run start:prod

# View database in Prisma Studio
npx prisma studio
```

---

## Next Steps

After successful connection:

1. **Test Authentication**: Try registering a user through your API
2. **Explore Supabase Features**: 
   - Use Table Editor to view/edit data
   - Set up Row Level Security (RLS) for extra security
   - Enable real-time subscriptions if needed
3. **Set Up Backups**: Configure automatic backups in Supabase settings
4. **Monitor Usage**: Check your database usage in Supabase dashboard

---

## Need Help?

- **Supabase Docs**: https://supabase.com/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **NestJS Docs**: https://docs.nestjs.com

If you're still stuck, check the error message carefully - it usually tells you exactly what's wrong!

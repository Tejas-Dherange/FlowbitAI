# Setup Guide

Complete step-by-step guide for setting up the Invoice Analytics Platform.

## Prerequisites

- Node.js 18.0 or later
- npm or pnpm
- PostgreSQL database access (or create free account on Neon)
- Git
- Code editor (VS Code recommended)

## Step 1: Database Setup

### Option A: Neon (Recommended - Free)

1. Go to https://console.neon.tech
2. Create free account
3. Create new project
4. Copy connection string (looks like: `postgresql://user:password@...`)
5. Keep this handy for Step 2

### Option B: Supabase

1. Go to https://app.supabase.com
2. Create new project
3. Copy PostgreSQL connection string
4. Connection string is in Project Settings → Database

### Option C: Local PostgreSQL

\`\`\`bash
# On macOS with Homebrew
brew install postgresql
brew services start postgresql

# Create database
createdb invoice_analytics

# Connection string: postgresql://localhost/invoice_analytics
\`\`\`

### Option D: Railway

1. Go to https://railway.app
2. Connect GitHub and create new project
3. Add PostgreSQL plugin
4. Copy connection string from connect tab

## Step 2: Project Setup

### 1. Clone Repository

\`\`\`bash
git clone <repository-url>
cd invoice-analytics
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
# or
pnpm install
\`\`\`

### 3. Create Environment File

Create `.env.local` file in project root:

\`\`\`bash
# Copy from your database provider
DATABASE_URL="postgresql://user:password@host:5432/database"

# Optional for deployment
NEXT_PUBLIC_API_URL="http://localhost:3000"
\`\`\`

**For Neon:**
- Visit https://console.neon.tech
- Copy connection string from "Connection String" field
- Paste into `DATABASE_URL`

**For Supabase:**
- Go to Project Settings → Database
- Copy "URI" from Connection Pooling
- Paste into `DATABASE_URL`

### 4. Verify Environment File

\`\`\`bash
# Check that .env.local exists and has DATABASE_URL
cat .env.local
\`\`\`

## Step 3: Initialize Database

### Create Tables

\`\`\`bash
npm run db:init
\`\`\`

This runs `scripts/init-db.sql` which creates:
- `vendors` table
- `customers` table
- `invoices` table
- `line_items` table
- `payments` table
- Necessary indexes

### Seed Sample Data

\`\`\`bash
npm run db:seed
\`\`\`

This populates:
- 3 sample vendors
- 2 sample customers
- 50 sample invoices with line items and payments
- Realistic dates and amounts

### Verify Data

\`\`\`bash
# Start dev server
npm run dev

# Visit http://localhost:3000
# You should see data on the dashboard
\`\`\`

## Step 4: Start Development

### Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Opens on http://localhost:3000

### Test Dashboard

1. Go to Dashboard (default page)
2. Should see metrics and charts
3. Should see invoice table with data
4. Try searching and filtering

### Test Chat

1. Go to "Chat with Data" page
2. Click example query or type your own
3. Should see SQL generated and results displayed
4. Try "What's the total spend?"

## Step 5: Deployment

### Deploy to Vercel

\`\`\`bash
# Push to GitHub
git add .
git commit -m "Initial commit"
git push origin main

# In Vercel dashboard
# 1. Click "New Project"
# 2. Import your GitHub repo
# 3. Set environment variable DATABASE_URL
# 4. Deploy
\`\`\`

### Environment Variables in Vercel

1. Go to your project in Vercel
2. Settings → Environment Variables
3. Add `DATABASE_URL` with your database connection string
4. Redeploy

## Troubleshooting

### "ECONNREFUSED" or Database Connection Error

**Problem**: Can't connect to database

**Solutions**:
1. Verify DATABASE_URL is correct
   \`\`\`bash
   echo $DATABASE_URL
   \`\`\`
2. Test connection string:
   - For Neon: Visit https://console.neon.tech and copy fresh connection string
   - For Supabase: Verify password is correct (case-sensitive)
   - For local: Ensure PostgreSQL is running

3. For Neon specifically:
   - Connection strings include "?sslmode=require" - this is correct
   - Don't modify the connection string

### "relation does not exist" or "table not found"

**Problem**: Tables not created

**Solution**:
\`\`\`bash
npm run db:init
\`\`\`

### No data shows on dashboard

**Problem**: Tables exist but are empty

**Solution**:
\`\`\`bash
npm run db:seed
\`\`\`

### "NEXT_RUNTIME_ERROR" or "DATABASE_URL not found"

**Problem**: Environment variable not loaded

**Solutions**:
1. Restart dev server: `npm run dev`
2. Check `.env.local` exists in root directory
3. No spaces around `=` in `.env.local`
4. Restart terminal/IDE

### Chat returns "Could not understand the query"

**Problem**: Query doesn't match known patterns

**Solution**: Try example queries:
- "What's the total spend in the last 90 days?"
- "List top 5 vendors by spend"
- "Show overdue invoices"

Or check `lib/sql-generator.ts` for available query patterns.

### "Could not generate SQL" or empty results

**Problem**: Query execution failed

**Solutions**:
1. Check database has data: `npm run db:seed`
2. Try simpler query
3. Check browser console for errors
4. Check server logs in terminal

### Port 3000 already in use

**Problem**: Another process using port 3000

**Solutions**:
\`\`\`bash
# Use different port
npm run dev -- -p 3001

# Or kill process on port 3000
# macOS/Linux:
lsof -ti :3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
\`\`\`

## Performance Tips

1. **Database Indexes** - Already created by `npm run db:init`
2. **Connection Pooling** - Use Neon or Supabase for free pooling
3. **Cache Results** - SWR handles caching automatically
4. **Limit Results** - Chat results limited to 1000 rows

## Security Checklist

- [ ] `.env.local` not committed to git (check `.gitignore`)
- [ ] DATABASE_URL is production URL for production
- [ ] No hardcoded credentials in code
- [ ] All API endpoints validate input
- [ ] Chat queries are read-only

## Next Steps

After setup:

1. **Explore Dashboard** - View metrics and trends
2. **Test Chat** - Ask questions about your data
3. **Customize** - Modify colors, fonts, branding
4. **Add More Data** - Modify `scripts/seed-db.ts`
5. **Deploy** - Push to production
6. **Integrate** - Connect to real invoice data source

## Getting Help

1. **Check error message** - Read and Google the error
2. **Check logs** - Terminal and browser console
3. **Restart everything** - `npm run dev`
4. **Clear cache** - Delete `.next` folder and restart
5. **Fresh clone** - Clone repo again in new folder

## Development Workflow

\`\`\`bash
# Start dev server
npm run dev

# In another terminal, make changes
# Server auto-reloads

# When ready to deploy
npm run build
npm start

# Run type checking
npm run type-check

# Run linting
npm run lint

# Vercel Deployment Fix Guide

## Current Issue
Your Vercel deployment is showing raw source code instead of running the application. This is because the build configuration is not properly set up for Vercel's serverless architecture.

## Steps to Fix

### 1. Database Setup
First, you need a production PostgreSQL database. You can use:
- **Vercel Postgres** (Recommended for integration)
- **Railway**
- **PlanetScale** 
- **Supabase**

For Vercel Postgres:
1. Go to your Vercel dashboard
2. Select your project
3. Go to Storage tab
4. Create a new PostgreSQL database
5. Copy the connection string

### 2. Environment Variables in Vercel
In your Vercel project settings, add these environment variables:

```
DATABASE_URL=your-production-database-connection-string
JWT_SECRET=your-super-secure-jwt-secret-key-change-this-in-production
SESSION_SECRET=your-session-secret-key-change-this-in-production
NODE_ENV=production
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ALLOWED_ORIGINS=https://alagarcater.vercel.app
LOG_LEVEL=info
COMPANY_NAME=Alagar Catering Services
COMPANY_EMAIL=info@algarcatering.com
COMPANY_PHONE=+91-XXX-XXX-XXXX
```

### 3. Update Build Commands in Vercel
In your Vercel project settings:
- **Build Command**: `npm run build`
- **Output Directory**: `dist/public`
- **Install Command**: `npm install`

### 4. Database Migration
After setting up the database, you need to run migrations:

1. Install Vercel CLI: `npm i -g vercel`
2. Link your project: `vercel link`
3. Run migrations: `vercel env pull .env.local` then `npx prisma migrate deploy`

### 5. Alternative Simpler Approach
If the above is complex, you can:

1. **Use a simpler hosting service** like Railway or Render that supports full-stack apps better
2. **Deploy separately**: Frontend on Vercel, Backend on Railway/Render
3. **Use Vercel's Full Stack template** and migrate your code

### 6. Immediate Fix for Current Deployment
The files I've created (vercel.json, api/index.js) should help, but you'll need to:

1. Push these changes to your repository
2. Set up the environment variables in Vercel
3. Set up a production database
4. Redeploy

### 7. Testing
After deployment:
1. Check `/api/health` endpoint
2. Test authentication endpoints
3. Verify database connectivity

## Next Steps
1. Set up production database
2. Configure environment variables in Vercel
3. Push the updated code
4. Monitor deployment logs in Vercel dashboard

Would you like me to help you with any specific step?

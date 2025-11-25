# 🚀 Vercel Deployment Guide

This guide will help you deploy GalaxyCo.ai 3.0 to Vercel for your business partner demo.

## ✅ Pre-Deployment Checklist

- [x] Project builds successfully (`npm run build`)
- [x] All environment variables documented
- [x] Clerk authentication configured
- [x] Sign-in/sign-up pages created

## 📋 Step-by-Step Deployment

### 1. Push to GitHub (if not already done)

```bash
git add .
git commit -m "feat: prepare for Vercel deployment"
git push origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository (`galaxyco-ai-3.0`)
4. Vercel will auto-detect Next.js settings

### 3. Configure Environment Variables

In Vercel dashboard, go to **Settings → Environment Variables** and add:

#### Required Variables:

```env
# Database (Neon)
DATABASE_URL=postgresql://...

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# AI Providers
OPENAI_API_KEY=sk-...

# Redis (Upstash)
UPSTASH_REDIS_URL=https://...
UPSTASH_REDIS_TOKEN=...

# Vector Database (Choose one)
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=...
# OR
UPSTASH_VECTOR_URL=https://...
UPSTASH_VECTOR_TOKEN=...

# Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN=vercel_blob_...

# App Config
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

**Important:** 
- Use **production** keys (not test keys) for Clerk
- Update `NEXT_PUBLIC_APP_URL` with your actual Vercel URL after first deployment
- Get `BLOB_READ_WRITE_TOKEN` from Vercel Dashboard → Storage

### 4. Update Clerk Settings

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Settings → Domains**
3. Add your Vercel domain (e.g., `your-app.vercel.app`)
4. Update **Allowed Origins** to include your Vercel URL

### 5. Set Up Database

If using Neon:
1. Make sure your database is accessible from the internet
2. Use the connection string from Neon dashboard
3. Run migrations if needed (Vercel will run `npm run build` which includes schema checks)

### 6. Deploy

1. Click **Deploy** in Vercel
2. Wait for build to complete (usually 2-3 minutes)
3. Visit your deployment URL

### 7. Post-Deployment Setup

#### Set Up Clerk Webhook (Recommended)

1. Go to Clerk Dashboard → **Webhooks**
2. Click **Add Endpoint**
3. URL: `https://your-app.vercel.app/api/webhooks/clerk`
4. Subscribe to events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Copy the signing secret
6. Add to Vercel environment variables:
   ```
   CLERK_WEBHOOK_SECRET=whsec_...
   ```
7. Redeploy to activate webhook

#### Seed Database (Optional)

If you want sample data for the demo:

```bash
# Connect to your production database
npm run db:push
npm run db:seed
```

Or use Drizzle Studio:
```bash
DATABASE_URL=your_production_url npm run db:studio
```

## 🎯 Testing Your Deployment

1. **Landing Page**: Visit `/` - should show landing page
2. **Sign Up**: Visit `/sign-up` - create a test account
3. **Dashboard**: After sign-up, should redirect to `/dashboard`
4. **Protected Routes**: Try accessing `/crm`, `/assistant`, etc.

## 🔧 Troubleshooting

### Build Fails

- Check environment variables are set correctly
- Verify all required services are accessible
- Check build logs in Vercel dashboard

### Authentication Not Working

- Verify Clerk keys are production keys (not test)
- Check Clerk domain settings include your Vercel URL
- Verify `NEXT_PUBLIC_CLERK_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL` match your routes

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check Neon database is running and accessible
- Ensure database allows connections from Vercel IPs

### API Routes Not Working

- Check middleware allows API routes (currently set to public for testing)
- Verify environment variables are available to API routes
- Check Vercel function logs for errors

## 📝 Notes for Demo

- The app is configured for demo purposes
- API routes are currently public (for testing)
- Some features may need additional setup (vector DB, etc.)
- Database will auto-create users/workspaces on first login

## 🎉 You're Ready!

Once deployed, share the Vercel URL with your business partner. They can:
1. Visit the landing page
2. Sign up for an account
3. Explore all features

---

**Need Help?** Check the build logs in Vercel dashboard or review the error messages.


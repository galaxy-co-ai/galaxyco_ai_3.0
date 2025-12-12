# Production Deployment Checklist

**Last Updated:** 2025-12-12  
**Status:** Pre-Production Security Audit

---

## ✅ Week 1 Security Fixes (COMPLETED)

### 1. Route Protection
- ✅ **Created `src/middleware.ts`** with Clerk authentication
- ✅ All protected routes now require authentication at the edge
- ✅ Public routes properly whitelisted (landing, auth, webhooks, legal)

### 2. Error Boundaries
- ✅ **Added ErrorBoundary to `(app)/layout.tsx`**
- ✅ All protected routes now wrapped in error boundaries
- ✅ Graceful error handling prevents app crashes

### 3. Environment Variable Audit
- ⚠️ **CRITICAL: Review before production deployment**

---

## 🔒 Environment Variables - Production Safety

### ❌ MUST BE DISABLED IN PRODUCTION

```bash
# DANGEROUS - Development Only
ALLOW_DEV_BYPASS=false          # ⚠️ MUST be false or removed in production
```

**Current Status:** 
- Found in `src/lib/auth.ts` lines 117-139
- Allows unauthenticated access when set to `true`
- **ACTION REQUIRED:** Verify this is NOT set in production environment variables

### ✅ Required Production Variables

```bash
# Authentication (Required)
CLERK_SECRET_KEY="sk_live_..."                    # Use LIVE keys, not test
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."

# Database (Required)
DATABASE_URL="postgresql://..."                    # Production database

# Encryption (Required)
ENCRYPTION_KEY="..."                               # 32-byte hex key

# App Configuration
NEXT_PUBLIC_APP_URL="https://app.galaxyco.ai"     # Production domain
NODE_ENV="production"                              # Must be production

# AI Services (Required)
OPENAI_API_KEY="sk-proj-..."
ANTHROPIC_API_KEY="sk-ant-..."                    # Optional but recommended
GOOGLE_AI_API_KEY="..."                           # Optional

# Infrastructure
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."
UPSTASH_VECTOR_REST_URL="..."
UPSTASH_VECTOR_REST_TOKEN="..."
BLOB_READ_WRITE_TOKEN="..."

# Monitoring
NEXT_PUBLIC_SENTRY_DSN="..."                      # Production Sentry project
SENTRY_ORG="galaxyco-ai"
SENTRY_PROJECT="..."

# Background Jobs
TRIGGER_SECRET_KEY="..."                          # Production key

# Webhooks
CLERK_WEBHOOK_SECRET="whsec_..."                  # Verify signature
STRIPE_WEBHOOK_SECRET="whsec_..."                 # Verify signature

# Communications
RESEND_API_KEY="..."
PUSHER_APP_ID="..."
PUSHER_KEY="..."
PUSHER_SECRET="..."
```

### ⚠️ Variables to Remove/Verify

```bash
# Development-Only (REMOVE from production)
EMAIL="you@example.com"                            # Only for local dev
PASSWORD="..."                                     # Only for local dev
ALLOW_ADMIN_BYPASS=false                          # Verify false or removed

# Test Keys (REPLACE with production)
CLERK_SECRET_KEY="sk_test_..."                    # Must be sk_live_...
STRIPE_SECRET_KEY="sk_test_..."                   # Must be sk_live_...
```

---

## 🔐 Security Verification Steps

### Before Production Deployment:

1. **Environment Variable Audit**
   ```bash
   # In production environment (Vercel Dashboard):
   # 1. Check ALLOW_DEV_BYPASS is NOT set or is false
   # 2. Verify all *_test_* keys are replaced with *_live_*
   # 3. Confirm NEXT_PUBLIC_APP_URL points to production domain
   # 4. Ensure NODE_ENV=production
   ```

2. **Middleware Test**
   ```bash
   # After deployment, verify:
   # 1. Cannot access /dashboard without login
   # 2. Redirects to /sign-in when unauthenticated
   # 3. Can access public routes (/, /pricing, etc.)
   # 4. Webhooks still work (/api/webhooks/*)
   ```

3. **Error Boundary Test**
   ```bash
   # Verify error boundaries catch errors:
   # 1. Trigger an error in dashboard
   # 2. Should show error UI, not crash app
   # 3. "Try Again" and "Go to Dashboard" buttons work
   ```

4. **Admin Access Test**
   ```bash
   # Verify admin whitelist:
   # 1. Only emails in SYSTEM_ADMIN_EMAILS can access /admin
   # 2. Check src/lib/auth.ts lines 15-19
   # 3. Update list before production
   ```

---

## 📋 Deployment Steps

### 1. Pre-Deployment (Local)
- [ ] Run `npm run build` - ensure builds successfully
- [ ] Run `npm run typecheck` - zero TypeScript errors
- [ ] Run `npm run lint` - zero linting errors
- [ ] Test locally with production-like .env

### 2. Environment Setup (Vercel Dashboard)
- [ ] Add all required production env vars
- [ ] Verify ALLOW_DEV_BYPASS is NOT set
- [ ] Confirm Clerk keys are LIVE (not test)
- [ ] Confirm Stripe keys are LIVE (not test)
- [ ] Set NODE_ENV=production

### 3. Deploy
- [ ] Deploy to production
- [ ] Verify deployment succeeds
- [ ] Check build logs for warnings

### 4. Post-Deployment Verification
- [ ] Test unauthenticated access to /dashboard → redirects to /sign-in
- [ ] Test authentication flow → login works
- [ ] Test dashboard loads → no errors
- [ ] Test CRM → loads correctly
- [ ] Test Neptune AI → assistant responds
- [ ] Test admin access → only admins can access /admin
- [ ] Check Sentry → errors being logged
- [ ] Check Trigger.dev → jobs are running

---

## 🚨 Rollback Plan

If critical issues occur after deployment:

1. **Immediate Rollback**
   ```bash
   # In Vercel Dashboard:
   # 1. Go to Deployments
   # 2. Find last working deployment
   # 3. Click "..." → "Promote to Production"
   ```

2. **Database Issues**
   - If database migration failed, revert migration
   - Check Drizzle migration logs
   - Run rollback migration if available

3. **Environment Variables**
   - Double-check all env vars in Vercel Dashboard
   - Compare with .env.example
   - Redeploy after fixing

---

## 📊 Post-Launch Monitoring

### First 24 Hours
- [ ] Monitor Sentry for errors
- [ ] Check Trigger.dev job success rates
- [ ] Monitor user sign-ups
- [ ] Check API response times
- [ ] Verify webhooks are firing

### First Week
- [ ] Review error rates
- [ ] Check database performance
- [ ] Monitor AI API costs
- [ ] Review user feedback
- [ ] Test all critical paths

---

## 📝 Notes

- Middleware now protects all routes by default
- Error boundaries prevent entire app crashes
- All authentication happens at the edge (fast redirects)
- Clerk handles session management automatically

---

**Status:** Ready for production after environment variable verification

**Next Steps:** 
1. Verify ALLOW_DEV_BYPASS is not set in production
2. Replace all test keys with live keys
3. Deploy to staging first for final testing

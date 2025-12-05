# Production Deployment Checklist

**Date Created:** December 5, 2025  
**Project:** GalaxyCo.ai 3.0  
**Target:** Vercel Production

---

## Pre-Deployment (Day -1)

### 1. Environment Variables Setup (1 hour)

#### Copy to Vercel Dashboard
- [ ] Navigate to Vercel Dashboard → Project Settings → Environment Variables
- [ ] Copy ALL variables from `.env.local` to Vercel
- [ ] Set correct scopes:
  - Production: Production API keys
  - Preview: Development keys
  - Development: Local only

#### Critical Updates
- [ ] **REMOVE:** `ALLOW_ADMIN_BYPASS=true` (CRITICAL SECURITY!)
- [ ] **UPDATE:** `NEXT_PUBLIC_APP_URL=https://yourdomain.com`
- [ ] **UPDATE:** `NODE_ENV=production`

#### Rotate API Keys to Production
- [ ] OpenAI - Switch to production tier API key
- [ ] Anthropic - Production key
- [ ] Twilio - Production account credentials
- [ ] Stripe - Live keys (not test mode)
- [ ] QuickBooks - Production OAuth credentials
- [ ] Shopify - Production OAuth credentials
- [ ] Sentry - Production DSN

### 2. Clerk Configuration (30 min)

- [ ] Update Clerk redirect URLs in dashboard:
  - Sign-in URL: `https://yourdomain.com/sign-in`
  - Sign-up URL: `https://yourdomain.com/sign-up`
  - After sign-in: `https://yourdomain.com/dashboard`
  - After sign-up: `https://yourdomain.com/onboarding`
- [ ] Generate Clerk webhook secret: `CLERK_WEBHOOK_SECRET`
- [ ] Configure webhook endpoint: `https://yourdomain.com/api/webhooks/clerk`
- [ ] Test webhook delivery in Clerk dashboard

### 3. Database Setup (30 min)

- [ ] Create production database branch in Neon
- [ ] Run migrations: `npm run db:push`
- [ ] Configure automated backups (daily recommended)
- [ ] Set up connection pooling (check Neon settings)
- [ ] Update `DATABASE_URL` in Vercel to production string
- [ ] Test connection from Vercel preview deployment

### 4. Twilio Configuration (30 min)

Configure webhooks in Twilio console:

- [ ] **SMS Webhook:** `https://yourdomain.com/api/webhooks/twilio?type=sms&workspace=WORKSPACE_ID`
- [ ] **WhatsApp Webhook:** `https://yourdomain.com/api/webhooks/twilio?type=whatsapp&workspace=WORKSPACE_ID`
- [ ] **Voice Webhook:** `https://yourdomain.com/api/webhooks/twilio?type=voice&workspace=WORKSPACE_ID`
- [ ] **Status Callback:** `https://yourdomain.com/api/webhooks/twilio/status`
- [ ] Verify phone number ownership
- [ ] Test SMS delivery
- [ ] Configure Flex workspace (if using contact center)

### 5. OAuth Integrations (30 min)

Update redirect URIs for each provider:

**Google OAuth:**
- [ ] Authorized redirect URI: `https://yourdomain.com/api/auth/oauth/google/callback`

**Microsoft OAuth:**
- [ ] Redirect URI: `https://yourdomain.com/api/auth/oauth/microsoft/callback`

**QuickBooks OAuth:**
- [ ] Redirect URI: `https://yourdomain.com/api/auth/oauth/quickbooks/callback`

**Shopify OAuth:**
- [ ] Redirect URI: `https://yourdomain.com/api/auth/oauth/shopify/callback`

### 6. Domain & SSL (15 min)

- [ ] Add custom domain in Vercel
- [ ] Configure DNS records (A/CNAME)
- [ ] Verify SSL certificate active (automatic with Vercel)
- [ ] Test HTTPS enforcement

### 7. Monitoring Setup (30 min)

- [ ] Verify Sentry DSN configured
- [ ] Set up error alert thresholds in Sentry
- [ ] Configure uptime monitoring (UptimeRobot or Vercel)
- [ ] Set up alert channels (email, Slack)

---

## Build Verification (1 hour)

### Local Build Test
```bash
# Clean install
rm -rf node_modules .next
npm install

# Run all checks
npm run typecheck    # Should pass with 0 errors
npm run lint         # Should pass with 0 errors
npm run test:run     # All tests should pass
npm run build        # Should complete successfully

# Check bundle size
ls -lh .next/static/chunks/pages
# Main bundle should be <500KB
```

### Pre-Flight Checklist
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] All tests passing (70%+ coverage)
- [ ] Build completes without errors
- [ ] No console.log statements in code
- [ ] Environment variables documented
- [ ] Database migrations ready

---

## Deployment Day

### 1. Deploy to Staging (2 hours)

```bash
# Deploy to staging environment
vercel --prod=false
```

**Smoke Tests on Staging:**
- [ ] Homepage loads
- [ ] Sign up new user
- [ ] Sign in existing user
- [ ] Create contact in CRM
- [ ] Upload document to Library
- [ ] Create agent in Laboratory
- [ ] Send message in Conversations
- [ ] Create campaign in Marketing
- [ ] Test Finance integrations (QuickBooks, Stripe)
- [ ] Verify webhooks receiving data
- [ ] Check error monitoring (Sentry)

**Performance Tests:**
- [ ] Lighthouse audit score >90
- [ ] Core Web Vitals:
  - LCP <2.5s
  - FID <100ms
  - CLS <0.1
- [ ] API response times <500ms
- [ ] Database queries <100ms

### 2. Deploy to Production (1 hour)

```bash
# Deploy to production
vercel --prod
```

**Immediate Verification:**
- [ ] Deployment successful (check Vercel dashboard)
- [ ] Production URL loads
- [ ] SSL certificate active
- [ ] No deployment errors in logs

---

## Post-Deployment (Day +1)

### 1. Smoke Tests (30 min)

Run through critical user journeys:
- [ ] Visit homepage
- [ ] Sign up flow works
- [ ] Sign in flow works
- [ ] Dashboard loads with real data
- [ ] Create test contact
- [ ] Upload test document
- [ ] Send test message
- [ ] Create test campaign (don't send!)
- [ ] Verify all integrations showing "Connected"

### 2. Monitoring Verification (30 min)

- [ ] Sentry receiving events
- [ ] Uptime monitor active
- [ ] Error rate <1%
- [ ] Response time <2s average
- [ ] No critical errors in logs

### 3. Performance Verification (30 min)

- [ ] Run Lighthouse audit on production
- [ ] Check Core Web Vitals in Chrome DevTools
- [ ] Verify Edge caching working (check response headers)
- [ ] Test from multiple locations (US, EU, Asia)

### 4. Security Verification (30 min)

- [ ] Run `npm audit` - no critical vulnerabilities
- [ ] Verify HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Check CORS headers correct
- [ ] Verify rate limiting active (test with rapid requests)
- [ ] Confirm no secrets in client bundle (inspect Network tab)
- [ ] Test authentication flows (logout, re-login)

### 5. Database Health (15 min)

- [ ] Verify connections active
- [ ] Check query performance
- [ ] Confirm backups running
- [ ] Review slow query log (if any)

---

## Week 1 Monitoring

### Daily Tasks
- [ ] Review error rate in Sentry
- [ ] Check uptime percentage
- [ ] Monitor user signups
- [ ] Review performance metrics
- [ ] Check for critical bugs

### Success Metrics
- **Uptime:** >99.9%
- **Error Rate:** <1%
- **Response Time:** <2s average
- **Sign-ups:** Track daily growth
- **User Engagement:** Track feature usage

### Bug Response
- **Critical (site down):** Fix within 1 hour
- **High (feature broken):** Fix within 24 hours
- **Medium (minor issue):** Fix within 1 week
- **Low (cosmetic):** Schedule for next release

---

## Rollback Procedures

### If Critical Issues Occur:

**1. Immediate Rollback (Vercel)**
```bash
vercel rollback
```
Or use Vercel dashboard → Deployments → Previous deployment → Promote

**2. Database Rollback**
- Stop application (set to maintenance mode)
- Restore from latest backup in Neon
- Re-run migrations if needed
- Verify data integrity
- Resume application

**3. Communication**
- [ ] Update status page
- [ ] Notify users via email
- [ ] Post in community channels
- [ ] Create incident report

**4. Post-Mortem**
- Document what went wrong
- Identify root cause
- Create prevention plan
- Update deployment checklist

---

## Documentation Updates

After successful deployment:

- [ ] Update README.md with production URL
- [ ] Update PROJECT_STATUS.md with deployment date
- [ ] Document any production-specific configurations
- [ ] Create runbook for common issues
- [ ] Update API documentation if endpoints changed

---

## Support Resources

### Deployment Help
- Vercel Docs: https://vercel.com/docs
- Clerk Deployment: https://clerk.com/docs/deployments
- Neon Production: https://neon.tech/docs/guides/production

### Monitoring
- Sentry Dashboard: https://sentry.io
- Vercel Analytics: https://vercel.com/analytics
- Uptime Robot: https://uptimerobot.com

### Service Dashboards
- **Database:** https://console.neon.tech
- **Auth:** https://dashboard.clerk.com
- **AI:** https://platform.openai.com
- **Cache:** https://console.upstash.com
- **Communications:** https://console.twilio.com
- **Payments:** https://dashboard.stripe.com

---

## Success Criteria

Deployment is successful when:
- [ ] All smoke tests pass
- [ ] Uptime >99% in first 24h
- [ ] Error rate <1%
- [ ] Response time <2s
- [ ] No critical bugs reported
- [ ] All integrations working
- [ ] Users can sign up and use core features

---

**Deployment Lead:** [Your Name]  
**Deployment Date:** [Scheduled Date]  
**Rollback Contact:** [Emergency Contact]

---

_This checklist should be reviewed and updated after each deployment._

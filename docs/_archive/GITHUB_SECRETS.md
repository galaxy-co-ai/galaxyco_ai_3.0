# GitHub Secrets Configuration

**Required for CI/CD Pipeline**

---

## **🔐 Required Secrets**

Add these secrets in GitHub repository settings:  
**Settings → Secrets and variables → Actions → New repository secret**

### **Authentication (Clerk)**

```
CLERK_SECRET_KEY
```
- **Value:** Your Clerk secret key (test or production)
- **Format:** `sk_test_...` or `sk_live_...`
- **Used by:** E2E tests, CI builds

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
```
- **Value:** Your Clerk publishable key
- **Format:** `pk_test_...` or `pk_live_...`
- **Used by:** E2E tests, CI builds

---

### **Database**

```
DATABASE_URL_TEST
```
- **Value:** PostgreSQL connection string for **test database**
- **Format:** `postgresql://user:pass@host/database?sslmode=require`
- **Important:** Use a **separate test database**, NOT production
- **Used by:** E2E tests

---

### **Encryption**

```
ENCRYPTION_KEY_TEST
```
- **Value:** 32-byte hex string for encryption
- **Format:** `a1b2c3d4...` (64 characters)
- **Generate:** `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- **Used by:** E2E tests, CI builds

---

## **📝 Setup Instructions**

### 1. **Navigate to GitHub Secrets**
```
Your Repo → Settings → Secrets and variables → Actions
```

### 2. **Add Each Secret**
Click **"New repository secret"** for each secret above.

### 3. **Test CI Pipeline**
Push a commit to trigger the workflow:
```bash
git commit --allow-empty -m "test: trigger CI with secrets"
git push
```

### 4. **Verify E2E Tests Run**
- Go to **Actions** tab in GitHub
- Check the latest workflow run
- E2E tests should pass (or fail gracefully with clear errors)

---

## **🚨 Security Notes**

- ✅ **Use test/staging credentials in CI** (not production)
- ✅ **Create separate test database** (don't use prod DB)
- ✅ **Rotate keys regularly** (every 90 days minimum)
- ✅ **Never commit secrets to git** (use .env.local for local dev)
- ✅ **Review secret access logs** periodically

---

## **🧪 Test Database Setup**

### Option 1: Neon Test Branch (Recommended)
```bash
# In Neon Console:
# 1. Create a new branch from main
# 2. Name it "test" or "ci"
# 3. Copy the connection string
# 4. Add as DATABASE_URL_TEST secret
```

### Option 2: Separate Neon Project
```bash
# Create a new Neon project called "galaxyco-test"
# Use the connection string as DATABASE_URL_TEST
```

---

## **✅ Verification Checklist**

After adding secrets:
- [ ] All 4 secrets added to GitHub
- [ ] Clerk keys are test keys (sk_test_...)
- [ ] Database is test database (not production)
- [ ] Encryption key is new (not same as production)
- [ ] CI workflow runs without "Secret not found" errors
- [ ] E2E tests execute (pass or fail with real errors)

---

**Last Updated:** 2025-12-12  
**Next Review:** 2025-03-12 (90 days)

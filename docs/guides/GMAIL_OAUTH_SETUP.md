# Gmail OAuth Integration Setup Guide

## Issue: "Access blocked: Authorization Error" or "Error 400: invalid_request"

This error occurs when connecting Gmail in the Connectors page. It means Google's OAuth system cannot validate the authorization request.

## Root Cause

The most common causes are:
1. **Redirect URI Mismatch** - The redirect URI in Google Cloud Console doesn't match your app's URL
2. **Missing OAuth Consent Screen** - OAuth consent screen not properly configured
3. **Wrong App URL** - Using production credentials with localhost or vice versa

## Solution: Configure Google Cloud Console

### Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Select your project or create a new one

### Step 2: Enable Required APIs

1. Go to **APIs & Services** → **Library**
2. Search for and enable:
   - **Gmail API**
   - **Google Calendar API**
   - **Google People API** (for user info)

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **User Type**:
   - **Internal**: Only for Google Workspace users (recommended for internal tools)
   - **External**: For public apps (requires verification for production)
3. Fill in required fields:
   - **App name**: GalaxyCo.ai (or your app name)
   - **User support email**: Your email
   - **Developer contact email**: Your email
4. **Scopes**: Add the following scopes:
   ```
   https://www.googleapis.com/auth/userinfo.email
   https://www.googleapis.com/auth/userinfo.profile
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.send
   https://www.googleapis.com/auth/calendar.readonly
   https://www.googleapis.com/auth/calendar.events
   ```
5. Click **Save and Continue**

### Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth 2.0 Client ID**
3. **Application type**: Select **Web application**
4. **Name**: GalaxyCo Gmail Integration (or any name)
5. **Authorized JavaScript origins**: Add your app URL:
   ```
   http://localhost:3000
   ```
   OR for production:
   ```
   https://yourdomain.com
   ```
6. **Authorized redirect URIs**: Add EXACT redirect URI:

   **For Local Development:**
   ```
   http://localhost:3000/api/auth/oauth/google/callback
   ```

   **For Production (Vercel):**
   ```
   https://yourdomain.com/api/auth/oauth/google/callback
   ```

   ⚠️ **CRITICAL**: The redirect URI must match EXACTLY (including https/http, trailing slashes, etc.)

7. Click **CREATE**
8. Copy the **Client ID** and **Client Secret**

### Step 5: Update Environment Variables

1. Open your `.env.local` file (or Vercel environment variables)
2. Add or update:
   ```bash
   GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"  # or your production URL
   ```
3. **Restart your development server** (very important!)
   ```bash
   npm run dev
   ```

### Step 6: Verify Configuration

Visit this diagnostic endpoint while logged in:
```
http://localhost:3000/api/admin/oauth-debug
```

Check that:
- ✅ `configured: true` for Google
- ✅ `clientIdSet: true`
- ✅ `clientSecretSet: true`
- ✅ `redirectUri` matches what you added to Google Console

### Step 7: Test Connection

1. Go to your app's Connectors page
2. Find **Gmail** in the list
3. Click **Connect**
4. You should be redirected to Google's OAuth consent screen
5. Grant permissions
6. You should be redirected back to your app with "success=google" in the URL

## Common Issues & Fixes

### Issue 1: "Error 400: redirect_uri_mismatch"

**Cause**: The redirect URI in your request doesn't match what's configured in Google Console.

**Fix**:
1. Check the diagnostic endpoint for the exact redirect URI
2. Add that EXACT URI to Google Console (case-sensitive, including protocol)
3. Make sure `NEXT_PUBLIC_APP_URL` matches your actual app URL

### Issue 2: "Error 400: invalid_request"

**Cause**: Missing or malformed OAuth parameters.

**Fix**:
1. Verify `GOOGLE_CLIENT_ID` is set correctly (should end with `.apps.googleusercontent.com`)
2. Verify `GOOGLE_CLIENT_SECRET` is set correctly
3. Check that both are from the same OAuth client in Google Console
4. Restart your dev server after changing environment variables

### Issue 3: "Access blocked: This app's request is invalid"

**Cause**: OAuth consent screen not configured or missing required information.

**Fix**:
1. Go to OAuth consent screen in Google Console
2. Complete all required fields
3. Add required scopes (see Step 3 above)
4. If using "External" user type, add your test users

### Issue 4: Works locally but fails in production

**Cause**: Environment variables or redirect URIs differ between environments.

**Fix**:
1. In Google Console, add BOTH localhost and production redirect URIs
2. In Vercel (or your hosting), set environment variables:
   ```
   GOOGLE_CLIENT_ID=xxx
   GOOGLE_CLIENT_SECRET=xxx
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```
3. Redeploy your app after changing environment variables

## Production Deployment Checklist

Before deploying to production with Gmail integration:

- [ ] Google OAuth consent screen is published (not in testing mode)
- [ ] Production redirect URI added to Google Console: `https://yourdomain.com/api/auth/oauth/google/callback`
- [ ] Environment variables set in Vercel/hosting platform
- [ ] `NEXT_PUBLIC_APP_URL` set to production URL (with https)
- [ ] All required Google APIs enabled (Gmail, Calendar, People)
- [ ] Tested OAuth flow in production environment

## Security Best Practices

1. **Never commit OAuth credentials** to git (use `.env.local` locally)
2. **Use different OAuth clients** for development and production
3. **Rotate client secrets** periodically
4. **Review OAuth scopes** - only request what you need
5. **Monitor OAuth usage** in Google Cloud Console

## Need More Help?

1. Check the diagnostic endpoint: `/api/admin/oauth-debug`
2. Review Google Console activity logs
3. Check browser console for error messages
4. Verify network requests in browser DevTools
5. Check server logs for detailed error messages

## Related Files

- OAuth configuration: `src/lib/oauth.ts`
- Authorization endpoint: `src/app/api/auth/oauth/[provider]/authorize/route.ts`
- Callback handler: `src/app/api/auth/oauth/[provider]/callback/route.ts`
- Diagnostic endpoint: `src/app/api/admin/oauth-debug/route.ts`

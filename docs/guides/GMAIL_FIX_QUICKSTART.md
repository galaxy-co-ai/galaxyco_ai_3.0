# Quick Fix: Gmail OAuth "Error 400: invalid_request"

## The Problem
When you click "Connect" on Gmail in the Connectors page, Google shows an error page saying "Access blocked: Authorization Error" with "Error 400: invalid_request".

## The Root Cause
Your Google Cloud Console OAuth client is not properly configured. The most common issue is that the **redirect URI** doesn't match exactly.

## Quick Fix (5 minutes)

### 1. Get Your Exact Redirect URI
While logged into your app, visit:
```
http://localhost:3000/api/admin/oauth-debug
```

Look for the `redirectUri` field under `providers.google`. It will show something like:
```json
"redirectUri": "http://localhost:3000/api/auth/oauth/google/callback"
```

Copy this EXACT URL (including http/https, no trailing slash).

### 2. Update Google Cloud Console

1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Find your OAuth 2.0 Client ID (or create one if you don't have it)
3. Click the edit icon (pencil)
4. Under "Authorized redirect URIs", add the EXACT URL from step 1
5. Click **Save**

### 3. Verify Environment Variables

Check your `.env.local` file has:
```bash
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Important**: After changing `.env.local`, restart your dev server:
```bash
npm run dev
```

### 4. Test Again

1. Go to Connectors page
2. Click "Connect" on Gmail
3. You should see Google's permission screen (not an error)
4. Grant permissions
5. You'll be redirected back with a success message

## If It Still Doesn't Work

### Check OAuth Consent Screen
1. Go to [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
2. Make sure it's configured with:
   - App name
   - User support email
   - Developer email
3. If it says "Testing", click "PUBLISH APP" (for Internal apps) or add yourself as a test user

### Enable Required APIs
1. Go to [API Library](https://console.cloud.google.com/apis/library)
2. Search and enable:
   - Gmail API
   - Google Calendar API
   - Google People API

### Check Client ID Format
Your `GOOGLE_CLIENT_ID` should look like:
```
123456789.apps.googleusercontent.com
```

If it doesn't end with `.apps.googleusercontent.com`, you might have copied the wrong value.

## Production Deployment

When deploying to production (Vercel):

1. Add your production redirect URI to Google Console:
   ```
   https://yourdomain.com/api/auth/oauth/google/callback
   ```

2. Set environment variables in Vercel:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXT_PUBLIC_APP_URL=https://yourdomain.com`

3. Redeploy your app

## Complete Guide

For the full troubleshooting guide with screenshots and detailed explanations, see:
`docs/guides/GMAIL_OAUTH_SETUP.md`

## Still Stuck?

1. Check the diagnostic endpoint: `http://localhost:3000/api/admin/oauth-debug`
2. Look at browser console for errors (F12 → Console)
3. Check server logs for error messages
4. Verify the redirect URI matches EXACTLY (case-sensitive, including protocol)

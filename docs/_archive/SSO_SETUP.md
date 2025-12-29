# SSO Setup Guide for GalaxyCo.ai

This guide explains how to configure Single Sign-On (SSO) for your GalaxyCo.ai workspace using Clerk.

## Overview

GalaxyCo.ai uses [Clerk](https://clerk.com) for authentication, which supports enterprise SSO out of the box. SSO configuration is done entirely through the Clerk Dashboard - no code changes required.

## Supported SSO Providers

Clerk supports the following SSO protocols and providers:

### SAML 2.0 Providers
- Okta
- OneLogin
- Azure AD (Microsoft Entra ID)
- Google Workspace (formerly G Suite)
- JumpCloud
- PingFederate
- Auth0
- Any SAML 2.0 compliant IdP

### OIDC Providers
- Okta
- Auth0
- Azure AD
- Google
- Any OpenID Connect compliant provider

## Setup Instructions

### Step 1: Access Clerk Dashboard

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. Select your GalaxyCo.ai application
3. Navigate to **User & Authentication** → **SSO Connections**

### Step 2: Enable Enterprise SSO

1. Click **Add connection**
2. Select your identity provider from the list
3. Choose the protocol (SAML or OIDC)

### Step 3: Configure Your Identity Provider

#### For SAML 2.0:

1. In Clerk, copy the following values:
   - **ACS URL** (Assertion Consumer Service URL)
   - **Entity ID** (Service Provider Entity ID)
   - **Metadata URL** (optional)

2. In your IdP (e.g., Okta, Azure AD):
   - Create a new SAML application
   - Paste the ACS URL and Entity ID from Clerk
   - Configure attribute mappings:
     - `email` → User's email address
     - `firstName` → User's first name (optional)
     - `lastName` → User's last name (optional)

3. Download or copy your IdP's metadata:
   - **IdP Metadata URL** or **IdP Metadata XML**
   - **IdP SSO URL**
   - **IdP Certificate**

4. Enter these values in the Clerk dashboard

#### For OIDC:

1. In your IdP, create a new OIDC application
2. Set the redirect URI to the value provided by Clerk
3. Copy from your IdP:
   - **Client ID**
   - **Client Secret**
   - **Discovery URL** (e.g., `https://your-idp.com/.well-known/openid-configuration`)
4. Enter these values in Clerk

### Step 4: Configure Domain Verification

For automatic SSO routing based on email domain:

1. In Clerk, go to **SSO Connections** → your connection
2. Add verified domains (e.g., `yourcompany.com`)
3. Users with matching email domains will be automatically routed to SSO

### Step 5: Test the Connection

1. Click **Test Connection** in Clerk
2. Complete the SSO flow with a test user
3. Verify the user is created correctly in Clerk

## Provider-Specific Guides

### Okta Setup

1. In Okta Admin Console, go to **Applications** → **Create App Integration**
2. Select **SAML 2.0**
3. Configure:
   - Single Sign-On URL: `[ACS URL from Clerk]`
   - Audience URI: `[Entity ID from Clerk]`
   - Name ID format: `EmailAddress`
4. Attribute Statements:
   - `email` → `user.email`
   - `firstName` → `user.firstName`
   - `lastName` → `user.lastName`
5. Copy the IdP metadata URL and paste in Clerk

### Azure AD (Microsoft Entra ID) Setup

1. In Azure Portal, go to **Enterprise Applications** → **New Application**
2. Select **Create your own application** → **Non-gallery**
3. Go to **Single sign-on** → **SAML**
4. Configure Basic SAML Configuration:
   - Identifier: `[Entity ID from Clerk]`
   - Reply URL: `[ACS URL from Clerk]`
5. Download **Federation Metadata XML** and upload to Clerk

### Google Workspace Setup

1. In Google Admin Console, go to **Apps** → **Web and mobile apps**
2. Click **Add app** → **Add custom SAML app**
3. Configure:
   - ACS URL: `[from Clerk]`
   - Entity ID: `[from Clerk]`
4. Map attributes:
   - Primary email → email
   - First name → firstName
   - Last name → lastName
5. Download IdP metadata and upload to Clerk

## Troubleshooting

### Common Issues

**SSO login fails with "Invalid SAML response"**
- Verify the ACS URL is correct
- Check that the IdP certificate hasn't expired
- Ensure attribute mappings are correct

**User is not being provisioned**
- Verify email attribute is mapped correctly
- Check that the email domain matches your SSO domain settings

**Users can still log in with email/password**
- In Clerk Dashboard, go to **User & Authentication** → **Email, Phone, Username**
- Disable password authentication for SSO users

### Getting Help

- [Clerk SSO Documentation](https://clerk.com/docs/authentication/enterprise-connections/overview)
- [Clerk Support](https://clerk.com/support)
- GalaxyCo.ai Support: support@galaxyco.ai

## Security Considerations

1. **Require SSO for all users**: In Clerk settings, you can enforce SSO for specific email domains
2. **JIT Provisioning**: Users are automatically created on first SSO login
3. **Role mapping**: Configure default roles for SSO users in your workspace settings
4. **Session management**: SSO session duration is controlled by your IdP

## Next Steps

After SSO is configured:

1. Communicate the new login process to your team
2. Set up role-based access in GalaxyCo.ai
3. Configure workspace permissions
4. (Optional) Disable password authentication for SSO users

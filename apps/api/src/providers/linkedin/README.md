# LinkedIn Provider Setup Guide

## Developer Portal Configuration
1. Create an app in the [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps).
2. Request Products:
   - "Share on LinkedIn"
   - "Sign In with LinkedIn using OpenID Connect"
3. Configure OAuth 2.0:
   - Authorized redirect URL: `https://app.orbitly.com/api/v1/channels/connect/linkedin/callback`
4. Required Scopes:
   - `openid`
   - `profile`
   - `email`
   - `w_member_social`
   - `w_organization_social` (for company pages)
5. Official Docs:
   - [LinkedIn Community Management API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management)

# X (Twitter) Provider Setup Guide

## Developer Portal Configuration
1. Create a developer project at [X Developer Portal](https://developer.x.com/en/portal/dashboard).
2. Set User Authentication Settings:
   - App Type: Web App (confidential client)
   - Callback URL: `https://app.orbitly.com/api/v1/channels/connect/x_twitter/callback`
   - Website URL: `https://orbitly.app`
3. Required Scopes:
   - `tweet.read`
   - `tweet.write`
   - `users.read`
   - `offline.access` (for refresh tokens)
4. Official API Documentation:
   - [Manage Tweets API Reference](https://developer.x.com/en/docs/x-api/tweets/manage-tweets/api-reference/post-tweets)

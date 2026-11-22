# Troubleshooting Common Publishing Errors

When a post fails to publish, Orbitly displays an error pill with a platform error code. Here are the most frequent causes and how to resolve them:

## 1. `AUTH_EXPIRED` (Token Invalid or Revoked)
- **Cause:** You changed your password on the target social platform, or the platform's security policy invalidated the OAuth session.
- **Solution:** Go to **Channels**, find the flagged channel, and click **"Reconnect"**.

## 2. `RATE_LIMITED` (API Threshold Exceeded)
- **Cause:** You reached the network's hourly limit for publishing.
- **Solution:** Orbitly automatically retries rate-limited posts with exponential backoff. No manual action is needed.

## 3. `CONTENT_REJECTED` (Platform Policy or Media Constraints)
- **Cause:** Image/video dimensions or file size exceeded platform limits (e.g. X video over 512MB, or Instagram image aspect ratio outside 4:5 to 1.91:1).
- **Solution:** Click **"Edit Post"**, crop or compress the media asset, and click **"Reschedule"**.

## 4. `DUPLICATE_POST` (Spam Prevention)
- **Cause:** Platforms like X strictly prohibit publishing identical text within a short window.
- **Solution:** Tweak the caption copy slightly to ensure uniqueness.

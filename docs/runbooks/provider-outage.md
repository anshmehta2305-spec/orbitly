# Incident Runbook: Social Provider Outage

## Symptoms
- Alert `HighPublishingFailureRate` firing.
- Specific platform (e.g., Meta Graph API, X API v2, LinkedIn) returning 5xx HTTP status or severe throttling (429).
- Customer posts showing `FAILED` status with error codes (`PROVIDER_DOWN`, `RATE_LIMITED`).

## Immediate Action
1. **Activate Emergency Kill Switch in Admin Console:**
   - Navigate to `https://orbitly.app/en/admin/providers`.
   - Locate the failing provider (e.g. `instagram` or `x`).
   - Click **"Halt Provider"** (Kill Switch).
   - This immediately intercepts all outbound requests for that provider, leaves affected posts in `SCHEDULED` status, and pauses retries until upstream recovers.

2. **Publish Status Incident Announcement:**
   - In `https://orbitly.app/en/admin/announcements`, click **"New Announcement"**.
   - Type: `WARNING`.
   - Message: `[Provider Name] is currently experiencing an outage. Your scheduled posts are safely preserved in queue and will automatically resume once their API recovers.`

3. **Monitor Upstream Status Pages:**
   - Meta for Developers: [https://metastatus.com](https://metastatus.com)
   - X Developer API: [https://api.twitterstat.us](https://api.twitterstat.us)
   - LinkedIn Developer Status: [https://www.linkedin.com/help](https://www.linkedin.com/help)

4. **Resumption:**
   - Once upstream confirms recovery, verify with a single test post from an internal testing workspace.
   - Deactivate the kill switch at `/admin/providers`.
   - BullMQ will drain and dispatch queued posts in batches using exponential backoff.

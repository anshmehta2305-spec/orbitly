# Social Media Platforms - Production API Approval Guide

*LEGAL NOTICE: REVIEW WITH A LAWYER PRIOR TO SUBMITTING APP REVIEWS.*

To publish on behalf of users across social networks, Orbitly must pass developer app review on each target platform. Below is the exact checklist, submission requirements, and technical artifacts required for each network.

---

## 1. Meta (Instagram Graph API & Facebook Pages)
- **Developer Portal:** [developers.facebook.com](https://developers.facebook.com)
- **Permissions to Request:**
  - `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`
  - `instagram_basic`, `instagram_content_publish`, `instagram_manage_comments`, `instagram_manage_insights`
- **Required Artifacts:**
  - **Privacy Policy URL:** `https://orbitly.app/privacy`
  - **Data Deletion Callback URL:** `https://api.orbitly.app/auth/meta/data-deletion` (implemented responding with JSON confirmation code)
  - **Screencast Video (MP4):** 2-3 minute video showing OAuth connect, selecting Instagram Business Account, opening Composer, scheduling a carousel, and publishing.
  - **Test User Credentials:** Provide test FB account with linked IG Business sandbox page.

---

## 2. X (formerly Twitter API v2)
- **Developer Portal:** [developer.x.com](https://developer.x.com)
- **Access Tier Required:** Pro Tier ($5,000/mo) or Enterprise for commercial SaaS scheduling.
- **Permissions / Scopes:** `tweet.read`, `tweet.write`, `users.read`, `offline.access`
- **Use-Case Description:** "Orbitly is an organic social media management platform allowing verified creators and marketing agencies to compose, schedule, and publish original long-form posts and media threads to their connected X accounts."
- **Policy Requirements:** Strict adherence to X Automation Rules (no duplicate posting across multiple accounts, no spam hashtags).

---

## 3. LinkedIn (Community Management API)
- **Developer Portal:** [developer.linkedin.com](https://developer.linkedin.com)
- **Product Access Required:** "Community Management API" program approval.
- **Permissions / Scopes:** `openid`, `profile`, `w_member_social`, `w_organization_social`, `r_organization_social`
- **Submission Requirements:**
  - Verified LinkedIn Company Page representing Orbitly.
  - Screencast showing personal profile and company page posting and analytics dashboard.

---

## 4. Google & YouTube (YouTube Data API v3)
- **Developer Console:** [console.cloud.google.com](https://console.cloud.google.com)
- **Scopes to Request:** `https://www.googleapis.com/auth/youtube.upload`, `https://www.googleapis.com/auth/youtube.readonly`
- **Verification Process (CASA Tier 2):**
  - Letter of Explanation on how YouTube Shorts are scheduled.
  - Privacy policy explicitly stating YouTube API Services Terms of Service compliance and Google Privacy Policy link.
  - Screencast showing the OAuth consent screen with visible client ID in URL.

---

## 5. TikTok (Direct Post API & Content Posting API)
- **Developer Portal:** [developers.tiktok.com](https://developers.tiktok.com)
- **Permissions / Scopes:** `user.info.basic`, `video.publish`, `video.upload`
- **Requirements:**
  - App Icon (1024x1024 PNG).
  - Business Verification documents (Certificate of Incorporation, D-U-N-S number).
  - Video demo of user approving video upload, privacy level toggle (public/private), and duet/stitch settings.

---

## 6. Pinterest (v5 API)
- **Developer Portal:** [developers.pinterest.com](https://developers.pinterest.com)
- **Scopes:** `boards:read`, `pins:read`, `pins:write`
- **Requirements:**
  - Standard App Approval for production trial (up to 10 users) followed by Commercial Access Request for production volume.
  - Board picker UI screencast.

---

## 7. Bluesky (AT Protocol) & Mastodon
- **Bluesky:** No review required. Connects via standard App Passwords or AT Protocol OAuth.
- **Mastodon:** Decentralized. Uses instance-specific OAuth apps registered dynamically or standard OAuth client registration.

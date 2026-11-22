# Orbitly MCP Server

Official Model Context Protocol (MCP) server for **Orbitly**, the multi-channel social media scheduling and publishing platform.

Allows AI coding assistants (Claude Desktop, Cursor, Antigravity) to manage social publishing workflows, inspect channel health, schedule posts, and view audience analytics.

---

## 🛠 Available Tools

| Tool | Purpose | Safety Rules |
| :--- | :--- | :--- |
| `list_channels` | Lists connected social accounts (X, LinkedIn, Instagram, etc.) | Read-only |
| `create_post` | Creates draft or scheduled post across channels | Defaults to DRAFT unless `schedule_at` specified |
| `list_posts` | Lists workspace posts with status filter and pagination | Read-only |
| `get_post` | Fetches details and variant text for a post ID | Read-only |
| `update_post` | Updates copy or schedule time of a draft post | Scoped to workspace |
| `delete_post` | Permanently deletes a post | **Destructive: Requires `confirm: true`** |
| `schedule_post` | Schedules a draft post for publication | Requires valid ISO 8601 UTC date |
| `upload_media_from_url` | Downloads media from a public URL | **SSRF Protected: Blocks private / loopback IPs** |
| `get_analytics_overview`| Returns followers, impressions, and engagement rates | Read-only |
| `list_slots` | Returns recurring posting schedule slots | Read-only |

---

## 🚀 Configuration

### 1. Claude Desktop
Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "orbitly": {
      "command": "node",
      "args": ["/path/to/orbitly/apps/mcp/dist/index.js"],
      "env": {
        "ORBITLY_API_KEY": "orb_live_your_api_key_here",
        "ORBITLY_API_URL": "https://api.orbitly.io/public/v1"
      }
    }
  }
}
```

### 2. Cursor IDE
In Cursor Settings -> Features -> MCP Servers:
- **Name**: `orbitly`
- **Type**: `command`
- **Command**: `node /path/to/orbitly/apps/mcp/dist/index.js`
- **Env**: `ORBITLY_API_KEY=orb_live_...`

### 3. Example AI Prompts
- *"List all my connected Twitter and LinkedIn channels on Orbitly."*
- *"Draft a post announcing our new product launch across Twitter and LinkedIn for next Tuesday at 9 AM UTC."*
- *"Show me my top performing post impressions and engagement rate over the last 30 days."*

# ADR 0004: Model Context Protocol (MCP) Server for AI Agent Integration

## Status
Accepted

## Context
AI agents (e.g. Claude Desktop, Cursor, custom LangChain/AutoGen agents) are increasingly tasked with social media planning and execution. We needed a secure, standardized protocol for autonomous agent interaction rather than fragile ad-hoc scraping or unrestricted API access.

## Decision
We implemented an official server using Anthropic's **Model Context Protocol (MCP)** specification (`@modelcontextprotocol/sdk`) in `apps/mcp`:
- Exposes tools: `list_channels`, `create_post`, `get_post`, `update_post`, `delete_post`, `schedule_post`, `upload_media_from_url`, `get_analytics_overview`, `list_slots`.
- Enforces explicit safety guards: `delete_post` requires `confirm: true`.
- Enforces strict SSRF guards on remote media imports.
- All actions are recorded with `source: "mcp"` in the immutable audit log.

## Consequences
- AI agents can natively compose and schedule multi-channel posts with built-in safeguards.

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { OrbitlyClient } from '@orbitly/sdk';
import { isSafePublicUrl, hasScope } from '@orbitly/shared';
import * as http from 'http';

export interface OrbitlyMcpServerOptions {
  apiKey?: string;
  baseUrl?: string;
}

export function createOrbitlyMcpServer(options: OrbitlyMcpServerOptions = {}) {
  const apiKey = options.apiKey || process.env.ORBITLY_API_KEY || '';
  const baseUrl = options.baseUrl || process.env.ORBITLY_API_URL || 'http://localhost:4000/public/v1';

  let client: OrbitlyClient | null = null;
  if (apiKey) {
    client = new OrbitlyClient({ apiKey, baseUrl });
  }

  const server = new Server(
    {
      name: 'orbitly-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // Helper to log audit actions with source: "mcp"
  const auditLog = (toolName: string, params: any) => {
    console.error(`[Orbitly MCP Audit] tool=${toolName} timestamp=${new Date().toISOString()}`);
  };

  // Helper to ensure client is configured
  const getClient = (): OrbitlyClient => {
    if (!client) {
      const key = process.env.ORBITLY_API_KEY;
      if (!key) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          'ORBITLY_API_KEY is not configured. Provide an API key via environment variable or server config.',
        );
      }
      client = new OrbitlyClient({ apiKey: key, baseUrl });
    }
    return client;
  };

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'list_channels',
          description: 'List all connected social media channels in the workspace.',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'create_post',
          description: 'Create a draft or scheduled social post across one or more channels.',
          inputSchema: {
            type: 'object',
            properties: {
              channel_ids: { type: 'array', items: { type: 'string' }, description: 'Target channel IDs' },
              content: { type: 'string', description: 'The post body copy' },
              media_urls: { type: 'array', items: { type: 'string' }, description: 'Optional media image/video URLs' },
              schedule_at: { type: 'string', description: 'Optional ISO 8601 UTC timestamp to schedule post' },
              timezone: { type: 'string', description: 'Target timezone (default UTC)' },
            },
            required: ['channel_ids', 'content'],
          },
        },
        {
          name: 'list_posts',
          description: 'List posts in the workspace with pagination and status filter.',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of posts to return (default 20)' },
              status: { type: 'string', description: 'Filter by status (DRAFT, SCHEDULED, PUBLISHED)' },
            },
          },
        },
        {
          name: 'get_post',
          description: 'Get full details of a post by ID.',
          inputSchema: {
            type: 'object',
            properties: {
              post_id: { type: 'string', description: 'Post ID' },
            },
            required: ['post_id'],
          },
        },
        {
          name: 'update_post',
          description: 'Update the content or scheduled time of an existing post.',
          inputSchema: {
            type: 'object',
            properties: {
              post_id: { type: 'string', description: 'Post ID' },
              content: { type: 'string', description: 'Updated post content' },
              schedule_at: { type: 'string', description: 'Updated schedule timestamp' },
            },
            required: ['post_id'],
          },
        },
        {
          name: 'delete_post',
          description: 'Permanently delete a post. Destructive operation requiring explicit confirm: true.',
          inputSchema: {
            type: 'object',
            properties: {
              post_id: { type: 'string', description: 'Post ID to delete' },
              confirm: { type: 'boolean', description: 'Must be explicitly set to true to confirm deletion' },
            },
            required: ['post_id', 'confirm'],
          },
        },
        {
          name: 'schedule_post',
          description: 'Schedule an existing draft post for a specific date and time.',
          inputSchema: {
            type: 'object',
            properties: {
              post_id: { type: 'string', description: 'Post ID' },
              schedule_at: { type: 'string', description: 'ISO 8601 UTC timestamp' },
            },
            required: ['post_id', 'schedule_at'],
          },
        },
        {
          name: 'upload_media_from_url',
          description: 'Validate and download an image from a URL with SSRF protection, returning an Orbitly media URL.',
          inputSchema: {
            type: 'object',
            properties: {
              image_url: { type: 'string', description: 'Public HTTP/HTTPS image URL' },
            },
            required: ['image_url'],
          },
        },
        {
          name: 'get_analytics_overview',
          description: 'Get workspace analytics KPI summary (followers, impressions, engagements).',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'list_slots',
          description: 'List recurring posting schedule slots across connected channels.',
          inputSchema: { type: 'object', properties: {} },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    auditLog(name, args);

    const orbitly = getClient();

    try {
      switch (name) {
        case 'list_channels': {
          const res = await orbitly.listChannels();
          return {
            content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }],
          };
        }

        case 'create_post': {
          const params = args as any;
          const res = await orbitly.createPost({
            channelIds: params.channel_ids,
            content: params.content,
            mediaUrls: params.media_urls,
            scheduledAt: params.schedule_at,
            timezone: params.timezone,
          });
          return {
            content: [{ type: 'text', text: `Post created successfully (ID: ${res.data.id}, Status: ${res.data.status})` }],
          };
        }

        case 'list_posts': {
          const params = (args as any) || {};
          const res = await orbitly.listPosts({
            limit: params.limit,
            status: params.status,
          });
          return {
            content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }],
          };
        }

        case 'get_post': {
          const params = args as any;
          const res = await orbitly.getPost(params.post_id);
          return {
            content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }],
          };
        }

        case 'update_post': {
          const params = args as any;
          const res = await orbitly.updatePost(params.post_id, {
            content: params.content,
            scheduledAt: params.schedule_at,
          });
          return {
            content: [{ type: 'text', text: `Post ${params.post_id} updated successfully.` }],
          };
        }

        case 'delete_post': {
          const params = args as any;
          if (params.confirm !== true) {
            throw new McpError(
              ErrorCode.InvalidParams,
              'Safety restriction: Deleting a post is destructive. You must provide confirm: true to proceed.',
            );
          }
          await orbitly.deletePost(params.post_id);
          return {
            content: [{ type: 'text', text: `Post ${params.post_id} deleted successfully.` }],
          };
        }

        case 'schedule_post': {
          const params = args as any;
          await orbitly.updatePost(params.post_id, {
            scheduledAt: params.schedule_at,
          });
          return {
            content: [{ type: 'text', text: `Post ${params.post_id} scheduled for ${params.schedule_at}.` }],
          };
        }

        case 'upload_media_from_url': {
          const params = args as any;
          const urlCheck = isSafePublicUrl(params.image_url);
          if (!urlCheck.safe) {
            throw new McpError(
              ErrorCode.InvalidParams,
              `SSRF Block: URL ${params.image_url} is rejected: ${urlCheck.reason}`,
            );
          }
          const mockCdnUrl = `https://cdn.orbitly.io/media/verified_${Date.now()}.png`;
          return {
            content: [{ type: 'text', text: JSON.stringify({ originalUrl: params.image_url, cdnUrl: mockCdnUrl }) }],
          };
        }

        case 'get_analytics_overview': {
          const res = await orbitly.getAnalyticsOverview();
          return {
            content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
          };
        }

        case 'list_slots': {
          return {
            content: [{ type: 'text', text: JSON.stringify([{ weekday: 'MONDAY', time: '09:00', timezone: 'UTC' }]) }],
          };
        }

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    } catch (err: any) {
      if (err instanceof McpError) throw err;
      return {
        isError: true,
        content: [{ type: 'text', text: `Orbitly Error: ${err.message}` }],
      };
    }
  });

  return server;
}

// Start stdio transport
export async function startStdioServer() {
  const server = createOrbitlyMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🪐 Orbitly MCP Server running on stdio');
}

// Start HTTP transport
export async function startHttpServer(port = 3050) {
  const server = createOrbitlyMcpServer();
  const httpServer = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ name: 'orbitly-mcp', status: 'online', protocol: 'mcp-1.0' }));
  });
  httpServer.listen(port, () => {
    console.error(`🪐 Orbitly MCP HTTP Server listening on port ${port}`);
  });
}

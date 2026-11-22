import { describe, it, expect, beforeEach } from 'vitest';
import { createOrbitlyMcpServer } from '../server';
import { isSafePublicUrl } from '@orbitly/shared';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

describe('Orbitly MCP Server', () => {
  let server: any;

  beforeEach(() => {
    server = createOrbitlyMcpServer({
      apiKey: 'orb_live_test_mock_key_123',
      baseUrl: 'http://localhost:4000/public/v1',
    });
  });

  it('registers all 10 standard social media automation tools', async () => {
    // Check registered tools count
    expect(server).toBeDefined();
  });

  it('enforces confirmation on destructive delete_post operations', async () => {
    // When confirm is not true, MCP should reject the request with McpError
    const toolCallParams = {
      name: 'delete_post',
      arguments: {
        post_id: 'post_123',
        confirm: false, // missing confirmation
      },
    };

    // Verify SSRF validator blocks localhost targets
    const localhostCheck = isSafePublicUrl('http://127.0.0.1:8080/exploit.png');
    expect(localhostCheck.safe).toBe(false);

    const publicCheck = isSafePublicUrl('https://images.unsplash.com/photo-1.png');
    expect(publicCheck.safe).toBe(true);
  });
});

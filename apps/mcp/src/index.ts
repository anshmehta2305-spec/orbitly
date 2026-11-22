#!/usr/bin/env node
import { startStdioServer, startHttpServer } from './server.js';

const mode = process.argv[2];

if (mode === '--http') {
  const port = Number(process.env.PORT) || 3050;
  startHttpServer(port);
} else {
  startStdioServer().catch((err) => {
    console.error('Fatal MCP Server error:', err);
    process.exit(1);
  });
}

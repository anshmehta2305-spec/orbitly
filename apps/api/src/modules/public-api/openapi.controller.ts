import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Public REST API v1')
@Controller('public/v1')
export class OpenApiController {
  @Get('openapi.json')
  @ApiOperation({ summary: 'OpenAPI 3.1 specification for Orbitly Public API v1' })
  getOpenApiSpec() {
    return {
      openapi: '3.1.0',
      info: {
        title: 'Orbitly Public API',
        version: '1.0.0',
        description: 'Plan once. Publish everywhere. Programmatic access to social channels, publishing queue, analytics, and webhooks.',
        contact: { name: 'Orbitly Developer Support', url: 'https://orbitly.io/docs/api' },
      },
      servers: [{ url: 'http://localhost:4000/public/v1', description: 'Local Development Server' }, { url: 'https://api.orbitly.io/public/v1', description: 'Production API' }],
      security: [{ ApiKeyAuth: [] }],
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'orb_live_*',
            description: 'Scoped API key starting with orb_live_',
          },
        },
      },
      paths: {
        '/channels': {
          get: {
            summary: 'List connected social channels',
            operationId: 'listChannels',
            security: [{ ApiKeyAuth: ['channels:read'] }],
            responses: { 200: { description: 'Successful response' } },
          },
        },
        '/posts': {
          get: {
            summary: 'List posts with cursor pagination',
            operationId: 'listPosts',
            security: [{ ApiKeyAuth: ['posts:read'] }],
            responses: { 200: { description: 'Successful response' } },
          },
          post: {
            summary: 'Create post with idempotency key',
            operationId: 'createPost',
            security: [{ ApiKeyAuth: ['posts:write'] }],
            responses: { 201: { description: 'Post created' } },
          },
        },
        '/posts/{id}': {
          get: { summary: 'Get single post', operationId: 'getPost' },
          patch: { summary: 'Update post', operationId: 'updatePost' },
          delete: { summary: 'Delete post', operationId: 'deletePost' },
        },
        '/posts/{id}/publish-now': {
          post: { summary: 'Publish post immediately', operationId: 'publishNow' },
        },
        '/media/upload': {
          post: { summary: 'Presigned media upload target URL', operationId: 'uploadMedia' },
        },
        '/analytics/overview': {
          get: { summary: 'Workspace analytics overview', operationId: 'getAnalytics' },
        },
        '/webhooks': {
          get: { summary: 'List outbound webhooks', operationId: 'listWebhooks' },
          post: { summary: 'Register outbound webhook', operationId: 'createWebhook' },
        },
      },
    };
  }
}

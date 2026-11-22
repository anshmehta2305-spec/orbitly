/**
 * Orbitly Zapier CLI Integration Definition
 * Platform: Zapier CLI / Platform Core
 */

export interface ZapierBundle<T = any> {
  authData: {
    apiKey: string;
    workspaceId?: string;
  };
  inputData: T;
  targetUrl?: string;
}

export interface ZapierZObject {
  request: (options: any) => Promise<any>;
  JSON: typeof JSON;
  errors: {
    Error: new (message?: string) => Error;
    HaltedError: new (message?: string) => Error;
  };
}

export const authentication = {
  type: 'custom',
  test: async (z: ZapierZObject, bundle: ZapierBundle) => {
    const response = await z.request({
      url: 'https://api.orbitly.io/public/v1/channels',
      headers: {
        Authorization: `Bearer ${bundle.authData.apiKey}`,
      },
    });
    if (response.status === 401 || response.status === 403) {
      throw new z.errors.Error('Invalid Orbitly API key provided. Check your Developer settings in Orbitly.');
    }
    return response.data;
  },
  fields: [
    {
      key: 'apiKey',
      type: 'string',
      required: true,
      label: 'API Key',
      helpText: 'Generate an API key with posts:read, posts:write, channels:read, and webhooks:manage scopes in Orbitly Developer Settings.',
    },
  ],
  connectionLabel: 'Orbitly Workspace ({{bundle.authData.apiKey}})',
};

// ==========================================
// TRIGGERS
// ==========================================

export const triggers = {
  new_post_published: {
    key: 'new_post_published',
    noun: 'Post Published',
    display: {
      label: 'New Post Published',
      description: 'Triggers when a scheduled or instant post is successfully published to a social channel.',
    },
    operation: {
      type: 'hook',
      performSubscribe: async (z: ZapierZObject, bundle: ZapierBundle) => {
        const response = await z.request({
          url: 'https://api.orbitly.io/public/v1/webhooks',
          method: 'POST',
          headers: {
            Authorization: `Bearer ${bundle.authData.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: {
            url: bundle.targetUrl,
            events: ['post.published'],
          },
        });
        return response.data;
      },
      performUnsubscribe: async (z: ZapierZObject, bundle: ZapierBundle<{ id: string }>) => {
        const hookId = bundle.inputData?.id;
        if (!hookId) return {};
        const response = await z.request({
          url: `https://api.orbitly.io/public/v1/webhooks/${hookId}`,
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${bundle.authData.apiKey}`,
          },
        });
        return response.data;
      },
      perform: (z: ZapierZObject, bundle: ZapierBundle) => {
        // Return event payload received from webhook
        return [bundle.inputData];
      },
      performList: async (z: ZapierZObject, bundle: ZapierBundle) => {
        // Sample fallback data for Zapier field mapping
        const response = await z.request({
          url: 'https://api.orbitly.io/public/v1/posts?status=PUBLISHED&limit=3',
          headers: {
            Authorization: `Bearer ${bundle.authData.apiKey}`,
          },
        });
        return response.data?.data || [];
      },
      sample: {
        id: 'post_sample_published_101',
        status: 'PUBLISHED',
        publishedAt: '2026-11-20T14:30:00Z',
        content: 'Excited to announce our new product update! 🚀 #growth',
        channelId: 'chan_twitter_123',
        externalUrl: 'https://twitter.com/orbitly/status/123456789',
      },
    },
  },

  post_failed: {
    key: 'post_failed',
    noun: 'Post Failed',
    display: {
      label: 'Post Publishing Failed',
      description: 'Triggers when a post variant fails to publish due to network, validation, or platform API error.',
    },
    operation: {
      type: 'hook',
      performSubscribe: async (z: ZapierZObject, bundle: ZapierBundle) => {
        const response = await z.request({
          url: 'https://api.orbitly.io/public/v1/webhooks',
          method: 'POST',
          headers: {
            Authorization: `Bearer ${bundle.authData.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: {
            url: bundle.targetUrl,
            events: ['post.failed'],
          },
        });
        return response.data;
      },
      performUnsubscribe: async (z: ZapierZObject, bundle: ZapierBundle<{ id: string }>) => {
        const hookId = bundle.inputData?.id;
        if (!hookId) return {};
        const response = await z.request({
          url: `https://api.orbitly.io/public/v1/webhooks/${hookId}`,
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${bundle.authData.apiKey}`,
          },
        });
        return response.data;
      },
      perform: (z: ZapierZObject, bundle: ZapierBundle) => {
        return [bundle.inputData];
      },
      sample: {
        id: 'post_sample_failed_102',
        status: 'FAILED',
        channelId: 'chan_instagram_456',
        lastError: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Instagram Publishing API hourly limit reached.',
        },
      },
    },
  },
};

// ==========================================
// CREATES (ACTIONS)
// ==========================================

export const creates = {
  create_post: {
    key: 'create_post',
    noun: 'Post',
    display: {
      label: 'Create Post',
      description: 'Creates a draft or scheduled post across one or more social media channels.',
    },
    operation: {
      inputFields: [
        {
          key: 'content',
          label: 'Post Content',
          type: 'string',
          required: true,
          helpText: 'The caption, text, and hashtags for the post.',
        },
        {
          key: 'channelIds',
          label: 'Channel IDs',
          type: 'string',
          list: true,
          required: true,
          helpText: 'One or more channel IDs to publish this post to.',
        },
        {
          key: 'scheduledAt',
          label: 'Scheduled Time (ISO-8601)',
          type: 'datetime',
          required: false,
          helpText: 'Leave blank to save as a draft or schedule for default slot.',
        },
        {
          key: 'mediaUrls',
          label: 'Media URLs',
          type: 'string',
          list: true,
          required: false,
          helpText: 'Public image or video URLs to attach to this post.',
        },
      ],
      perform: async (
        z: ZapierZObject,
        bundle: ZapierBundle<{
          content: string;
          channelIds: string[];
          scheduledAt?: string;
          mediaUrls?: string[];
        }>,
      ) => {
        const response = await z.request({
          url: 'https://api.orbitly.io/public/v1/posts',
          method: 'POST',
          headers: {
            Authorization: `Bearer ${bundle.authData.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: {
            content: bundle.inputData.content,
            channelIds: Array.isArray(bundle.inputData.channelIds)
              ? bundle.inputData.channelIds
              : [bundle.inputData.channelIds],
            scheduledAt: bundle.inputData.scheduledAt,
            mediaUrls: bundle.inputData.mediaUrls || [],
          },
        });
        return response.data?.data;
      },
      sample: {
        id: 'post_created_789',
        status: 'SCHEDULED',
        scheduledAt: '2026-11-22T10:00:00Z',
        variants: [
          {
            id: 'variant_1',
            channelId: 'chan_1',
            status: 'SCHEDULED',
          },
        ],
      },
    },
  },

  upload_media: {
    key: 'upload_media',
    noun: 'Media',
    display: {
      label: 'Upload Media',
      description: 'Generates an upload URL and CDN public URL for media attachments.',
    },
    operation: {
      inputFields: [
        {
          key: 'fileName',
          label: 'File Name',
          type: 'string',
          required: true,
          helpText: 'e.g. promo-banner.png or video.mp4',
        },
        {
          key: 'mimeType',
          label: 'MIME Type',
          type: 'string',
          required: false,
          default: 'image/png',
          helpText: 'e.g. image/jpeg, image/png, video/mp4',
        },
        {
          key: 'fileSizeBytes',
          label: 'File Size in Bytes',
          type: 'integer',
          required: false,
          default: 1048576,
        },
      ],
      perform: async (
        z: ZapierZObject,
        bundle: ZapierBundle<{
          fileName: string;
          mimeType?: string;
          fileSizeBytes?: number;
        }>,
      ) => {
        const response = await z.request({
          url: 'https://api.orbitly.io/public/v1/media/upload-url',
          method: 'POST',
          headers: {
            Authorization: `Bearer ${bundle.authData.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: {
            fileName: bundle.inputData.fileName,
            mimeType: bundle.inputData.mimeType || 'image/png',
            fileSizeBytes: bundle.inputData.fileSizeBytes || 1048576,
          },
        });
        return response.data;
      },
      sample: {
        uploadUrl: 'https://storage.orbitly.io/uploads/ws_1/promo-banner.png',
        publicUrl: 'https://cdn.orbitly.io/ws_1/promo-banner.png',
        expiresInSeconds: 900,
      },
    },
  },
};

export const ZapierApp = {
  version: '1.0.0',
  platformVersion: '15.0.0',
  authentication,
  triggers,
  creates,
};

export default ZapierApp;

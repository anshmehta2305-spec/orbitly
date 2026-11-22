import { createStubProvider } from '../stub';

export const TwitterProvider = createStubProvider({
  id: 'x_twitter',
  name: 'X (formerly Twitter)',
  authType: 'oauth2',
  capabilities: {
    text: true,
    images: true,
    video: true,
    carousel: false,
    threads: true,
    firstComment: false,
    polls: true,
    scheduleNative: false,
  },
  limits: {
    maxChars: 280,
    maxImages: 4,
    maxVideoMb: 512,
  },
  docsUrl: 'https://developer.x.com/en/docs/x-api/tweets/manage-tweets/api-reference/post-tweets',
});

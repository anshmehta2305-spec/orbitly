import { createStubProvider } from '../stub';

export const ThreadsProvider = createStubProvider({
  id: 'threads',
  name: 'Threads Graph API',
  authType: 'oauth2',
  capabilities: {
    text: true,
    images: true,
    video: true,
    carousel: true,
    threads: true,
    firstComment: false,
    polls: false,
    scheduleNative: false,
  },
  limits: {
    maxChars: 500,
    maxImages: 10,
    maxVideoMb: 100,
  },
  docsUrl: 'https://developers.facebook.com/docs/threads',
});

import { createStubProvider } from '../stub';

export const YouTubeProvider = createStubProvider({
  id: 'youtube',
  name: 'YouTube Data API v3',
  authType: 'oauth2',
  capabilities: {
    text: true,
    images: false,
    video: true,
    carousel: false,
    threads: false,
    firstComment: false,
    polls: false,
    scheduleNative: true,
  },
  limits: {
    maxChars: 5000,
    maxImages: 0,
    maxVideoMb: 2048,
  },
  docsUrl: 'https://developers.google.com/youtube/v3/docs/videos/insert',
});

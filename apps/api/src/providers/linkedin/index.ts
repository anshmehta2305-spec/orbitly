import { createStubProvider } from '../stub';

export const LinkedInProvider = createStubProvider({
  id: 'linkedin',
  name: 'LinkedIn',
  authType: 'oauth2',
  capabilities: {
    text: true,
    images: true,
    video: true,
    carousel: true,
    threads: false,
    firstComment: true,
    polls: true,
    scheduleNative: false,
  },
  limits: {
    maxChars: 3000,
    maxImages: 9,
    maxVideoMb: 200,
  },
  docsUrl: 'https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin',
});

import { createStubProvider } from '../stub';

export const MetaInstagramProvider = createStubProvider({
  id: 'instagram',
  name: 'Instagram Graph API',
  authType: 'oauth2',
  capabilities: {
    text: true,
    images: true,
    video: true,
    carousel: true,
    threads: false,
    firstComment: true,
    polls: false,
    scheduleNative: false,
  },
  limits: {
    maxChars: 2200,
    maxImages: 10,
    maxVideoMb: 100,
  },
  docsUrl: 'https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/content-publishing',
});

export const MetaFacebookProvider = createStubProvider({
  id: 'facebook',
  name: 'Facebook Pages API',
  authType: 'oauth2',
  capabilities: {
    text: true,
    images: true,
    video: true,
    carousel: true,
    threads: false,
    firstComment: true,
    polls: false,
    scheduleNative: false,
  },
  limits: {
    maxChars: 63206,
    maxImages: 10,
    maxVideoMb: 500,
  },
  docsUrl: 'https://developers.facebook.com/docs/pages/publishing',
});

import { describe, it, expect } from 'vitest';
import { isSafePublicUrl } from '../security/ssrf';

describe('SSRF Security Validator', () => {
  it('blocks localhost and loopback domains', () => {
    expect(isSafePublicUrl('http://localhost:3000').safe).toBe(false);
    expect(isSafePublicUrl('http://127.0.0.1/admin').safe).toBe(false);
    expect(isSafePublicUrl('http://127.0.0.2:8080').safe).toBe(false);
    expect(isSafePublicUrl('http://0.0.0.0').safe).toBe(false);
  });

  it('blocks private RFC 1918 IPv4 ranges', () => {
    expect(isSafePublicUrl('http://10.0.1.50/api').safe).toBe(false);
    expect(isSafePublicUrl('http://172.16.0.5/secrets').safe).toBe(false);
    expect(isSafePublicUrl('http://172.31.255.255/internal').safe).toBe(false);
    expect(isSafePublicUrl('http://192.168.1.1/router').safe).toBe(false);
  });

  it('blocks AWS/GCP cloud metadata instance endpoint', () => {
    expect(isSafePublicUrl('http://169.254.169.254/latest/meta-data').safe).toBe(false);
    expect(isSafePublicUrl('http://169.254.1.1').safe).toBe(false);
  });

  it('blocks non-HTTP protocols', () => {
    expect(isSafePublicUrl('file:///etc/passwd').safe).toBe(false);
    expect(isSafePublicUrl('gopher://internal.network').safe).toBe(false);
    expect(isSafePublicUrl('ftp://ftp.server.com').safe).toBe(false);
  });

  it('allows valid public HTTPS and HTTP URLs', () => {
    expect(isSafePublicUrl('https://techcrunch.com/article/123').safe).toBe(true);
    expect(isSafePublicUrl('https://blog.orbitly.io/rss.xml').safe).toBe(true);
    expect(isSafePublicUrl('https://news.ycombinator.com').safe).toBe(true);
  });
});

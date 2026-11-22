// Native global URL is used

/**
 * SSRF (Server-Side Request Forgery) protection:
 * Validates URLs before fetching content for repurposing or RSS polling.
 * Blocks:
 * - Non-HTTP/HTTPS protocols (file://, gopher://, ftp://)
 * - Loopback and localhost addresses (127.0.0.1, ::1, localhost)
 * - RFC 1918 private IPv4 ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
 * - Link-local / Cloud metadata addresses (169.254.169.254, 169.254.0.0/16)
 * - Broadcast / 0.0.0.0 addresses
 */

export function isSafePublicUrl(urlString: string): { safe: boolean; reason?: string } {
  try {
    const parsed = new URL(urlString);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, reason: `Unsupported protocol: ${parsed.protocol}. Only HTTP and HTTPS are permitted.` };
    }

    const hostname = parsed.hostname.toLowerCase().trim();

    // Check localhost variants
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '0.0.0.0'
    ) {
      return { safe: false, reason: 'Access to localhost and loopback interfaces is strictly prohibited.' };
    }

    // Check Cloud metadata service IP
    if (hostname === '169.254.169.254' || hostname.startsWith('169.254.')) {
      return { safe: false, reason: 'Access to cloud instance metadata service is prohibited.' };
    }

    // Check IPv4 octets for private RFC 1918 ranges
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = hostname.match(ipv4Regex);

    if (match) {
      const o1 = parseInt(match[1], 10);
      const o2 = parseInt(match[2], 10);
      const o3 = parseInt(match[3], 10);
      const o4 = parseInt(match[4], 10);

      if (o1 > 255 || o2 > 255 || o3 > 255 || o4 > 255) {
        return { safe: false, reason: 'Invalid IP address.' };
      }

      // 10.0.0.0/8
      if (o1 === 10) {
        return { safe: false, reason: 'Private IP range (10.0.0.0/8) blocked.' };
      }

      // 172.16.0.0/12 (172.16 - 172.31)
      if (o1 === 172 && o2 >= 16 && o2 <= 31) {
        return { safe: false, reason: 'Private IP range (172.16.0.0/12) blocked.' };
      }

      // 192.168.0.0/16
      if (o1 === 192 && o2 === 168) {
        return { safe: false, reason: 'Private IP range (192.168.0.0/16) blocked.' };
      }

      // 127.0.0.0/8
      if (o1 === 127) {
        return { safe: false, reason: 'Loopback range (127.0.0.0/8) blocked.' };
      }

      // 0.0.0.0/8
      if (o1 === 0) {
        return { safe: false, reason: 'Broadcast / zero address blocked.' };
      }
    }

    return { safe: true };
  } catch {
    return { safe: false, reason: 'Malformed or invalid URL string.' };
  }
}

/**
 * Lightweight IPv4 & IPv6 CIDR / IP match utility for enterprise IP allowlisting.
 */

function ipToInt(ip: string): number {
  return ip
    .split('.')
    .reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0);
}

export function isIpInCidr(clientIp: string, cidrOrIp: string): boolean {
  if (!clientIp || !cidrOrIp) return false;

  const cleanClient = clientIp.replace(/^::ffff:/, '').trim();
  const cleanTarget = cidrOrIp.trim();

  // Exact match
  if (cleanClient === cleanTarget || cleanTarget === '*' || cleanTarget === '0.0.0.0/0') {
    return true;
  }

  // Localhost aliases
  if (
    (cleanClient === '127.0.0.1' || cleanClient === '::1') &&
    (cleanTarget === '127.0.0.1' || cleanTarget === 'localhost' || cleanTarget === '::1')
  ) {
    return true;
  }

  // CIDR notation (IPv4)
  if (cleanTarget.includes('/')) {
    const [range, bitsStr] = cleanTarget.split('/');
    const bits = parseInt(bitsStr, 10);
    if (isNaN(bits) || bits < 0 || bits > 32) return false;

    // Check if both are valid IPv4
    const isIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(cleanClient) && /^(\d{1,3}\.){3}\d{1,3}$/.test(range);
    if (!isIpv4) return false;

    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    const clientInt = ipToInt(cleanClient);
    const rangeInt = ipToInt(range);

    return (clientInt & mask) === (rangeInt & mask);
  }

  return false;
}

export function isIpAllowed(clientIp: string, allowlist: string[]): boolean {
  if (!allowlist || allowlist.length === 0) return true; // Empty allowlist allows all
  return allowlist.some((entry) => isIpInCidr(clientIp, entry));
}

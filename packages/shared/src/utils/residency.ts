/**
 * Multi-region Data Residency and Infrastructure Routing Utilities
 * Regions: US (us-east-1) & EU (eu-central-1 Frankfurt)
 */

export type DataRegion = 'US' | 'EU';

export interface RegionalEndpoints {
  databaseHost: string;
  redisHost: string;
  storageBucket: string;
  storageEndpoint: string;
  queuePrefix: string;
  egressIpRange: string[];
}

export const REGIONAL_SPECS: Record<DataRegion, RegionalEndpoints> = {
  US: {
    databaseHost: 'postgres-us.orbitly.internal:5432',
    redisHost: 'redis-us.orbitly.internal:6379',
    storageBucket: 'orbitly-media-us-east-1',
    storageEndpoint: 'https://s3.us-east-1.amazonaws.com',
    queuePrefix: 'publishing-us',
    egressIpRange: ['198.51.100.10/30', '198.51.100.20/30'],
  },
  EU: {
    databaseHost: 'postgres-eu.orbitly.internal:5432',
    redisHost: 'redis-eu.orbitly.internal:6379',
    storageBucket: 'orbitly-media-eu-central-1',
    storageEndpoint: 'https://s3.eu-central-1.amazonaws.com',
    queuePrefix: 'publishing-eu',
    egressIpRange: ['198.51.100.50/30', '198.51.100.60/30'],
  },
};

export function getRegionalDatabaseUrl(region: DataRegion, baseUser = 'orbitly', baseDb = 'orbitly_prod'): string {
  const spec = REGIONAL_SPECS[region] || REGIONAL_SPECS.US;
  return `postgresql://${baseUser}@${spec.databaseHost}/${baseDb}?sslmode=require`;
}

export function getRegionalRedisConfig(region: DataRegion): { host: string; port: number; keyPrefix: string } {
  const spec = REGIONAL_SPECS[region] || REGIONAL_SPECS.US;
  const [host, port] = spec.redisHost.split(':');
  return {
    host,
    port: Number(port) || 6379,
    keyPrefix: `orbitly:${region.toLowerCase()}:`,
  };
}

export function getRegionalStorageBucket(region: DataRegion): { bucket: string; endpoint: string } {
  const spec = REGIONAL_SPECS[region] || REGIONAL_SPECS.US;
  return {
    bucket: spec.storageBucket,
    endpoint: spec.storageEndpoint,
  };
}

export function getRegionalQueueName(queueName: string, region: DataRegion): string {
  const spec = REGIONAL_SPECS[region] || REGIONAL_SPECS.US;
  return `${spec.queuePrefix}-${queueName}`;
}

/**
 * Strict Data Isolation Validation:
 * Asserts that EU customer data is NEVER processed or stored on US infrastructure.
 */
export function validateRegionIsolation(
  workspaceRegion: DataRegion,
  targetRegion: DataRegion,
): { allowed: boolean; reason?: string } {
  if (workspaceRegion === 'EU' && targetRegion !== 'EU') {
    return {
      allowed: false,
      reason: 'GDPR Data Residency Violation: EU customer data cannot be routed to non-EU infrastructure.',
    };
  }
  return { allowed: true };
}

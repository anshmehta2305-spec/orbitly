/**
 * Startup Security Validation Check for Orbitly API.
 * Fails fast on application boot if critical secrets are missing, weak, or insecure in production.
 */
export function validateProductionSecrets(): void {
  const isProd = process.env.NODE_ENV === 'production';
  const errors: string[] = [];

  // 1. Database URL
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is missing.');
  }

  // 2. JWT Access Secret
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    errors.push('JWT_SECRET is missing.');
  } else if (isProd && (jwtSecret.length < 32 || jwtSecret.includes('replace-in-production'))) {
    errors.push('JWT_SECRET is too weak for production (must be >= 32 characters and not default).');
  }

  // 3. JWT Refresh Secret
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!jwtRefreshSecret) {
    errors.push('JWT_REFRESH_SECRET is missing.');
  } else if (isProd && (jwtRefreshSecret.length < 32 || jwtRefreshSecret.includes('replace-in-production'))) {
    errors.push('JWT_REFRESH_SECRET is too weak for production (must be >= 32 characters and not default).');
  }

  // 4. Token Encryption Key (AES-256-GCM master key)
  const encKey = process.env.TOKEN_ENCRYPTION_KEY;
  if (!encKey) {
    errors.push('TOKEN_ENCRYPTION_KEY is missing.');
  } else if (encKey.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(encKey)) {
    errors.push('TOKEN_ENCRYPTION_KEY must be a 64-character (32-byte) hexadecimal string.');
  }

  // 5. Redis connection
  if (!process.env.REDIS_HOST && !process.env.REDIS_URL) {
    errors.push('Redis connection string (REDIS_HOST or REDIS_URL) is missing.');
  }

  // 6. Report or Halt
  if (errors.length > 0) {
    const errorMsg = `\n🔒 [FATAL STARTUP CONFIGURATION ERROR] Orbitly API cannot start due to missing or invalid required environment variables:\n- ${errors.join('\n- ')}\n\nPlease ensure your .env file is populated with valid connection parameters (see .env.example).\n`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}

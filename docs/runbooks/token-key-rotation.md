# Runbook: Zero-Downtime Token Encryption Key Rotation

Orbitly stores social OAuth access and refresh tokens using envelope encryption with **AES-256-GCM**.
Payload format: `keyId:iv:authTag:ciphertext`.
Key IDs supported: `v1` (`TOKEN_ENCRYPTION_KEY`) and `v2` (`TOKEN_ENCRYPTION_KEY_V2`).

## Phase 1: Generate New Master Key (V2)
1. Generate a cryptographic 32-byte hexadecimal key:
   ```bash
   openssl rand -hex 32
   ```
2. Set this key as `TOKEN_ENCRYPTION_KEY_V2` in production environment:
   ```env
   TOKEN_ENCRYPTION_KEY_V2=NEW_64_CHAR_HEX_KEY
   ```
3. Restart API and Worker services:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --no-deps api worker
   ```
   *At this stage, the platform seamlessly decrypts existing `v1` tokens and newly connected channels can use `v2`.*

## Phase 2: Run Re-encryption Migration Job
Run the background migration script to re-encrypt all stored tokens from `v1` to `v2`:
```bash
docker exec -it orbitly-worker node -e "
  const { prisma } = require('@orbitly/db');
  const { rotateSecret, isKeyRotationNeeded } = require('@orbitly/shared');

  async function rotateAll() {
    const channels = await prisma.channel.findMany();
    let rotated = 0;
    for (const chan of channels) {
      if (chan.credentials && isKeyRotationNeeded(chan.credentials, 'v2')) {
        const newCreds = rotateSecret(chan.credentials, 'v2');
        await prisma.channel.update({ where: { id: chan.id }, data: { credentials: newCreds } });
        rotated++;
      }
    }
    console.log('Successfully re-encrypted', rotated, 'channel credentials to key v2.');
  }
  rotateAll().then(() => process.exit(0));
"
```

## Phase 3: Promote V2 to Primary and Retire V1
1. Verify that 100% of stored tokens have been migrated to prefix `v2:`.
2. Move the value of `TOKEN_ENCRYPTION_KEY_V2` to `TOKEN_ENCRYPTION_KEY`.
3. Clear `TOKEN_ENCRYPTION_KEY_V2`.
4. Reload API and Worker. The key rotation is complete with zero customer disruption!

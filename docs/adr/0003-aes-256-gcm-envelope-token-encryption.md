# ADR 0003: AES-256-GCM Envelope Encryption & Key Rotation for OAuth Tokens

## Status
Accepted

## Context
Connected social accounts store highly sensitive OAuth access tokens and long-lived refresh tokens. Plaintext storage in PostgreSQL is a critical security vulnerability in the event of database dumps or SQL injection.

## Decision
All credentials are encrypted using **AES-256-GCM** with authenticated data. The serialized string format is:
`keyId:iv:authTag:ciphertext`
We support zero-downtime key rotation through multi-key store configuration (`TOKEN_ENCRYPTION_KEY` as `v1` and `TOKEN_ENCRYPTION_KEY_V2` as `v2`).

## Consequences
- Compromise of raw database tables does not yield usable OAuth tokens.
- Master keys can be rotated with zero downtime without disconnecting users.

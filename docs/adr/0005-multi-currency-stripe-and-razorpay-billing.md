# ADR 0005: Multi-Currency Stripe and Razorpay Multi-Provider Billing Architecture

## Status
Accepted

## Context
Orbitly serves a global audience. Stripe provides premier global coverage in USD, EUR, and GBP, but localized payment methods (UPI, NetBanking, RuPay) in India require Razorpay for high conversion.

## Decision
We implemented a multi-provider billing abstraction (`PaymentProvider` interface in `apps/api/src/modules/billing/`):
- **Stripe:** Default global provider for USD, EUR, GBP credit cards and Apple/Google Pay.
- **Razorpay:** Regional provider for INR currency supporting UPI and local cards.
- **Idempotency:** Inbound payment webhooks record incoming unique `PaymentEvent.eventId` in PostgreSQL, preventing duplicate event handling.
- **7-Day Grace Period:** When recurring payments fail (`PAST_DUE`), workspaces receive a 7-day grace window before automatic downgrade to Free.

## Consequences
- High payment conversion in both Western and Indian markets.
- Zero customer data deletion on payment failure.

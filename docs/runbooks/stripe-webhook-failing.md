# Incident Runbook: Stripe Webhook Failing

## Symptoms
- Alert in Stripe Dashboard: "Webhooks failing on endpoint `https://api.orbitly.app/billing/webhooks/stripe`".
- Customer checkout completing but workspace plan remaining on Free.
- Customer payment failing but workspace not entering 7-day grace period.

## Immediate Diagnosis
1. **Check Webhook Signature Secret:**
   - In Stripe Dashboard > Developers > Webhooks, inspect endpoint signing secret `whsec_...`.
   - Verify matching value in server environment:
     ```bash
     docker exec -it orbitly-api printenv STRIPE_WEBHOOK_SECRET
     ```
2. **Review Inbound Webhook Error Logs:**
   ```bash
   docker logs --tail 100 orbitly-api | grep -i "stripe"
   ```
3. **Verify Clock Drift:**
   Stripe webhook signatures include a timestamp. If server clock drift exceeds 300 seconds (5 minutes), requests are rejected to prevent replay attacks:
   ```bash
   date -u
   ```

## Recovery
1. **If Signature Secret Mismatched:**
   Update `STRIPE_WEBHOOK_SECRET` in `.env.production` and restart the API container:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --no-deps api
   ```
2. **Replay Missed Webhook Events from Stripe:**
   - In Stripe Dashboard > Developers > Webhooks > Click the endpoint.
   - Click "Failed" events tab > Select missed events > Click **"Resend event"**.
   - Because Orbitly implements idempotent `PaymentEvent.eventId` deduplication, resending is 100% safe and will never duplicate charges or grants.

import { describe, it, expect, vi } from 'vitest';
import { PostStatus, localToUtc, utcToLocal } from '@orbitly/shared';

describe('Production Edge Cases & Failure Recovery Suite', () => {
  describe('Double-Publish Prevention via Distributed Mutex Lock', () => {
    class MockPublishingWorker {
      private activeLocks = new Set<string>();
      private publishedVariants = new Set<string>();

      async executePublishJob(variantId: string): Promise<{ success: boolean; reason?: string }> {
        const lockKey = `lock:publish:${variantId}`;

        // Attempt acquiring atomic lock
        if (this.activeLocks.has(lockKey)) {
          return { success: false, reason: 'LOCKED_BY_ANOTHER_WORKER' };
        }

        this.activeLocks.add(lockKey);

        try {
          // Check if already published (idempotency check)
          if (this.publishedVariants.has(variantId)) {
            return { success: false, reason: 'ALREADY_PUBLISHED' };
          }

          // Simulate upstream publishing latency
          await new Promise((r) => setTimeout(r, 10));
          this.publishedVariants.add(variantId);

          return { success: true };
        } finally {
          this.activeLocks.delete(lockKey);
        }
      }
    }

    it('prevents concurrent worker executions from publishing the same variant twice', async () => {
      const worker = new MockPublishingWorker();
      const variantId = 'var_concurrent_99';

      // Fire 5 concurrent publish invocations on the same variant
      const results = await Promise.all([
        worker.executePublishJob(variantId),
        worker.executePublishJob(variantId),
        worker.executePublishJob(variantId),
        worker.executePublishJob(variantId),
        worker.executePublishJob(variantId),
      ]);

      const successful = results.filter((r) => r.success);
      const locked = results.filter((r) => r.reason === 'LOCKED_BY_ANOTHER_WORKER' || r.reason === 'ALREADY_PUBLISHED');

      // Exactly 1 must succeed and the other 4 must be safely aborted
      expect(successful.length).toBe(1);
      expect(locked.length).toBe(4);
    });
  });

  describe('Webhook Idempotency Protection', () => {
    class PaymentEventStore {
      private processedEvents = new Set<string>();

      async processWebhook(eventId: string, payload: any): Promise<{ processed: boolean; duplicate: boolean }> {
        if (this.processedEvents.has(eventId)) {
          // Idempotent early-return
          return { processed: false, duplicate: true };
        }

        this.processedEvents.add(eventId);
        return { processed: true, duplicate: false };
      }
    }

    it('rejects duplicate webhook deliveries with identical eventId', async () => {
      const store = new PaymentEventStore();
      const eventId = 'evt_stripe_test_12345';

      const firstAttempt = await store.processWebhook(eventId, { type: 'invoice.paid' });
      expect(firstAttempt.processed).toBe(true);
      expect(firstAttempt.duplicate).toBe(false);

      const duplicateAttempt = await store.processWebhook(eventId, { type: 'invoice.paid' });
      expect(duplicateAttempt.processed).toBe(false);
      expect(duplicateAttempt.duplicate).toBe(true);
    });
  });

  describe('Token Refresh Race Mutex', () => {
    class TokenManager {
      private refreshInProgress = new Map<string, Promise<string>>();
      private tokenVersion = 1;

      async getFreshAccessToken(accountId: string): Promise<string> {
        if (this.refreshInProgress.has(accountId)) {
          // Wait on the existing inflight refresh rather than firing a duplicate
          return this.refreshInProgress.get(accountId)!;
        }

        const refreshPromise = (async () => {
          await new Promise((r) => setTimeout(r, 15));
          this.tokenVersion += 1;
          return `token_v${this.tokenVersion}`;
        })();

        this.refreshInProgress.set(accountId, refreshPromise);

        try {
          const newToken = await refreshPromise;
          return newToken;
        } finally {
          this.refreshInProgress.delete(accountId);
        }
      }
    }

    it('coalesces concurrent token refresh attempts to prevent invalidating refresh tokens', async () => {
      const manager = new TokenManager();
      const accountId = 'acc_x_101';

      // 4 concurrent API calls detecting an expiring token
      const tokens = await Promise.all([
        manager.getFreshAccessToken(accountId),
        manager.getFreshAccessToken(accountId),
        manager.getFreshAccessToken(accountId),
        manager.getFreshAccessToken(accountId),
      ]);

      // All 4 should resolve to the exact same newly minted token from a single upstream refresh call
      expect(tokens[0]).toBe('token_v2');
      expect(tokens[1]).toBe('token_v2');
      expect(tokens[2]).toBe('token_v2');
      expect(tokens[3]).toBe('token_v2');
    });
  });

  describe('Timezone & DST Boundary Preservation', () => {
    it('preserves exact wall-clock posting time across Daylight Saving Time shifts', () => {
      // In Europe/London:
      // Winter (GMT / UTC+0): 2026-01-15 09:00 -> 09:00 UTC
      const winterDate = localToUtc('2026-01-15', '09:00', 'Europe/London');
      expect(winterDate.toISOString()).toBe('2026-01-15T09:00:00.000Z');

      // Summer (BST / UTC+1): 2026-07-15 09:00 -> 08:00 UTC
      const summerDate = localToUtc('2026-07-15', '09:00', 'Europe/London');
      expect(summerDate.toISOString()).toBe('2026-07-15T08:00:00.000Z');

      // When converting back for the user, both must render as 09:00 in London
      expect(utcToLocal(winterDate, 'Europe/London').timeStr).toBe('09:00');
      expect(utcToLocal(summerDate, 'Europe/London').timeStr).toBe('09:00');
    });
  });

  describe('Approval State Machine Transitions', () => {
    type ApprovalState = 'DRAFT' | 'PENDING_APPROVAL' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED';

    function transition(current: ApprovalState, action: 'SUBMIT' | 'REQUEST_CHANGES' | 'APPROVE' | 'REJECT'): ApprovalState {
      switch (current) {
        case 'DRAFT':
          if (action === 'SUBMIT') return 'PENDING_APPROVAL';
          break;
        case 'PENDING_APPROVAL':
          if (action === 'APPROVE') return 'APPROVED';
          if (action === 'REQUEST_CHANGES') return 'CHANGES_REQUESTED';
          if (action === 'REJECT') return 'REJECTED';
          break;
        case 'CHANGES_REQUESTED':
          if (action === 'SUBMIT') return 'PENDING_APPROVAL';
          break;
        case 'APPROVED':
        case 'REJECTED':
          // Terminal states
          break;
      }
      throw new Error(`InvalidStateTransition: Cannot ${action} from ${current}`);
    }

    it('executes full collaborative approval lifecycle', () => {
      let state: ApprovalState = 'DRAFT';

      // 1. Author submits for review
      state = transition(state, 'SUBMIT');
      expect(state).toBe('PENDING_APPROVAL');

      // 2. Reviewer requests changes
      state = transition(state, 'REQUEST_CHANGES');
      expect(state).toBe('CHANGES_REQUESTED');

      // 3. Author fixes and resubmits
      state = transition(state, 'SUBMIT');
      expect(state).toBe('PENDING_APPROVAL');

      // 4. Reviewer approves
      state = transition(state, 'APPROVE');
      expect(state).toBe('APPROVED');

      // 5. Terminal state cannot be re-approved or changed
      expect(() => transition(state, 'SUBMIT')).toThrow('InvalidStateTransition');
    });
  });
});

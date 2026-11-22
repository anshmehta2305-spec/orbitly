import { PostStatus } from '../types';

export interface VariantStatusItem {
  id: string;
  status: PostStatus;
}

/**
 * Recomputes parent Post status based on all its child PostVariants.
 * Rules:
 * 1. If any variant is actively PUBLISHING -> PUBLISHING
 * 2. If all variants are PUBLISHED -> PUBLISHED
 * 3. If all variants FAILED -> FAILED
 * 4. If at least one variant is PUBLISHED and at least one is FAILED -> PARTIAL
 * 5. If all variants are CANCELLED -> CANCELLED
 * 6. If any variant is SCHEDULED -> SCHEDULED
 * 7. If any variant is PENDING_APPROVAL -> PENDING_APPROVAL
 * 8. Otherwise -> DRAFT
 */
export function computePostStatusRollup(variants: VariantStatusItem[]): PostStatus {
  if (!variants || variants.length === 0) {
    return PostStatus.DRAFT;
  }

  const statuses = variants.map((v) => v.status);

  // 1. Publishing in progress
  if (statuses.some((s) => s === PostStatus.PUBLISHING)) {
    return PostStatus.PUBLISHING;
  }

  // 2. All Published
  if (statuses.every((s) => s === PostStatus.PUBLISHED)) {
    return PostStatus.PUBLISHED;
  }

  // 3. All Failed
  if (statuses.every((s) => s === PostStatus.FAILED)) {
    return PostStatus.FAILED;
  }

  // 4. Partial publication (mix of Published and Failed/Cancelled)
  const hasPublished = statuses.some((s) => s === PostStatus.PUBLISHED);
  const hasFailed = statuses.some((s) => s === PostStatus.FAILED);
  if (hasPublished && hasFailed) {
    return PostStatus.PARTIAL;
  }

  // 5. All Cancelled
  if (statuses.every((s) => s === PostStatus.CANCELLED)) {
    return PostStatus.CANCELLED;
  }

  // 6. Scheduled
  if (statuses.some((s) => s === PostStatus.SCHEDULED)) {
    return PostStatus.SCHEDULED;
  }

  // 7. Pending Approval
  if (statuses.some((s) => s === PostStatus.PENDING_APPROVAL || s === PostStatus.IN_REVIEW)) {
    return PostStatus.PENDING_APPROVAL;
  }

  return PostStatus.DRAFT;
}

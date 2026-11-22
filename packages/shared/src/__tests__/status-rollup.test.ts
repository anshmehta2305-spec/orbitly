import { describe, it, expect } from 'vitest';
import { computePostStatusRollup } from '../utils/status-rollup';
import { PostStatus } from '../types';

describe('Post Status Roll-up Logic', () => {
  it('returns DRAFT when no variants are provided', () => {
    expect(computePostStatusRollup([])).toBe(PostStatus.DRAFT);
  });

  it('rolls up to PUBLISHING if any variant is currently publishing', () => {
    const variants = [
      { id: 'v1', status: PostStatus.PUBLISHED },
      { id: 'v2', status: PostStatus.PUBLISHING },
      { id: 'v3', status: PostStatus.SCHEDULED },
    ];
    expect(computePostStatusRollup(variants)).toBe(PostStatus.PUBLISHING);
  });

  it('rolls up to PUBLISHED if all variants succeeded', () => {
    const variants = [
      { id: 'v1', status: PostStatus.PUBLISHED },
      { id: 'v2', status: PostStatus.PUBLISHED },
      { id: 'v3', status: PostStatus.PUBLISHED },
    ];
    expect(computePostStatusRollup(variants)).toBe(PostStatus.PUBLISHED);
  });

  it('rolls up to PARTIAL if some variants published and others failed', () => {
    const variants = [
      { id: 'v1', status: PostStatus.PUBLISHED },
      { id: 'v2', status: PostStatus.FAILED },
    ];
    expect(computePostStatusRollup(variants)).toBe(PostStatus.PARTIAL);
  });

  it('rolls up to FAILED if all variants failed', () => {
    const variants = [
      { id: 'v1', status: PostStatus.FAILED },
      { id: 'v2', status: PostStatus.FAILED },
    ];
    expect(computePostStatusRollup(variants)).toBe(PostStatus.FAILED);
  });

  it('rolls up to SCHEDULED if pending scheduling', () => {
    const variants = [
      { id: 'v1', status: PostStatus.SCHEDULED },
      { id: 'v2', status: PostStatus.SCHEDULED },
    ];
    expect(computePostStatusRollup(variants)).toBe(PostStatus.SCHEDULED);
  });

  it('rolls up to CANCELLED if all variants cancelled', () => {
    const variants = [
      { id: 'v1', status: PostStatus.CANCELLED },
      { id: 'v2', status: PostStatus.CANCELLED },
    ];
    expect(computePostStatusRollup(variants)).toBe(PostStatus.CANCELLED);
  });
});
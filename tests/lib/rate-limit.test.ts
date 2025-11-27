import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rateLimit, apiRateLimit, expensiveOperationLimit } from '@/lib/rate-limit';
import { redis } from '@/lib/upstash';

// Mock redis
vi.mock('@/lib/upstash', () => ({
  redis: {
    incr: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn(),
  },
}));

describe('rateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow request when under limit', async () => {
    vi.mocked(redis.incr).mockResolvedValue(1);
    vi.mocked(redis.ttl).mockResolvedValue(60);

    const result = await rateLimit('test-user', 10, 60);

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(9);
    expect(result.limit).toBe(10);
    expect(redis.incr).toHaveBeenCalledWith('rate-limit:test-user');
    expect(redis.expire).toHaveBeenCalledWith('rate-limit:test-user', 60);
  });

  it('should block request when over limit', async () => {
    vi.mocked(redis.incr).mockResolvedValue(11);
    vi.mocked(redis.ttl).mockResolvedValue(30);

    const result = await rateLimit('test-user', 10, 60);

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should set expiration only on first request', async () => {
    vi.mocked(redis.incr).mockResolvedValue(5); // Not first request
    vi.mocked(redis.ttl).mockResolvedValue(45);

    await rateLimit('test-user', 10, 60);

    expect(redis.expire).not.toHaveBeenCalled();
  });

  it('should handle Redis errors gracefully', async () => {
    vi.mocked(redis.incr).mockRejectedValue(new Error('Redis connection failed'));

    const result = await rateLimit('test-user', 10, 60);

    // Should allow request when Redis fails
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(10);
  });

  it('should calculate correct reset time', async () => {
    vi.mocked(redis.incr).mockResolvedValue(1);
    vi.mocked(redis.ttl).mockResolvedValue(45);

    const beforeCall = Date.now();
    const result = await rateLimit('test-user', 10, 60);
    const afterCall = Date.now();

    // Reset should be roughly 45 seconds from now
    expect(result.reset).toBeGreaterThanOrEqual(beforeCall + 45000);
    expect(result.reset).toBeLessThanOrEqual(afterCall + 46000);
  });
});

describe('apiRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should apply free tier limits', async () => {
    vi.mocked(redis.incr).mockResolvedValue(1);
    vi.mocked(redis.ttl).mockResolvedValue(3600);

    const result = await apiRateLimit('test-user', 'free');

    expect(result.limit).toBe(100);
    expect(redis.expire).toHaveBeenCalledWith('rate-limit:test-user', 3600);
  });

  it('should apply starter tier limits', async () => {
    vi.mocked(redis.incr).mockResolvedValue(1);
    vi.mocked(redis.ttl).mockResolvedValue(3600);

    const result = await apiRateLimit('test-user', 'starter');

    expect(result.limit).toBe(1000);
  });

  it('should apply professional tier limits', async () => {
    vi.mocked(redis.incr).mockResolvedValue(1);
    vi.mocked(redis.ttl).mockResolvedValue(3600);

    const result = await apiRateLimit('test-user', 'professional');

    expect(result.limit).toBe(10000);
  });

  it('should apply enterprise tier limits', async () => {
    vi.mocked(redis.incr).mockResolvedValue(1);
    vi.mocked(redis.ttl).mockResolvedValue(3600);

    const result = await apiRateLimit('test-user', 'enterprise');

    expect(result.limit).toBe(100000);
  });

  it('should default to free tier', async () => {
    vi.mocked(redis.incr).mockResolvedValue(1);
    vi.mocked(redis.ttl).mockResolvedValue(3600);

    const result = await apiRateLimit('test-user');

    expect(result.limit).toBe(100);
  });
});

describe('expensiveOperationLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should apply strict limits for expensive operations', async () => {
    vi.mocked(redis.incr).mockResolvedValue(1);
    vi.mocked(redis.ttl).mockResolvedValue(60);

    const result = await expensiveOperationLimit('test-user');

    expect(result.limit).toBe(10);
    expect(redis.expire).toHaveBeenCalledWith('rate-limit:test-user', 60);
  });

  it('should block after 10 requests', async () => {
    vi.mocked(redis.incr).mockResolvedValue(11);
    vi.mocked(redis.ttl).mockResolvedValue(30);

    const result = await expensiveOperationLimit('test-user');

    expect(result.success).toBe(false);
  });
});

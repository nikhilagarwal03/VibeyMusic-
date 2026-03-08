type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  limit: number;
};

type MemoryRateLimitEntry = {
  count: number;
  resetAt: number;
};

const parseInteger = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const encodeRedisKey = (value: string) => encodeURIComponent(value);

export class RateLimitHelper {
  private readonly memoryStore = new Map<string, MemoryRateLimitEntry>();
  private readonly redisUrl = process.env.REDIS_URL;
  private readonly redisToken = process.env.REDIS_TOKEN;

  private get useRedis() {
    return Boolean(this.redisUrl && this.redisToken);
  }

  getWindowMs() {
    return parseInteger(process.env.RATE_LIMIT_WINDOW_MS, 60_000);
  }

  getMaxRequests() {
    return parseInteger(process.env.RATE_LIMIT_MAX_REQUESTS, 80);
  }

  async evaluate(key: string) {
    const limit = this.getMaxRequests();
    const windowMs = this.getWindowMs();

    if (this.useRedis) {
      try {
        return await this.evaluateWithRedis(key, limit, windowMs);
      } catch {
        return this.evaluateWithMemory(key, limit, windowMs);
      }
    }

    return this.evaluateWithMemory(key, limit, windowMs);
  }

  private async evaluateWithRedis(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const encodedKey = encodeRedisKey(`ratelimit:${key}`);
    const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));

    const incrResponse = await fetch(`${this.redisUrl}/incr/${encodedKey}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.redisToken}`,
      },
    });

    if (!incrResponse.ok) {
      throw new Error("Failed to increment rate limit counter");
    }

    const incrPayload = (await incrResponse.json().catch(() => ({}))) as { result?: number };
    const count = Number(incrPayload?.result || 0);

    // Set TTL when key is first seen within current window.
    if (count <= 1) {
      await fetch(`${this.redisUrl}/expire/${encodedKey}/${windowSeconds}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.redisToken}`,
        },
      }).catch(() => null);
    }

    const remaining = Math.max(0, limit - count);
    const retryAfterSeconds = count > limit ? windowSeconds : 0;

    return {
      allowed: count <= limit,
      remaining,
      retryAfterSeconds,
      limit,
    };
  }

  private evaluateWithMemory(key: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const current = this.memoryStore.get(key);

    if (!current || now > current.resetAt) {
      this.memoryStore.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });

      return {
        allowed: true,
        remaining: Math.max(0, limit - 1),
        retryAfterSeconds: 0,
        limit,
      };
    }

    current.count += 1;
    this.memoryStore.set(key, current);

    if (this.memoryStore.size > 2000) {
      for (const [storeKey, value] of this.memoryStore.entries()) {
        if (value.resetAt < now) {
          this.memoryStore.delete(storeKey);
        }
      }
    }

    const remaining = Math.max(0, limit - current.count);
    const retryAfterSeconds = current.count > limit
      ? Math.max(1, Math.ceil((current.resetAt - now) / 1000))
      : 0;

    return {
      allowed: current.count <= limit,
      remaining,
      retryAfterSeconds,
      limit,
    };
  }
}

type CacheEntry = {
  body: string;
  status: number;
  contentType: string;
  cachedAt: number;
  ttlMs: number;
};

const parseInteger = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const encodeRedisKey = (value: string) => encodeURIComponent(value);

export class CacheHelper {
  private readonly memoryStore = new Map<string, CacheEntry>();
  private readonly redisUrl = process.env.REDIS_URL;
  private readonly redisToken = process.env.REDIS_TOKEN;

  private get useRedis() {
    return Boolean(this.redisUrl && this.redisToken);
  }

  getCacheTtlMs(path: string) {
    if (path.startsWith("/api/search")) {
      return parseInteger(process.env.CACHE_TTL_SEARCH_MS, 60_000);
    }

    if (
      path.startsWith("/api/songs") ||
      path.startsWith("/api/albums") ||
      path.startsWith("/api/artists") ||
      path.startsWith("/api/playlists")
    ) {
      return parseInteger(process.env.CACHE_TTL_DETAILS_MS, 300_000);
    }

    return 0;
  }

  async get(key: string) {
    if (this.useRedis) {
      try {
        const fromRedis = await this.getFromRedis(key);
        if (fromRedis) {
          return fromRedis;
        }
      } catch {
        // fall through to memory
      }
    }

    const entry = this.memoryStore.get(key);
    if (!entry) return null;

    if (Date.now() - entry.cachedAt > entry.ttlMs) {
      this.memoryStore.delete(key);
      return null;
    }

    return entry;
  }

  async set(key: string, entry: CacheEntry) {
    if (this.useRedis) {
      try {
        await this.setInRedis(key, entry);
      } catch {
        this.memoryStore.set(key, entry);
      }
      return;
    }

    this.memoryStore.set(key, entry);
    if (this.memoryStore.size > 1000) {
      this.cleanupMemory();
    }
  }

  private cleanupMemory() {
    const now = Date.now();
    for (const [key, value] of this.memoryStore.entries()) {
      if (now - value.cachedAt > value.ttlMs) {
        this.memoryStore.delete(key);
      }
    }
  }

  private async getFromRedis(key: string) {
    const encodedKey = encodeRedisKey(`cache:${key}`);
    const response = await fetch(`${this.redisUrl}/get/${encodedKey}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.redisToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Redis get failed");
    }

    const payload = (await response.json().catch(() => ({}))) as { result?: string | null };
    if (!payload.result) {
      return null;
    }

    const parsed = JSON.parse(payload.result) as CacheEntry;
    if (Date.now() - parsed.cachedAt > parsed.ttlMs) {
      return null;
    }

    return parsed;
  }

  private async setInRedis(key: string, entry: CacheEntry) {
    const encodedKey = encodeRedisKey(`cache:${key}`);
    const ttlSeconds = Math.max(1, Math.ceil(entry.ttlMs / 1000));
    const payload = JSON.stringify(entry);

    const response = await fetch(`${this.redisUrl}/setex/${encodedKey}/${ttlSeconds}/${encodeURIComponent(payload)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.redisToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Redis set failed");
    }
  }
}

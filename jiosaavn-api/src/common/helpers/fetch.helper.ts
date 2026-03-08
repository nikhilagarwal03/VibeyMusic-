import { userAgents, type Endpoints } from "#common/constants";
import type { ApiContextEnum } from "#common/enums";

type EndpointValue = (typeof Endpoints)[keyof typeof Endpoints];

interface FetchParams {
  endpoint: EndpointValue;
  params: Record<string, string | number>;
  context?: ApiContextEnum;
}

interface FetchResponse<T> {
  data: T;
  ok: Response["ok"];
}

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_BACKOFF_MS = 250;
const DEFAULT_CIRCUIT_BREAKER_THRESHOLD = 5;
const DEFAULT_CIRCUIT_BREAKER_COOLDOWN_MS = 30_000;

const circuitBreakerState = {
  failures: 0,
  openedAt: 0,
};

const markCircuitFailure = (threshold: number) => {
  circuitBreakerState.failures += 1;

  if (circuitBreakerState.failures >= threshold && circuitBreakerState.openedAt === 0) {
    circuitBreakerState.openedAt = Date.now();
  }
};

const markCircuitSuccess = () => {
  circuitBreakerState.failures = 0;
  circuitBreakerState.openedAt = 0;
};

const getNumberFromEnv = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const sleep = async (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableStatus = (status: number) => status === 429 || status >= 500;

export const fetchFromJioSaavn = async <T>({
  endpoint,
  params,
  context,
}: FetchParams): Promise<FetchResponse<T>> => {
  const url = new URL("https://www.jiosaavn.com/api.php");

  url.searchParams.append("__call", endpoint.toString());
  url.searchParams.append("_format", "json");
  url.searchParams.append("_marker", "0");
  url.searchParams.append("api_version", "4");
  url.searchParams.append("ctx", context || "web6dot0");

  Object.keys(params).forEach((key) =>
    url.searchParams.append(key, String(params[key])),
  );

  const randomUserAgent =
    userAgents[Math.floor(Math.random() * userAgents.length)];

  const timeoutMs = getNumberFromEnv(
    process.env.UPSTREAM_TIMEOUT_MS,
    DEFAULT_TIMEOUT_MS,
  );
  const maxRetries = getNumberFromEnv(
    process.env.UPSTREAM_MAX_RETRIES,
    DEFAULT_MAX_RETRIES,
  );
  const backoffMs = getNumberFromEnv(
    process.env.UPSTREAM_BACKOFF_MS,
    DEFAULT_BACKOFF_MS,
  );
  const circuitBreakerThreshold = getNumberFromEnv(
    process.env.UPSTREAM_CIRCUIT_BREAKER_THRESHOLD,
    DEFAULT_CIRCUIT_BREAKER_THRESHOLD,
  );
  const circuitBreakerCooldownMs = getNumberFromEnv(
    process.env.UPSTREAM_CIRCUIT_BREAKER_COOLDOWN_MS,
    DEFAULT_CIRCUIT_BREAKER_COOLDOWN_MS,
  );

  if (circuitBreakerState.openedAt > 0) {
    const remainingCooldownMs = circuitBreakerState.openedAt + circuitBreakerCooldownMs - Date.now();
    if (remainingCooldownMs > 0) {
      throw new Error(
        `Upstream circuit breaker is open. Retry after ${Math.ceil(remainingCooldownMs / 1000)}s`,
      );
    }

    // Cooldown elapsed: transition to half-open by clearing open state.
    circuitBreakerState.openedAt = 0;
  }

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url.toString(), {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": randomUserAgent,
        },
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok && isRetryableStatus(response.status) && attempt < maxRetries) {
        const jitter = Math.floor(Math.random() * 100);
        await sleep(backoffMs * (attempt + 1) + jitter);
        continue;
      }

      if (response.ok) {
        markCircuitSuccess();
      } else {
        markCircuitFailure(circuitBreakerThreshold);
      }

      return { data: data as T, ok: response.ok };
    } catch (error) {
      lastError = error;

      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        markCircuitFailure(circuitBreakerThreshold);
      }

      if (attempt >= maxRetries) {
        break;
      }

      const jitter = Math.floor(Math.random() * 100);
      await sleep(backoffMs * (attempt + 1) + jitter);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  markCircuitFailure(circuitBreakerThreshold);

  throw lastError instanceof Error
    ? lastError
    : new Error("Upstream request failed");
};

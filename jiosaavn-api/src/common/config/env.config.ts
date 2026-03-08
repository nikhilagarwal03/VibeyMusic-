import path from "node:path";
import { config as loadEnv } from "dotenv";
import { z } from "zod";

// Prefer a single root .env for the whole repo while allowing local override in jiosaavn-api/.env.
const apiRoot = process.cwd();
const workspaceRoot = path.resolve(apiRoot, "..");

loadEnv({ path: path.resolve(workspaceRoot, ".env") });
loadEnv({ path: path.resolve(apiRoot, ".env"), override: true });

const optionalString = () =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().optional(),
  );

const optionalUrl = () =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().url().optional(),
  );

const optionalMinString = (min: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().min(min).optional(),
  );

const optionalEmail = () =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().email().optional(),
  );

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    CORS_ORIGINS: optionalString(),
    UPSTREAM_TIMEOUT_MS: optionalString(),
    UPSTREAM_MAX_RETRIES: optionalString(),
    UPSTREAM_BACKOFF_MS: optionalString(),
    UPSTREAM_CIRCUIT_BREAKER_THRESHOLD: optionalString(),
    UPSTREAM_CIRCUIT_BREAKER_COOLDOWN_MS: optionalString(),
    REDIS_URL: optionalUrl(),
    REDIS_TOKEN: optionalString(),
    RATE_LIMIT_WINDOW_MS: optionalString(),
    RATE_LIMIT_MAX_REQUESTS: optionalString(),
    CACHE_TTL_SEARCH_MS: optionalString(),
    CACHE_TTL_DETAILS_MS: optionalString(),
    ADMIN_TOKEN: optionalString(),
    ADMIN_EMAIL: optionalEmail(),
    ADMIN_PASSWORD: optionalMinString(1),
    ADMIN_PASSWORD_HASH: optionalMinString(10),
    ADMIN_TOTP_SECRET: optionalMinString(16),
    ADMIN_ALLOWED_IPS: optionalString(),
    JWT_SECRET: optionalMinString(16),
    REFRESH_TOKEN_SECRET: optionalMinString(16),
    MONGODB_URI: optionalUrl(),
    MONGODB_DB_NAME: optionalMinString(1),
  })
  .superRefine((value, ctx) => {
    const hasMongoUri = Boolean(value.MONGODB_URI);
    const hasMongoDbName = Boolean(value.MONGODB_DB_NAME);

    if (hasMongoUri !== hasMongoDbName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "MONGODB_URI and MONGODB_DB_NAME must be provided together",
        path: hasMongoUri ? ["MONGODB_DB_NAME"] : ["MONGODB_URI"],
      });
    }

    if (value.ADMIN_EMAIL && !value.ADMIN_PASSWORD && !value.ADMIN_PASSWORD_HASH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ADMIN_PASSWORD_HASH or ADMIN_PASSWORD is required when ADMIN_EMAIL is set",
        path: ["ADMIN_PASSWORD_HASH"],
      });
    }

    if (!value.ADMIN_EMAIL && (value.ADMIN_PASSWORD || value.ADMIN_PASSWORD_HASH)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ADMIN_EMAIL is required when admin password credentials are configured",
        path: ["ADMIN_EMAIL"],
      });
    }

    if ((value.REDIS_URL && !value.REDIS_TOKEN) || (!value.REDIS_URL && value.REDIS_TOKEN)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "REDIS_URL and REDIS_TOKEN must be provided together",
        path: value.REDIS_URL ? ["REDIS_TOKEN"] : ["REDIS_URL"],
      });
    }
  });

export const env = envSchema.parse(process.env);
export type AppEnv = z.infer<typeof envSchema>;

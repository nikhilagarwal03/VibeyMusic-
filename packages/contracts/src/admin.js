import { z } from 'zod';

export const AdminLoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  otp: z.string().regex(/^\d{6}$/).optional(),
});

export const AdminTokenDataSchema = z.object({
  accessToken: z.string(),
  accessTokenTtlSeconds: z.number().int().positive(),
});

export const AdminHealthSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  environment: z.string(),
  activeSessionCount: z.number().int().nonnegative(),
});

export const AdminFeatureFlagSchema = z.object({
  key: z.string().min(1),
  enabled: z.boolean(),
  description: z.string().optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
});

export const AdminSystemSettingSchema = z.object({
  key: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  description: z.string().optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
  updatedBy: z.string().optional(),
});

export const AdminSecurityStatusSchema = z.object({
  requestIp: z.string(),
  csrfProtectionEnabled: z.boolean(),
  ipAllowlistEnabled: z.boolean(),
  allowedIpCount: z.number().int().nonnegative(),
  loginProtection: z.object({
    windowMs: z.number().int().nonnegative(),
    maxAttempts: z.number().int().nonnegative(),
    lockMs: z.number().int().nonnegative(),
    trackedKeys: z.number().int().nonnegative(),
    lockedKeys: z.number().int().nonnegative(),
  }),
});

export const AdminUsageSummarySchema = z.object({
  totalAuditEvents: z.number().int().nonnegative(),
  events24h: z.number().int().nonnegative(),
  failedLogins24h: z.number().int().nonnegative(),
  uniqueIps24h: z.number().int().nonnegative(),
  activeSessionCount: z.number().int().nonnegative(),
});

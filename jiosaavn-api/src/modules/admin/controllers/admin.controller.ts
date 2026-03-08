import { OpenAPIHono } from "@hono/zod-openapi";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { env } from "#common/config";
import type { Routes } from "#common/types";
import { AdminAuthService } from "#modules/admin/services";
import { FeatureFlagService } from "../services/feature-flag.service";
import { SystemSettingService } from "../services/system-setting.service";

type LoginAttemptState = {
  count: number;
  windowStartedAt: number;
  lockedUntil: number;
};

export class AdminController implements Routes {
  public controller: OpenAPIHono;
  private adminAuthService: AdminAuthService;
  private featureFlagService: FeatureFlagService;
  private systemSettingService: SystemSettingService;
  private readonly refreshCookieName = "vibey_admin_refresh";
  private readonly csrfCookieName = "vibey_admin_csrf";
  private readonly loginAttempts = new Map<string, LoginAttemptState>();
  private readonly loginWindowMs = 10 * 60 * 1000;
  private readonly loginMaxAttempts = 5;
  private readonly loginLockMs = 15 * 60 * 1000;

  constructor() {
    this.controller = new OpenAPIHono();
    this.adminAuthService = new AdminAuthService();
    this.featureFlagService = new FeatureFlagService();
    this.systemSettingService = new SystemSettingService();
  }

  private resolveRequestIp(ctx: { req: { header: (name: string) => string | undefined } }) {
    const forwardedFor = ctx.req.header("x-forwarded-for") || "";
    return forwardedFor.split(",")[0]?.trim() || ctx.req.header("x-real-ip") || "unknown";
  }

  private resolveUserAgent(ctx: { req: { header: (name: string) => string | undefined } }) {
    return ctx.req.header("user-agent") || "unknown";
  }

  private getRequestId(ctx: { res: { headers: { get: (name: string) => string | null } } }) {
    return ctx.res.headers.get("x-request-id") || "unknown";
  }

  private getBearerToken(authorizationHeader: string | undefined) {
    const bearerPrefix = "Bearer ";
    if (!authorizationHeader || !authorizationHeader.startsWith(bearerPrefix)) {
      return null;
    }

    return authorizationHeader.slice(bearerPrefix.length).trim();
  }

  private createCsrfToken() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }

    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }

  private setRefreshCookie(
    ctx: { req: { url: string }; res: { headers: { get: (name: string) => string | null } } },
    refreshToken: string,
    maxAgeSeconds: number,
  ) {
    const isProduction = process.env.NODE_ENV === "production";

    setCookie(ctx as never, this.refreshCookieName, refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "Strict",
      path: "/api/admin",
      maxAge: Math.max(1, Number(maxAgeSeconds) || 1),
    });
  }

  private clearRefreshCookie(ctx: { req: { url: string }; res: { headers: { get: (name: string) => string | null } } }) {
    deleteCookie(ctx as never, this.refreshCookieName, {
      path: "/api/admin",
    });
  }

  private setCsrfCookie(ctx: { req: { url: string }; res: { headers: { get: (name: string) => string | null } } }) {
    const isProduction = process.env.NODE_ENV === "production";
    const csrfToken = this.createCsrfToken();

    setCookie(ctx as never, this.csrfCookieName, csrfToken, {
      httpOnly: false,
      secure: isProduction,
      sameSite: "Strict",
      path: "/api/admin",
      maxAge: 60 * 60,
    });

    return csrfToken;
  }

  private getRefreshTokenFromCookie(ctx: { req: { url: string }; res: { headers: { get: (name: string) => string | null } } }) {
    return getCookie(ctx as never, this.refreshCookieName) || "";
  }

  private getAllowedIpSet() {
    const raw = (env.ADMIN_ALLOWED_IPS || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    return new Set(raw);
  }

  private getLoginAttemptKey(email: string, ip: string) {
    return `${String(email || "").trim().toLowerCase()}::${ip}`;
  }

  private getLoginAttemptState(key: string, now: number) {
    const existing = this.loginAttempts.get(key);

    if (!existing) {
      return {
        count: 0,
        windowStartedAt: now,
        lockedUntil: 0,
      };
    }

    if (now > existing.lockedUntil && now - existing.windowStartedAt > this.loginWindowMs) {
      return {
        count: 0,
        windowStartedAt: now,
        lockedUntil: 0,
      };
    }

    return existing;
  }

  private getLoginLockInfo(key: string) {
    const now = Date.now();
    const state = this.getLoginAttemptState(key, now);

    if (state.lockedUntil > now) {
      return {
        locked: true,
        retryAfterSeconds: Math.max(1, Math.ceil((state.lockedUntil - now) / 1000)),
      };
    }

    return {
      locked: false,
      retryAfterSeconds: 0,
    };
  }

  private registerFailedLogin(key: string) {
    const now = Date.now();
    const state = this.getLoginAttemptState(key, now);

    const withinWindow = now - state.windowStartedAt <= this.loginWindowMs;
    const nextCount = withinWindow ? state.count + 1 : 1;
    const nextWindowStartedAt = withinWindow ? state.windowStartedAt : now;

    const nextState: LoginAttemptState = {
      count: nextCount,
      windowStartedAt: nextWindowStartedAt,
      lockedUntil: nextCount >= this.loginMaxAttempts ? now + this.loginLockMs : 0,
    };

    this.loginAttempts.set(key, nextState);
  }

  private clearLoginAttempts(key: string) {
    this.loginAttempts.delete(key);
  }

  private getLoginAttemptStats() {
    const now = Date.now();
    let lockedCount = 0;

    for (const value of this.loginAttempts.values()) {
      if (value.lockedUntil > now) {
        lockedCount += 1;
      }
    }

    return {
      trackedKeys: this.loginAttempts.size,
      lockedKeys: lockedCount,
    };
  }

  private ensureCsrf(ctx: {
    req: { header: (name: string) => string | undefined; method: string; url: string };
    res: { headers: { get: (name: string) => string | null } };
    json: (body: unknown, status?: number) => Response;
  }) {
    const csrfHeader = String(ctx.req.header("x-csrf-token") || "").trim();
    const csrfCookie = String(getCookie(ctx as never, this.csrfCookieName) || "").trim();

    if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
      return ctx.json(
        {
          success: false,
          error: {
            code: "ADMIN_CSRF_INVALID",
            message: "Missing or invalid CSRF token",
            requestId: this.getRequestId(ctx),
          },
        },
        403,
      );
    }

    return null;
  }

  private async requireAdminAccess(ctx: {
    req: { header: (name: string) => string | undefined };
    res: { headers: { get: (name: string) => string | null } };
    json: (body: unknown, status?: number) => Response;
  }) {
    const verified = this.getAdminPrincipal(ctx);

    if (!verified) {
      return this.adminUnauthorized(ctx);
    }

    return null;
  }

  private getAdminPrincipal(ctx: {
    req: { header: (name: string) => string | undefined };
  }) {
    const token = this.getBearerToken(ctx.req.header("authorization"));
    return this.adminAuthService.verifyAccessToken(token || undefined);
  }

  private adminUnauthorized(ctx: {
    res: { headers: { get: (name: string) => string | null } };
    json: (body: unknown, status?: number) => Response;
  }) {
    return ctx.json(
      {
        success: false,
        error: {
          code: "ADMIN_UNAUTHORIZED",
          message: "Admin authorization required",
          requestId: this.getRequestId(ctx),
        },
      },
      401,
    );
  }

  private requireSuperAdmin(ctx: {
    req: { header: (name: string) => string | undefined };
    res: { headers: { get: (name: string) => string | null } };
    json: (body: unknown, status?: number) => Response;
  }) {
    const principal = this.getAdminPrincipal(ctx);
    if (!principal) {
      return {
        principal: null,
        response: this.adminUnauthorized(ctx),
      };
    }

    if (principal.role !== "superadmin") {
      return {
        principal,
        response: ctx.json(
          {
            success: false,
            error: {
              code: "ADMIN_FORBIDDEN",
              message: "Superadmin permission required",
              requestId: this.getRequestId(ctx),
            },
          },
          403,
        ),
      };
    }

    return {
      principal,
      response: null,
    };
  }

  public initRoutes() {
    this.controller.use("/admin/*", async (ctx, next) => {
      const allowedIps = this.getAllowedIpSet();
      if (allowedIps.size === 0) {
        await next();
        return;
      }

      const ip = this.resolveRequestIp(ctx);
      if (!allowedIps.has(ip)) {
        ctx.header("x-request-id", this.getRequestId(ctx));
        return ctx.json(
          {
            success: false,
            error: {
              code: "ADMIN_IP_NOT_ALLOWED",
              message: "Access denied from this IP address",
              requestId: this.getRequestId(ctx),
            },
          },
          403,
        );
      }

      await next();
    });

    this.controller.get("/admin/auth/csrf", async (ctx) => {
      const csrfToken = this.setCsrfCookie(ctx);
      return ctx.json({ success: true, data: { csrfToken } });
    });

    this.controller.get("/admin/auth/2fa/status", async (ctx) => {
      return ctx.json({
        success: true,
        data: {
          enabled: this.adminAuthService.isTwoFactorEnabled(),
        },
      });
    });

    this.controller.post("/admin/auth/login", async (ctx) => {
      const csrfError = this.ensureCsrf(ctx);
      if (csrfError) return csrfError;

      const payload = await ctx.req
        .json()
        .catch(() => ({} as { email?: unknown; password?: unknown; otp?: unknown }));
      const email = String((payload as { email?: unknown })?.email || "").trim();
      const password = String((payload as { password?: unknown })?.password || "");
      const otp = String((payload as { otp?: unknown })?.otp || "").trim();

      if (!email || !password) {
        return ctx.json(
          {
            success: false,
            error: {
              code: "ADMIN_INVALID_INPUT",
              message: "Email and password are required",
              requestId: this.getRequestId(ctx),
            },
          },
          400,
        );
      }

      const ip = this.resolveRequestIp(ctx);
      const userAgent = this.resolveUserAgent(ctx);
      const loginAttemptKey = this.getLoginAttemptKey(email, ip);
      const lockInfo = this.getLoginLockInfo(loginAttemptKey);

      if (lockInfo.locked) {
        ctx.header("Retry-After", String(lockInfo.retryAfterSeconds));
        return ctx.json(
          {
            success: false,
            error: {
              code: "ADMIN_LOGIN_LOCKED",
              message: `Too many failed login attempts. Retry in ${lockInfo.retryAfterSeconds}s.`,
              requestId: this.getRequestId(ctx),
            },
          },
          429,
        );
      }

      const tokens = await this.adminAuthService.login({
        email,
        password,
        otp,
        ip,
        userAgent,
      });

      if (!tokens.ok) {
        this.registerFailedLogin(loginAttemptKey);

        if (tokens.reason === "totp_required") {
          return ctx.json(
            {
              success: false,
              error: {
                code: "ADMIN_2FA_REQUIRED",
                message: "Two-factor code is required",
                requestId: this.getRequestId(ctx),
              },
            },
            401,
          );
        }

        if (tokens.reason === "totp_invalid") {
          return ctx.json(
            {
              success: false,
              error: {
                code: "ADMIN_INVALID_2FA_CODE",
                message: "Invalid two-factor code",
                requestId: this.getRequestId(ctx),
              },
            },
            401,
          );
        }

        return ctx.json(
          {
            success: false,
            error: {
              code: "ADMIN_INVALID_CREDENTIALS",
              message: "Invalid admin credentials",
              requestId: this.getRequestId(ctx),
            },
          },
          401,
        );
      }

      this.clearLoginAttempts(loginAttemptKey);
      this.setRefreshCookie(ctx, tokens.tokens.refreshToken, tokens.tokens.refreshTokenTtlSeconds);

      return ctx.json({
        success: true,
        data: {
          accessToken: tokens.tokens.accessToken,
          role: tokens.tokens.role,
          accessTokenTtlSeconds: tokens.tokens.accessTokenTtlSeconds,
        },
      });
    });

    this.controller.post("/admin/auth/refresh", async (ctx) => {
      const csrfError = this.ensureCsrf(ctx);
      if (csrfError) return csrfError;

      const refreshToken = this.getRefreshTokenFromCookie(ctx);

      if (!refreshToken) {
        return ctx.json(
          {
            success: false,
            error: {
              code: "ADMIN_INVALID_REFRESH_TOKEN",
              message: "Refresh token is missing",
              requestId: this.getRequestId(ctx),
            },
          },
          401,
        );
      }

      const ip = this.resolveRequestIp(ctx);
      const userAgent = this.resolveUserAgent(ctx);

      const tokens = await this.adminAuthService.refresh(refreshToken, ip, userAgent);

      if (!tokens) {
        this.clearRefreshCookie(ctx);
        return ctx.json(
          {
            success: false,
            error: {
              code: "ADMIN_INVALID_REFRESH_TOKEN",
              message: "Refresh token is invalid or expired",
              requestId: this.getRequestId(ctx),
            },
          },
          401,
        );
      }

      this.setRefreshCookie(ctx, tokens.refreshToken, tokens.refreshTokenTtlSeconds);

      return ctx.json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
          accessTokenTtlSeconds: tokens.accessTokenTtlSeconds,
        },
      });
    });

    this.controller.post("/admin/auth/logout", async (ctx) => {
      const csrfError = this.ensureCsrf(ctx);
      if (csrfError) return csrfError;

      const refreshToken = this.getRefreshTokenFromCookie(ctx);
      const ip = this.resolveRequestIp(ctx);
      const userAgent = this.resolveUserAgent(ctx);

      if (refreshToken) {
        await this.adminAuthService.logout(refreshToken, ip, userAgent);
      }

      this.clearRefreshCookie(ctx);
      return ctx.json({ success: true });
    });

    this.controller.get("/admin/health", async (ctx) => {
      const unauthorized = await this.requireAdminAccess(ctx);
      if (unauthorized) return unauthorized;

      const principal = this.getAdminPrincipal(ctx);

      const metrics = await this.adminAuthService.getSessionMetrics();

      return ctx.json({
        success: true,
        data: {
          status: "ok",
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || "development",
          principal,
          activeSessionCount: metrics.activeSessionCount,
        },
      });
    });

    this.controller.get("/admin/audit/logs", async (ctx) => {
      const unauthorized = await this.requireAdminAccess(ctx);
      if (unauthorized) return unauthorized;

      const limitRaw = ctx.req.query("limit");
      const limit = Number.parseInt(String(limitRaw || "50"), 10);
      const logs = await this.adminAuthService.getRecentAuditLogs(limit);

      return ctx.json({ success: true, data: logs });
    });

    this.controller.get("/admin/security/status", async (ctx) => {
      const unauthorized = await this.requireAdminAccess(ctx);
      if (unauthorized) return unauthorized;

      const allowedIps = this.getAllowedIpSet();
      const loginAttemptStats = this.getLoginAttemptStats();

      return ctx.json({
        success: true,
        data: {
          requestIp: this.resolveRequestIp(ctx),
          csrfProtectionEnabled: true,
          ipAllowlistEnabled: allowedIps.size > 0,
          allowedIpCount: allowedIps.size,
          loginProtection: {
            windowMs: this.loginWindowMs,
            maxAttempts: this.loginMaxAttempts,
            lockMs: this.loginLockMs,
            trackedKeys: loginAttemptStats.trackedKeys,
            lockedKeys: loginAttemptStats.lockedKeys,
          },
        },
      });
    });

    this.controller.get("/admin/usage/summary", async (ctx) => {
      const unauthorized = await this.requireAdminAccess(ctx);
      if (unauthorized) return unauthorized;

      const summary = await this.adminAuthService.getUsageSummary();
      return ctx.json({ success: true, data: summary });
    });

    // Feature Flag Routes
    this.controller.get("/admin/feature-flags", async (ctx) => {
      const unauthorized = await this.requireAdminAccess(ctx);
      if (unauthorized) return unauthorized;

      const flags = await this.featureFlagService.getAllFlags();
      return ctx.json({ success: true, data: flags });
    });

    this.controller.get("/admin/feature-flags/:key", async (ctx) => {
      const unauthorized = await this.requireAdminAccess(ctx);
      if (unauthorized) return unauthorized;

      const key = ctx.req.param("key");
      const flag = await this.featureFlagService.getFlagByKey(key);

      if (!flag) {
        return ctx.json(
          {
            success: false,
            error: {
              code: "FEATURE_FLAG_NOT_FOUND",
              message: `Feature flag '${key}' not found`,
              requestId: this.getRequestId(ctx),
            },
          },
          404,
        );
      }

      return ctx.json({ success: true, data: flag });
    });

    this.controller.post("/admin/feature-flags", async (ctx) => {
      const unauthorized = await this.requireAdminAccess(ctx);
      if (unauthorized) return unauthorized;

      const csrfError = this.ensureCsrf(ctx);
      if (csrfError) return csrfError;

      const payload = await ctx.req.json().catch(() => ({}));
      const { key, enabled, description } = payload;

      if (!key || typeof enabled !== "boolean") {
        return ctx.json(
          {
            success: false,
            error: {
              code: "INVALID_INPUT",
              message: "Key and enabled (boolean) are required",
              requestId: this.getRequestId(ctx),
            },
          },
          400,
        );
      }

      const existing = await this.featureFlagService.getFlagByKey(key);
      if (existing) {
        return ctx.json(
          {
            success: false,
            error: {
              code: "FEATURE_FLAG_EXISTS",
              message: `Feature flag '${key}' already exists`,
              requestId: this.getRequestId(ctx),
            },
          },
          409,
        );
      }

      const flag = await this.featureFlagService.createFlag({
        key,
        enabled,
        description,
      });

      const ip = this.resolveRequestIp(ctx);
      const userAgent = this.resolveUserAgent(ctx);
      await this.adminAuthService.writeAuditLog({
        action: "feature_flag_create",
        email: env.ADMIN_EMAIL || "admin",
        createdAt: new Date(),
        ip,
        userAgent,
        metadata: { key, enabled },
      });

      return ctx.json({ success: true, data: flag }, 201);
    });

    this.controller.patch("/admin/feature-flags/:key", async (ctx) => {
      const unauthorized = await this.requireAdminAccess(ctx);
      if (unauthorized) return unauthorized;

      const csrfError = this.ensureCsrf(ctx);
      if (csrfError) return csrfError;

      const key = ctx.req.param("key");
      const payload = await ctx.req.json().catch(() => ({}));
      const { enabled, description } = payload;

      if (enabled === undefined && description === undefined) {
        return ctx.json(
          {
            success: false,
            error: {
              code: "INVALID_INPUT",
              message: "At least one field (enabled, description) is required",
              requestId: this.getRequestId(ctx),
            },
          },
          400,
        );
      }

      const flag = await this.featureFlagService.updateFlag(key, {
        enabled,
        description,
      });

      if (!flag) {
        return ctx.json(
          {
            success: false,
            error: {
              code: "FEATURE_FLAG_NOT_FOUND",
              message: `Feature flag '${key}' not found`,
              requestId: this.getRequestId(ctx),
            },
          },
          404,
        );
      }

      const ip = this.resolveRequestIp(ctx);
      const userAgent = this.resolveUserAgent(ctx);
      await this.adminAuthService.writeAuditLog({
        action: "feature_flag_update",
        email: env.ADMIN_EMAIL || "admin",
        createdAt: new Date(),
        ip,
        userAgent,
        metadata: { key, enabled, description },
      });

      return ctx.json({ success: true, data: flag });
    });

    this.controller.delete("/admin/feature-flags/:key", async (ctx) => {
      const unauthorized = await this.requireAdminAccess(ctx);
      if (unauthorized) return unauthorized;

      const csrfError = this.ensureCsrf(ctx);
      if (csrfError) return csrfError;

      const key = ctx.req.param("key");
      const deleted = await this.featureFlagService.deleteFlag(key);

      if (!deleted) {
        return ctx.json(
          {
            success: false,
            error: {
              code: "FEATURE_FLAG_NOT_FOUND",
              message: `Feature flag '${key}' not found`,
              requestId: this.getRequestId(ctx),
            },
          },
          404,
        );
      }

      const ip = this.resolveRequestIp(ctx);
      const userAgent = this.resolveUserAgent(ctx);
      await this.adminAuthService.writeAuditLog({
        action: "feature_flag_delete",
        email: env.ADMIN_EMAIL || "admin",
        createdAt: new Date(),
        ip,
        userAgent,
        metadata: { key },
      });

      return ctx.json({ success: true });
    });

    // System Settings Routes
    this.controller.get("/admin/system/settings", async (ctx) => {
      const unauthorized = await this.requireAdminAccess(ctx);
      if (unauthorized) return unauthorized;

      const settings = await this.systemSettingService.listSettings();
      return ctx.json({ success: true, data: settings });
    });

    this.controller.put("/admin/system/settings/:key", async (ctx) => {
      const unauthorized = await this.requireAdminAccess(ctx);
      if (unauthorized) return unauthorized;

      const csrfError = this.ensureCsrf(ctx);
      if (csrfError) return csrfError;

      const key = ctx.req.param("key");
      const payload = await ctx.req.json().catch(() => ({} as { value?: unknown; description?: unknown }));

      if (!key || !("value" in payload)) {
        return ctx.json(
          {
            success: false,
            error: {
              code: "INVALID_INPUT",
              message: "Setting key and value are required",
              requestId: this.getRequestId(ctx),
            },
          },
          400,
        );
      }

      const value = (payload as { value: unknown }).value;
      const normalizedValue =
        typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null
          ? value
          : String(value);

      const setting = await this.systemSettingService.upsertSetting({
        key,
        value: normalizedValue,
        description: typeof payload.description === "string" ? payload.description : undefined,
        updatedBy: env.ADMIN_EMAIL || "admin",
      });

      await this.adminAuthService.writeAuditLog({
        action: "system_setting_upsert",
        email: env.ADMIN_EMAIL || "admin",
        createdAt: new Date(),
        ip: this.resolveRequestIp(ctx),
        userAgent: this.resolveUserAgent(ctx),
        metadata: { key, value: normalizedValue },
      });

      return ctx.json({ success: true, data: setting });
    });

    this.controller.delete("/admin/system/settings/:key", async (ctx) => {
      const unauthorized = await this.requireAdminAccess(ctx);
      if (unauthorized) return unauthorized;

      const csrfError = this.ensureCsrf(ctx);
      if (csrfError) return csrfError;

      const key = ctx.req.param("key");
      const deleted = await this.systemSettingService.deleteSetting(key);

      if (!deleted) {
        return ctx.json(
          {
            success: false,
            error: {
              code: "SYSTEM_SETTING_NOT_FOUND",
              message: `System setting '${key}' not found`,
              requestId: this.getRequestId(ctx),
            },
          },
          404,
        );
      }

      await this.adminAuthService.writeAuditLog({
        action: "system_setting_delete",
        email: env.ADMIN_EMAIL || "admin",
        createdAt: new Date(),
        ip: this.resolveRequestIp(ctx),
        userAgent: this.resolveUserAgent(ctx),
        metadata: { key },
      });

      return ctx.json({ success: true });
    });

    // Session Management Routes
    this.controller.get("/admin/sessions", async (ctx) => {
      const unauthorized = await this.requireAdminAccess(ctx);
      if (unauthorized) return unauthorized;

      const sessions = await this.adminAuthService.listSessions();
      return ctx.json({ success: true, data: sessions });
    });

    this.controller.delete("/admin/sessions/:tokenHash", async (ctx) => {
      const unauthorized = await this.requireAdminAccess(ctx);
      if (unauthorized) return unauthorized;

      const csrfError = this.ensureCsrf(ctx);
      if (csrfError) return csrfError;

      const tokenHash = ctx.req.param("tokenHash");
      const revoked = await this.adminAuthService.revokeSessionByTokenHash(tokenHash);

      if (!revoked) {
        return ctx.json(
          {
            success: false,
            error: {
              code: "ADMIN_SESSION_NOT_FOUND",
              message: "Session not found or already revoked",
              requestId: this.getRequestId(ctx),
            },
          },
          404,
        );
      }

      await this.adminAuthService.writeAuditLog({
        action: "admin.session.revoke",
        email: this.getAdminPrincipal(ctx)?.email || "unknown",
        createdAt: new Date(),
        ip: this.resolveRequestIp(ctx),
        userAgent: this.resolveUserAgent(ctx),
        metadata: { tokenHash },
      });

      return ctx.json({ success: true });
    });

    // User Management Routes (superadmin)
    this.controller.get("/admin/users", async (ctx) => {
      const permission = this.requireSuperAdmin(ctx);
      if (permission.response) return permission.response;

      const users = await this.adminAuthService.listAdminUsers();
      return ctx.json({ success: true, data: users });
    });

    this.controller.post("/admin/users", async (ctx) => {
      const permission = this.requireSuperAdmin(ctx);
      if (permission.response) return permission.response;

      const csrfError = this.ensureCsrf(ctx);
      if (csrfError) return csrfError;

      const payload = await ctx.req.json().catch(() => ({} as { email?: unknown; password?: unknown; role?: unknown; isActive?: unknown }));
      const email = String(payload.email || "").trim().toLowerCase();
      const password = String(payload.password || "");
      const role = payload.role === "superadmin" ? "superadmin" : "admin";
      const isActive = typeof payload.isActive === "boolean" ? payload.isActive : true;

      if (!email || !password) {
        return ctx.json(
          {
            success: false,
            error: {
              code: "INVALID_INPUT",
              message: "email and password are required",
              requestId: this.getRequestId(ctx),
            },
          },
          400,
        );
      }

      const created = await this.adminAuthService.createAdminUser({
        email,
        password,
        role,
        isActive,
      });

      if (!created) {
        return ctx.json(
          {
            success: false,
            error: {
              code: "ADMIN_USER_EXISTS",
              message: "Admin user already exists",
              requestId: this.getRequestId(ctx),
            },
          },
          409,
        );
      }

      await this.adminAuthService.writeAuditLog({
        action: "admin.user.create",
        email: permission.principal?.email || "unknown",
        createdAt: new Date(),
        ip: this.resolveRequestIp(ctx),
        userAgent: this.resolveUserAgent(ctx),
        metadata: { targetEmail: email, role, isActive },
      });

      return ctx.json({ success: true, data: created }, 201);
    });

    this.controller.patch("/admin/users/:email", async (ctx) => {
      const permission = this.requireSuperAdmin(ctx);
      if (permission.response) return permission.response;

      const csrfError = this.ensureCsrf(ctx);
      if (csrfError) return csrfError;

      const targetEmail = String(ctx.req.param("email") || "").trim().toLowerCase();
      const payload = await ctx.req.json().catch(() => ({} as { password?: unknown; role?: unknown; isActive?: unknown }));
      const patch: { password?: string; role?: "superadmin" | "admin"; isActive?: boolean } = {};

      if (typeof payload.password === "string" && payload.password) {
        patch.password = payload.password;
      }
      if (payload.role === "superadmin" || payload.role === "admin") {
        patch.role = payload.role;
      }
      if (typeof payload.isActive === "boolean") {
        patch.isActive = payload.isActive;
      }

      if (!targetEmail || Object.keys(patch).length === 0) {
        return ctx.json(
          {
            success: false,
            error: {
              code: "INVALID_INPUT",
              message: "email and at least one patch field are required",
              requestId: this.getRequestId(ctx),
            },
          },
          400,
        );
      }

      const updated = await this.adminAuthService.updateAdminUser(targetEmail, patch);
      if (!updated) {
        return ctx.json(
          {
            success: false,
            error: {
              code: "ADMIN_USER_NOT_FOUND",
              message: "Admin user not found",
              requestId: this.getRequestId(ctx),
            },
          },
          404,
        );
      }

      await this.adminAuthService.writeAuditLog({
        action: "admin.user.update",
        email: permission.principal?.email || "unknown",
        createdAt: new Date(),
        ip: this.resolveRequestIp(ctx),
        userAgent: this.resolveUserAgent(ctx),
        metadata: { targetEmail, patch },
      });

      return ctx.json({ success: true, data: updated });
    });

    this.controller.delete("/admin/users/:email", async (ctx) => {
      const permission = this.requireSuperAdmin(ctx);
      if (permission.response) return permission.response;

      const csrfError = this.ensureCsrf(ctx);
      if (csrfError) return csrfError;

      const targetEmail = String(ctx.req.param("email") || "").trim().toLowerCase();
      const result = await this.adminAuthService.deleteAdminUser(targetEmail);

      if (!result.ok) {
        const code = result.reason === "bootstrap_protected" ? "ADMIN_USER_PROTECTED" : "ADMIN_USER_NOT_FOUND";
        const status = result.reason === "bootstrap_protected" ? 403 : 404;
        const message = result.reason === "bootstrap_protected"
          ? "Bootstrap superadmin cannot be deleted"
          : "Admin user not found";

        return ctx.json(
          {
            success: false,
            error: {
              code,
              message,
              requestId: this.getRequestId(ctx),
            },
          },
          status,
        );
      }

      await this.adminAuthService.writeAuditLog({
        action: "admin.user.delete",
        email: permission.principal?.email || "unknown",
        createdAt: new Date(),
        ip: this.resolveRequestIp(ctx),
        userAgent: this.resolveUserAgent(ctx),
        metadata: { targetEmail },
      });

      return ctx.json({ success: true });
    });
  }
}

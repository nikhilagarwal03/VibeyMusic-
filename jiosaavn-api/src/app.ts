import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { Home } from "./pages/home";
import type { Routes } from "#common/types";
import type { HTTPException } from "hono/http-exception";
import type { Context, Next } from "hono";
import { AppError, ErrorCode } from "#common/errors";
import { CacheHelper, RateLimitHelper } from "#common/helpers";

export class App {
  private app: OpenAPIHono;
  private isProduction = process.env.NODE_ENV === "production";
  private rateLimitHelper = new RateLimitHelper();
  private cacheHelper = new CacheHelper();

  constructor(routes: Routes[]) {
    this.app = new OpenAPIHono();

    this.initializeGlobalMiddlewares();
    this.initializeSecurityMiddlewares();
    this.initializeCachingMiddlewares();
    this.initializeRoutes(routes);
    this.initializeSwaggerUI();
    this.initializeRouteFallback();
    this.initializeErrorHandler();
  }

  private createRequestId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }

    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private getRequestId(ctx: Context) {
    return (
      ctx.res.headers.get("x-request-id") ||
      ctx.req.header("x-request-id") ||
      "unknown"
    );
  }

  private createErrorResponse(ctx: Context, code: string, message: string, metadata?: Record<string, unknown>) {
    return {
      success: false,
      error: {
        code,
        message,
        requestId: this.getRequestId(ctx),
        ...(metadata && { metadata }),
      },
    };
  }

  private initializeRoutes(routes: Routes[]) {
    routes.forEach((route) => {
      route.initRoutes();
      this.app.route("/api", route.controller);
    });

    this.app.route("/", Home);
  }

  private initializeGlobalMiddlewares() {
    this.app.use("*", async (ctx, next) => {
      ctx.header("x-request-id", this.createRequestId());
      await next();
    });

    this.app.use("*", async (ctx, next) => {
      const startedAt = Date.now();
      await next();

      const requestId = this.getRequestId(ctx);
      const latencyMs = Date.now() - startedAt;
      const forwardedFor = ctx.req.header("x-forwarded-for") || "";
      const ip = forwardedFor.split(",")[0]?.trim() || ctx.req.header("x-real-ip") || "unknown";
      const userAgent = ctx.req.header("user-agent") || "unknown";
      const userId = ctx.req.header("x-admin-email") || "anonymous";

      // Structured JSON logs for easy ingestion in log processors and dashboards.
      console.info(
        JSON.stringify({
          event: "http_request",
          requestId,
          method: ctx.req.method,
          route: ctx.req.path,
          status: ctx.res.status,
          latencyMs,
          ip,
          userAgent,
          userId,
          timestamp: new Date().toISOString(),
        }),
      );
    });

    if (!this.isProduction) {
      this.app.use(logger());
      this.app.use(prettyJSON());
    }

    const allowedOrigins = (process.env.CORS_ORIGINS || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);

    if (this.isProduction && allowedOrigins.length > 0) {
      this.app.use(
        cors({
          origin: allowedOrigins,
          credentials: true,
        }),
      );
      return;
    }

    this.app.use(
      cors({
        origin: (origin) => origin || "*",
        credentials: true,
      }),
    );
  }

  private initializeSecurityMiddlewares() {
    const rateLimitMiddleware = async (ctx: Context, next: Next) => {
      const forwardedFor = ctx.req.header("x-forwarded-for") || "";
      const ip = forwardedFor.split(",")[0]?.trim() || ctx.req.header("x-real-ip") || "unknown";
      const path = ctx.req.path;
      const key = `${ip}:${path}`;

      const result = await this.rateLimitHelper.evaluate(key);
      ctx.header("X-RateLimit-Limit", String(result.limit));
      ctx.header("X-RateLimit-Remaining", String(result.remaining));

      if (!result.allowed) {
        ctx.header("Retry-After", String(result.retryAfterSeconds));
        return ctx.json(
          this.createErrorResponse(
            ctx,
            ErrorCode.RATE_LIMIT_EXCEEDED,
            "Too many requests. Please try again in a moment.",
            { retryAfter: result.retryAfterSeconds },
          ),
          429,
        );
      }

      await next();
    };

    this.app.use("/api/search", rateLimitMiddleware);
    this.app.use("/api/search/*", rateLimitMiddleware);
  }

  private initializeCachingMiddlewares() {
    this.app.use("/api/*", async (ctx, next) => {
      if (ctx.req.method !== "GET") {
        await next();
        return;
      }

      if (ctx.req.path.startsWith("/api/admin")) {
        await next();
        return;
      }

      const requestUrl = new URL(ctx.req.url);
      const cacheTtlMs = this.cacheHelper.getCacheTtlMs(ctx.req.path);
      const cacheKey = `${requestUrl.pathname}${requestUrl.search}`;

      if (cacheTtlMs > 0) {
        const cached = await this.cacheHelper.get(cacheKey);
        if (cached) {
          return new Response(cached.body, {
            status: cached.status,
            headers: {
              "content-type": cached.contentType || "application/json",
              "x-cache": "HIT",
              "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
            },
          });
        }
      }

      await next();

      if (ctx.res.status !== 200) {
        return;
      }

      const path = ctx.req.path;

      if (path.startsWith("/api/search")) {
        ctx.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
      } else if (
        path.startsWith("/api/songs") ||
        path.startsWith("/api/albums") ||
        path.startsWith("/api/artists") ||
        path.startsWith("/api/playlists")
      ) {
        ctx.header("Cache-Control", "public, s-maxage=300, stale-while-revalidate=1800");
      }

      if (cacheTtlMs <= 0) {
        return;
      }

      const contentType = ctx.res.headers.get("content-type") || "application/json";
      const body = await ctx.res.clone().text();

      await this.cacheHelper.set(cacheKey, {
        body,
        status: ctx.res.status,
        contentType,
        cachedAt: Date.now(),
        ttlMs: cacheTtlMs,
      });

      ctx.header("x-cache", "MISS");
    });
  }

  private initializeSwaggerUI() {
    this.app.doc31("/swagger", (c) => {
      const { protocol: urlProtocol, hostname, port } = new URL(c.req.url);
      const protocol = c.req.header("x-forwarded-proto")
        ? `${c.req.header("x-forwarded-proto")}:`
        : urlProtocol;

      return {
        openapi: "3.1.0",

        info: {
          version: "1.0.0",
          title: "JioSaavn API",
          description: `# Introduction 
        \nJioSaavn API, accessible at [saavn.dev](https://saavn.dev), is an unofficial API that allows users to download high-quality songs from [JioSaavn](https://jiosaavn.com). 
        It offers a fast, reliable, and easy-to-use API for developers. \n`,
        },
        servers: [
          {
            url: `${protocol}//${hostname}${port ? `:${port}` : ""}`,
            description: "Current environment",
          },
        ],
      };
    });

    this.app.get(
      "/docs",
      apiReference({
        pageTitle: "JioSaavn API Documentation",
        theme: "deepSpace",
        isEditable: false,
        layout: "modern",
        darkMode: true,
        metaData: {
          applicationName: "JioSaavn API",
          author: "Sumit Kolhe",
          creator: "Sumit Kolhe",
          publisher: "Sumit Kolhe",
          robots: "index, follow",
          description:
            "JioSaavn API is an unofficial wrapper written in TypeScript for jiosaavn.com providing programmatic access to a vast library of songs, albums, artists, playlists, and more.",
        },
        url: "/swagger",
      }),
    );
  }

  private initializeRouteFallback() {
    this.app.notFound((ctx) => {
      return ctx.json(
        this.createErrorResponse(
          ctx,
          "ROUTE_NOT_FOUND",
          "route not found, check docs at https://saavn.dev/docs",
        ),
        404,
      );
    });
  }

  private initializeErrorHandler() {
    this.app.onError((err, ctx) => {
      // Handle custom AppError instances
      if (err instanceof AppError) {
        return ctx.json(
          this.createErrorResponse(ctx, err.code, err.message, err.metadata),
          err.statusCode as any,
        );
      }

      // Handle HTTPException from Hono
      const error = err as HTTPException;
      const status = error.status || 500;
      const code = status >= 500 ? ErrorCode.INTERNAL_SERVER_ERROR : ErrorCode.BAD_REQUEST;
      const message =
        status >= 500 && this.isProduction
          ? "Unexpected server error"
          : error.message;

      // Log unexpected errors in production
      if (status >= 500 && this.isProduction) {
        console.error("[ERROR]", {
          requestId: this.getRequestId(ctx),
          error: err,
          stack: err.stack,
        });
      }

      return ctx.json(
        this.createErrorResponse(ctx, code, message),
        status,
      );
    });
  }

  public getApp() {
    return this.app;
  }
}

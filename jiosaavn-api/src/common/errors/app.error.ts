export enum ErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  
  // Server errors (5xx)
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  UPSTREAM_ERROR = "UPSTREAM_ERROR",
  UPSTREAM_TIMEOUT = "UPSTREAM_TIMEOUT",
  DATABASE_ERROR = "DATABASE_ERROR",
  
  // Admin/Auth specific errors
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  TOKEN_INVALID = "TOKEN_INVALID",
  SESSION_NOT_FOUND = "SESSION_NOT_FOUND",
  CSRF_TOKEN_INVALID = "CSRF_TOKEN_INVALID",
  IP_NOT_ALLOWED = "IP_NOT_ALLOWED",
  TOO_MANY_LOGIN_ATTEMPTS = "TOO_MANY_LOGIN_ATTEMPTS",
}

export interface ErrorMetadata {
  [key: string]: unknown;
}

/**
 * Base application error class with structured error codes and metadata
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly metadata?: ErrorMetadata;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number,
    metadata?: ErrorMetadata,
    isOperational = true
  ) {
    super(message);
    
    this.code = code;
    this.statusCode = statusCode;
    this.metadata = metadata;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    this.name = this.constructor.name;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      ...(this.metadata && { metadata: this.metadata }),
    };
  }
}

/**
 * Client error (4xx)
 */
export class ClientError extends AppError {
  constructor(code: ErrorCode, message: string, metadata?: ErrorMetadata) {
    const statusCodeMap: Record<string, number> = {
      [ErrorCode.BAD_REQUEST]: 400,
      [ErrorCode.UNAUTHORIZED]: 401,
      [ErrorCode.FORBIDDEN]: 403,
      [ErrorCode.NOT_FOUND]: 404,
      [ErrorCode.VALIDATION_ERROR]: 422,
      [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
      [ErrorCode.INVALID_CREDENTIALS]: 401,
      [ErrorCode.TOKEN_EXPIRED]: 401,
      [ErrorCode.TOKEN_INVALID]: 401,
      [ErrorCode.CSRF_TOKEN_INVALID]: 403,
      [ErrorCode.IP_NOT_ALLOWED]: 403,
      [ErrorCode.TOO_MANY_LOGIN_ATTEMPTS]: 429,
    };

    const statusCode = statusCodeMap[code] || 400;
    super(code, message, statusCode, metadata, true);
  }
}

/**
 * Server error (5xx)
 */
export class ServerError extends AppError {
  constructor(code: ErrorCode, message: string, metadata?: ErrorMetadata) {
    const statusCodeMap: Record<string, number> = {
      [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
      [ErrorCode.SERVICE_UNAVAILABLE]: 503,
      [ErrorCode.UPSTREAM_ERROR]: 502,
      [ErrorCode.UPSTREAM_TIMEOUT]: 504,
      [ErrorCode.DATABASE_ERROR]: 500,
    };

    const statusCode = statusCodeMap[code] || 500;
    super(code, message, statusCode, metadata, true);
  }
}

/**
 * Validation error with field-level details
 */
export class ValidationError extends ClientError {
  constructor(message: string, fields?: Record<string, string[]>) {
    super(ErrorCode.VALIDATION_ERROR, message, { fields });
  }
}

/**
 * Not found error
 */
export class NotFoundError extends ClientError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(ErrorCode.NOT_FOUND, message, { resource, identifier });
  }
}

/**
 * Unauthorized error
 */
export class UnauthorizedError extends ClientError {
  constructor(message = "Authentication required") {
    super(ErrorCode.UNAUTHORIZED, message);
  }
}

/**
 * Forbidden error
 */
export class ForbiddenError extends ClientError {
  constructor(message = "Access forbidden") {
    super(ErrorCode.FORBIDDEN, message);
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends ClientError {
  constructor(retryAfter?: number) {
    super(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      "Too many requests. Please try again later.",
      { retryAfter }
    );
  }
}

/**
 * Upstream service error
 */
export class UpstreamError extends ServerError {
  constructor(message: string, upstreamService?: string) {
    super(ErrorCode.UPSTREAM_ERROR, message, { upstreamService });
  }
}

/**
 * Upstream timeout error
 */
export class UpstreamTimeoutError extends ServerError {
  constructor(upstreamService?: string) {
    super(
      ErrorCode.UPSTREAM_TIMEOUT,
      "Upstream service request timed out",
      { upstreamService }
    );
  }
}

/**
 * Database error
 */
export class DatabaseError extends ServerError {
  constructor(message: string, operation?: string) {
    super(ErrorCode.DATABASE_ERROR, message, { operation });
  }
}

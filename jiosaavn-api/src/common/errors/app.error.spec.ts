import {
  AppError,
  ClientError,
  DatabaseError,
  ErrorCode,
  NotFoundError,
  RateLimitError,
  ServerError,
  UnauthorizedError,
  ValidationError,
} from './app.error';
import { describe, expect, it } from 'vitest';

describe('AppError', () => {
  it('creates base error with code, status, and metadata', () => {
    const error = new AppError(
      ErrorCode.BAD_REQUEST,
      'Invalid payload',
      400,
      { field: 'email' }
    );

    expect(error.code).toBe(ErrorCode.BAD_REQUEST);
    expect(error.statusCode).toBe(400);
    expect(error.metadata).toEqual({ field: 'email' });
    expect(error.isOperational).toBe(true);
  });

  it('serializes to JSON shape used by error envelopes', () => {
    const error = new AppError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'Unexpected',
      500,
      { trace: 'abc' }
    );

    expect(error.toJSON()).toEqual({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Unexpected',
      metadata: { trace: 'abc' },
    });
  });
});

describe('Client and server error mappings', () => {
  it('maps client error codes to expected HTTP status codes', () => {
    expect(new ClientError(ErrorCode.UNAUTHORIZED, 'nope').statusCode).toBe(401);
    expect(new ValidationError('Bad fields').statusCode).toBe(422);
    expect(new RateLimitError(12).statusCode).toBe(429);
    expect(new UnauthorizedError().statusCode).toBe(401);
  });

  it('maps server error codes to expected HTTP status codes', () => {
    expect(new ServerError(ErrorCode.SERVICE_UNAVAILABLE, 'down').statusCode).toBe(503);
    expect(new DatabaseError('db failed').statusCode).toBe(500);
  });

  it('generates readable not-found messages', () => {
    const withoutId = new NotFoundError('FeatureFlag');
    const withId = new NotFoundError('FeatureFlag', 'new_homepage');

    expect(withoutId.message).toBe('FeatureFlag not found');
    expect(withId.message).toBe("FeatureFlag with identifier 'new_homepage' not found");
  });
});

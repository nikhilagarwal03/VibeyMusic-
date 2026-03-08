import { z } from 'zod';

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  requestId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const SuccessEnvelopeSchema = (dataSchema) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

export const ErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  error: ApiErrorSchema,
});

export const ApiEnvelopeSchema = (dataSchema) =>
  z.union([SuccessEnvelopeSchema(dataSchema), ErrorEnvelopeSchema]);

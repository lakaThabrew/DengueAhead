import { z } from 'zod';
import { AreaSchema } from './area.schema.js';
import { PredictionSchema } from './prediction.schema.js';

export const ServiceHealthStatusSchema = z.enum(['ok', 'degraded', 'error']);
export type ServiceHealthStatus = z.infer<typeof ServiceHealthStatusSchema>;

export const HealthResponseSchema = z.object({
  status: ServiceHealthStatusSchema,
  apiVersion: z.string().min(1),
  service: z.literal('dengueahead-api'),
  timestamp: z.string().datetime()
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const ReadinessComponentSchema = z.object({
  status: z.enum(['up', 'down']),
  latencyMs: z.number().nonnegative().nullable()
});

export const ReadinessResponseSchema = z.object({
  status: z.enum(['ok', 'error']),
  timestamp: z.string().datetime(),
  components: z.object({
    database: ReadinessComponentSchema
  })
});
export type ReadinessResponse = z.infer<typeof ReadinessResponseSchema>;

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    requestId: z.string().optional(),
    details: z.any().optional()
  })
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

export const MetaResponseSchema = z.object({
  geographicLevel: z.enum(['district', 'moh']),
  latestIssueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  latestTargetWeek: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  activeModelVersion: z.string().nullable(),
  lastUpdated: z.string().datetime().nullable(),
  sourceFreshnessStatus: z.enum(['CURRENT', 'STALE', 'UNAVAILABLE'])
});
export type MetaResponse = z.infer<typeof MetaResponseSchema>;

export const OverviewSummarySchema = z.object({
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  targetWeek: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  monitoredAreasCount: z.number().int().nonnegative(),
  emergingHotspotsCount: z.number().int().nonnegative(),
  persistentHotspotsCount: z.number().int().nonnegative(),
  stableAreasCount: z.number().int().nonnegative(),
  coolingAreasCount: z.number().int().nonnegative(),
  withheldCount: z.number().int().nonnegative(),
  topEmergingAreas: z.array(
    z.object({
      area: AreaSchema,
      prediction: PredictionSchema
    })
  )
});
export type OverviewSummary = z.infer<typeof OverviewSummarySchema>;

import { z } from 'zod';
import { AreaSchema } from './area.schema.js';
import { PredictionSchema } from './prediction.schema.js';
import { EvaluationMetricsSchema } from './evaluation.schema.js';

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

// ── Area Series (historical observed cases for a district) ───────────────────

export const WeeklyObservationPointSchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weekEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cases: z.number().int().nonnegative().nullable(),
  reportedAt: z.string().datetime().nullable().optional(),
  qualityFlags: z.array(z.string()).default([])
});
export type WeeklyObservationPoint = z.infer<typeof WeeklyObservationPointSchema>;

export const AreaSeriesResponseSchema = z.object({
  areaId: z.string().min(1),
  data: z.array(WeeklyObservationPointSchema),
  count: z.number().int().nonnegative()
});
export type AreaSeriesResponse = z.infer<typeof AreaSeriesResponseSchema>;

// ── Feature Driver ───────────────────────────────────────────────────────────

export const FeatureDriverSchema = z.object({
  feature: z.string().min(1),
  impact: z.number(),
  direction: z.enum(['positive', 'negative', 'neutral'])
});
export type FeatureDriver = z.infer<typeof FeatureDriverSchema>;

// ── Area Forecast ────────────────────────────────────────────────────────────

export const AreaForecastResponseSchema = z.object({
  areaId: z.string().min(1),
  areaName: z.string().min(1),
  prediction: PredictionSchema,
  historicalBaseline: z
    .object({
      seasonalMedian: z.number().nonnegative().nullable(),
      hotspotThreshold: z.number().nonnegative().nullable()
    })
    .nullable()
    .optional(),
  featureDrivers: z.array(FeatureDriverSchema).optional(),
  nonCausalDisclaimer: z.string().min(1)
});
export type AreaForecastResponse = z.infer<typeof AreaForecastResponseSchema>;

// ── Compare ──────────────────────────────────────────────────────────────────

export const CompareItemSchema = z.object({
  area: AreaSchema,
  prediction: PredictionSchema,
  recentTrend: z.array(
    z.object({
      weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      cases: z.number().int().nonnegative().nullable()
    })
  )
});

export const CompareResponseSchema = z.object({
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  targetWeek: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  comparisons: z.array(CompareItemSchema)
});
export type CompareResponse = z.infer<typeof CompareResponseSchema>;

// ── Backtests ────────────────────────────────────────────────────────────────

export const BacktestsResponseSchema = z.object({
  data: z.array(EvaluationMetricsSchema),
  count: z.number().int().nonnegative()
});
export type BacktestsResponse = z.infer<typeof BacktestsResponseSchema>;

// ── Methodology ──────────────────────────────────────────────────────────────

export const MethodologyResponseSchema = z.object({
  targetDefinition: z.string().min(1),
  hotspotThresholdRule: z.string().min(1),
  statusTaxonomy: z.record(z.string(), z.string()),
  nonClinicalDisclaimer: z.string().min(1)
});
export type MethodologyResponse = z.infer<typeof MethodologyResponseSchema>;

import { z } from 'zod';
import { GeographicLevelSchema } from './area.schema.js';

export const PredictionStatusSchema = z.enum([
  'EMERGING',
  'PERSISTENT',
  'COOLING',
  'STABLE',
  'WITHHELD'
]);
export type PredictionStatus = z.infer<typeof PredictionStatusSchema>;

export const ConfidenceStatusSchema = z.enum([
  'HIGH',
  'MODERATE',
  'LOW',
  'UNAVAILABLE'
]);
export type ConfidenceStatus = z.infer<typeof ConfidenceStatusSchema>;

export const PredictionIntervalSchema = z.object({
  lower: z.number().nonnegative(),
  upper: z.number().nonnegative(),
  confidenceLevel: z.number().min(0).max(1)
});
export type PredictionInterval = z.infer<typeof PredictionIntervalSchema>;

export const PredictionSchema = z.object({
  areaId: z.string().min(1),
  geographicLevel: GeographicLevelSchema,
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  targetWeek: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  modelVersion: z.string().min(1),
  status: PredictionStatusSchema,
  confidenceStatus: ConfidenceStatusSchema.default('UNAVAILABLE'),
  pointForecast: z.number().nonnegative().nullable(),
  interval: PredictionIntervalSchema.nullable(),
  riskProbability: z.number().min(0).max(1).nullable(),
  qualityFlags: z.array(z.string()).default([]),
  sourceSnapshotIds: z.array(z.string()).default([]),
  asOfDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
});
export type Prediction = z.infer<typeof PredictionSchema>;


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

// CALIBRATED = empirically validated probability; UNCALIBRATED = raw score only; NOT_AVAILABLE = no probability
export const ConfidenceStatusSchema = z.enum(['CALIBRATED', 'UNCALIBRATED', 'NOT_AVAILABLE']);
export type ConfidenceStatus = z.infer<typeof ConfidenceStatusSchema>;

export const PredictionIntervalSchema = z.object({
  lower: z.number().nonnegative(),
  upper: z.number().nonnegative(),
  method: z.string().min(1),
  coverage: z.number().gt(0).lt(1)
});
export type PredictionInterval = z.infer<typeof PredictionIntervalSchema>;

export const PredictionSchema = z
  .object({
    areaId: z.string().min(1),
    geographicLevel: GeographicLevelSchema,
    issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
    targetWeek: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
    asOfDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
    modelVersion: z.string().min(1),
    status: PredictionStatusSchema,
    confidenceStatus: ConfidenceStatusSchema.default('NOT_AVAILABLE'),
    pointForecast: z.number().nonnegative().nullable(),
    interval: PredictionIntervalSchema.nullable(),
    riskProbability: z.number().min(0).max(1).nullable(),
    qualityFlags: z.array(z.string()).default([]),
    sourceSnapshotIds: z.array(z.string()).default([])
  })
  .superRefine((val, ctx) => {
    // WITHHELD must have null numeric fields and at least one quality flag
    if (val.status === 'WITHHELD') {
      if (val.pointForecast !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['pointForecast'],
          message: 'WITHHELD prediction must have null pointForecast'
        });
      }
      if (val.interval !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['interval'],
          message: 'WITHHELD prediction must have null interval'
        });
      }
      if (val.riskProbability !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['riskProbability'],
          message: 'WITHHELD prediction must have null riskProbability'
        });
      }
      if (val.qualityFlags.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['qualityFlags'],
          message: 'WITHHELD prediction must include at least one qualityFlag'
        });
      }
    }

    // Non-WITHHELD must have provenance and a point forecast
    if (val.status !== 'WITHHELD') {
      if (val.sourceSnapshotIds.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['sourceSnapshotIds'],
          message: 'Non-WITHHELD prediction must reference at least one sourceSnapshotId'
        });
      }
      if (val.pointForecast === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['pointForecast'],
          message: 'Non-WITHHELD prediction must have a non-null pointForecast'
        });
      }
    }

    // riskProbability is only permitted when confidenceStatus is CALIBRATED
    if (val.riskProbability !== null && val.confidenceStatus !== 'CALIBRATED') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['riskProbability'],
        message: 'riskProbability may only be set when confidenceStatus is CALIBRATED'
      });
    }

    // interval requires method and coverage (already in schema shape, but guard the non-null path)
    if (val.interval !== null && (!val.interval.method || val.interval.coverage === undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['interval'],
        message: 'interval must include method and coverage'
      });
    }

    // targetWeek must be strictly after issueDate
    if (val.targetWeek <= val.issueDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['targetWeek'],
        message: 'targetWeek must be after issueDate'
      });
    }
  });

export type Prediction = z.infer<typeof PredictionSchema>;

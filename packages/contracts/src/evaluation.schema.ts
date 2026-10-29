import { z } from 'zod';

export const BaselineMetricsSchema = z.object({
  baselineName: z.string().min(1),
  mae: z.number().nonnegative(),
  topKRecall: z.number().min(0).max(1),
  precision: z.number().min(0).max(1),
  recall: z.number().min(0).max(1)
});
export type BaselineMetrics = z.infer<typeof BaselineMetricsSchema>;

export const EvaluationMetricsSchema = z.object({
  modelVersion: z.string().min(1),
  modelName: z.string().min(1),
  trainedAt: z.string().datetime(),
  trainRange: z.object({
    startWeek: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endWeek: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }),
  testRange: z.object({
    startWeek: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endWeek: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }),
  totalEvaluatedInstances: z.number().int().nonnegative(),
  mae: z.number().nonnegative(),
  topKRecall: z.number().min(0).max(1),
  precision: z.number().min(0).max(1),
  recall: z.number().min(0).max(1),
  brierScore: z.number().min(0).max(1).nullable(),
  baselines: z.array(BaselineMetricsSchema),
  outperformsBaseline: z.boolean(),
  notes: z.string().default('')
});
export type EvaluationMetrics = z.infer<typeof EvaluationMetricsSchema>;

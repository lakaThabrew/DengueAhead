import { z } from 'zod';

export const LicenceStatusSchema = z.enum([
  'PUBLIC_DOMAIN',
  'OPEN_GOVERNMENT',
  'ATTRIBUTION_REQUIRED',
  'RESTRICTED',
  'PENDING_VERIFICATION'
]);
export type LicenceStatus = z.infer<typeof LicenceStatusSchema>;

export const SourceStatusSchema = z.enum(['SUCCESS', 'PARTIAL', 'FAILED', 'STALE']);
export type SourceStatus = z.infer<typeof SourceStatusSchema>;

export const SourceSnapshotSchema = z.object({
  sourceId: z.string().min(1),
  sourceUrl: z.string().url(),
  observedPeriod: z.string().min(1),
  retrievedAt: z.string().datetime(),
  sha256: z.string().min(64).max(64),
  licenceStatus: LicenceStatusSchema,
  parserVersion: z.string().min(1),
  status: SourceStatusSchema,
  error: z.string().nullable().optional()
});
export type SourceSnapshot = z.infer<typeof SourceSnapshotSchema>;

export const DengueWeeklyObservationSchema = z.object({
  areaId: z.string().min(1),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  weekEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  reportingWeek: z.number().int().min(1).max(53),
  reportingYear: z.number().int().min(2000).max(2100),
  cases: z.number().int().nonnegative(),
  sourceSnapshotId: z.string().min(1),
  reportedAt: z.string().datetime(),
  revision: z.number().int().nonnegative().default(0),
  qualityFlags: z.array(z.string()).default([])
});
export type DengueWeeklyObservation = z.infer<typeof DengueWeeklyObservationSchema>;

export const WeatherWeeklyObservationSchema = z.object({
  areaId: z.string().min(1),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  rainMm: z.number().nonnegative().nullable(),
  tempC: z.number().nullable(),
  humidityPct: z.number().min(0).max(100).nullable(),
  provider: z.string().min(1),
  availableAt: z.string().datetime(),
  qualityFlags: z.array(z.string()).default([])
});
export type WeatherWeeklyObservation = z.infer<typeof WeatherWeeklyObservationSchema>;

/**
 * Domain-specific API hooks for all Phase 4 endpoints.
 * Each hook composes useApiQuery with the correct schema.
 */
import {
  MetaResponseSchema,
  OverviewSummarySchema,
  AreaSeriesResponseSchema,
  AreaForecastResponseSchema,
  CompareResponseSchema,
  BacktestsResponseSchema,
  MethodologyResponseSchema,
  HealthResponseSchema,
  AreaSchema,
  PredictionSchema,
  EvaluationMetricsSchema,
  SourceSnapshotSchema
} from '@dengueahead/contracts';
import { z } from 'zod';
import { useApiQuery } from './useApiQuery.js';

const API_BASE: string =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.[
    'VITE_API_BASE_URL'
  ] ?? 'http://localhost:4000/api/v1';

// ── /api/v1/meta ──────────────────────────────────────────────────────────────

export function useMetaQuery() {
  return useApiQuery(`${API_BASE}/meta`, MetaResponseSchema);
}

// ── /api/v1/overview ─────────────────────────────────────────────────────────

export function useOverviewQuery(issueDate?: string) {
  const qs = issueDate ? `?issueDate=${encodeURIComponent(issueDate)}` : '';
  return useApiQuery(`${API_BASE}/overview${qs}`, OverviewSummarySchema);
}

// ── /api/v1/areas (list) ──────────────────────────────────────────────────────

const AreasListSchema = z.object({
  data: z.array(AreaSchema),
  count: z.number().int().nonnegative()
});

export function useAreasQuery(query?: string, level?: string, limit?: number) {
  const sp = new URLSearchParams();
  if (query) sp.set('q', query);
  if (level) sp.set('level', level);
  if (limit !== undefined) sp.set('limit', String(limit));
  const qs = sp.toString() ? `?${sp.toString()}` : '';
  return useApiQuery(`${API_BASE}/areas${qs}`, AreasListSchema);
}

// ── /api/v1/areas/:areaId ─────────────────────────────────────────────────────

export function useAreaDetailQuery(areaId: string | null) {
  return useApiQuery(areaId ? `${API_BASE}/areas/${encodeURIComponent(areaId)}` : null, AreaSchema);
}

// ── /api/v1/areas/:areaId/series ─────────────────────────────────────────────

export function useAreaSeriesQuery(areaId: string | null, from?: string, to?: string) {
  const sp = new URLSearchParams();
  if (from) sp.set('from', from);
  if (to) sp.set('to', to);
  const qs = sp.toString() ? `?${sp.toString()}` : '';
  return useApiQuery(
    areaId ? `${API_BASE}/areas/${encodeURIComponent(areaId)}/series${qs}` : null,
    AreaSeriesResponseSchema
  );
}

// ── /api/v1/areas/:areaId/forecast ───────────────────────────────────────────

export function useAreaForecastQuery(areaId: string | null, issueDate?: string) {
  const qs = issueDate ? `?issueDate=${encodeURIComponent(issueDate)}` : '';
  return useApiQuery(
    areaId ? `${API_BASE}/areas/${encodeURIComponent(areaId)}/forecast${qs}` : null,
    AreaForecastResponseSchema
  );
}

// ── /api/v1/predictions ───────────────────────────────────────────────────────

const PredictionsListSchema = z.object({
  data: z.array(PredictionSchema),
  count: z.number().int().nonnegative()
});

interface PredictionsParams {
  areaId?: string;
  status?: string;
  issueDate?: string;
  modelVersion?: string;
  limit?: number;
  offset?: number;
}

export function usePredictionsQuery(params: PredictionsParams = {}) {
  const sp = new URLSearchParams();
  if (params.areaId) sp.set('areaId', params.areaId);
  if (params.status) sp.set('status', params.status);
  if (params.issueDate) sp.set('issueDate', params.issueDate);
  if (params.modelVersion) sp.set('modelVersion', params.modelVersion);
  if (params.limit !== undefined) sp.set('limit', String(params.limit));
  if (params.offset !== undefined) sp.set('offset', String(params.offset));
  const qs = sp.toString() ? `?${sp.toString()}` : '';
  return useApiQuery(`${API_BASE}/predictions${qs}`, PredictionsListSchema);
}

// ── /api/v1/compare ───────────────────────────────────────────────────────────

export function useCompareQuery(areaIds: string[], issueDate?: string) {
  const sp = new URLSearchParams();
  if (areaIds.length > 0) sp.set('areaIds', areaIds.join(','));
  if (issueDate) sp.set('issueDate', issueDate);
  const qs = sp.toString() ? `?${sp.toString()}` : '';
  const url = areaIds.length > 0 ? `${API_BASE}/compare${qs}` : null;
  return useApiQuery(url, CompareResponseSchema);
}

// ── /api/v1/backtests ─────────────────────────────────────────────────────────

export function useBacktestsQuery(modelVersion?: string) {
  const qs = modelVersion ? `?modelVersion=${encodeURIComponent(modelVersion)}` : '';
  return useApiQuery(`${API_BASE}/backtests${qs}`, BacktestsResponseSchema);
}

// ── /api/v1/evaluation ───────────────────────────────────────────────────────

const EvaluationResponseSchema = z.object({
  data: z.array(EvaluationMetricsSchema),
  count: z.number().int().nonnegative()
});

export function useEvaluationQuery(modelVersion?: string) {
  const qs = modelVersion ? `?modelVersion=${encodeURIComponent(modelVersion)}` : '';
  return useApiQuery(`${API_BASE}/evaluation${qs}`, EvaluationResponseSchema);
}

// ── /api/v1/sources ───────────────────────────────────────────────────────────

const SourcesResponseSchema = z.object({
  data: z.array(SourceSnapshotSchema),
  count: z.number().int().nonnegative()
});

export function useSourcesQuery() {
  return useApiQuery(`${API_BASE}/sources`, SourcesResponseSchema);
}

// ── /api/v1/methodology ───────────────────────────────────────────────────────

export function useMethodologyQuery() {
  return useApiQuery(`${API_BASE}/methodology`, MethodologyResponseSchema);
}

// ── /api/v1/health ────────────────────────────────────────────────────────────

export function useHealthQuery() {
  return useApiQuery(`${API_BASE}/health`, HealthResponseSchema);
}

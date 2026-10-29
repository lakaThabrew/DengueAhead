import { describe, it, expect } from 'vitest';
import {
  AreaSchema,
  PredictionSchema,
  SourceSnapshotSchema,
  HealthResponseSchema,
  ReadinessResponseSchema
} from '../index.js';

describe('Contracts & Schemas', () => {
  // ── Area ────────────────────────────────────────────────────────────────────
  it('validates a valid Area', () => {
    const validArea = {
      areaId: 'LK-11',
      name: 'Colombo',
      level: 'district',
      centroid: { latitude: 6.9271, longitude: 79.8612 },
      population: 2300000,
      populationYear: 2024
    };
    const parsed = AreaSchema.parse(validArea);
    expect(parsed.areaId).toBe('LK-11');
    expect(parsed.name).toBe('Colombo');
  });

  it('rejects an Area with invalid geographic level', () => {
    const invalidArea = {
      areaId: 'LK-99',
      name: 'Unknown',
      level: 'province',
      centroid: { latitude: 6.9, longitude: 79.8 }
    };
    expect(() => AreaSchema.parse(invalidArea)).toThrow();
  });

  // ── Prediction — valid cases ─────────────────────────────────────────────────
  it('validates a WITHHELD prediction with null forecasts', () => {
    const withheld = {
      areaId: 'TEST_AREA_001',
      geographicLevel: 'district',
      issueDate: '2026-10-25',
      targetWeek: '2026-11-01',
      asOfDate: '2026-10-25',
      modelVersion: 'v1.0.0-test',
      status: 'WITHHELD',
      confidenceStatus: 'NOT_AVAILABLE',
      pointForecast: null,
      interval: null,
      riskProbability: null,
      qualityFlags: ['INSUFFICIENT_SOURCE_COVERAGE'],
      sourceSnapshotIds: []
    };
    const parsed = PredictionSchema.parse(withheld);
    expect(parsed.status).toBe('WITHHELD');
    expect(parsed.pointForecast).toBeNull();
    expect(parsed.interval).toBeNull();
    expect(parsed.riskProbability).toBeNull();
  });

  it('validates a non-WITHHELD prediction with required fields', () => {
    const emerging = {
      areaId: 'TEST_AREA_001',
      geographicLevel: 'district',
      issueDate: '2026-10-25',
      targetWeek: '2026-11-01',
      asOfDate: '2026-10-25',
      modelVersion: 'v1.0.0-test',
      status: 'EMERGING',
      confidenceStatus: 'NOT_AVAILABLE',
      pointForecast: 42,
      interval: null,
      riskProbability: null,
      qualityFlags: [],
      sourceSnapshotIds: ['snap-abc']
    };
    const parsed = PredictionSchema.parse(emerging);
    expect(parsed.status).toBe('EMERGING');
    expect(parsed.pointForecast).toBe(42);
  });

  it('validates a prediction with a calibrated riskProbability', () => {
    const calibrated = {
      areaId: 'TEST_AREA_001',
      geographicLevel: 'district',
      issueDate: '2026-10-25',
      targetWeek: '2026-11-01',
      asOfDate: '2026-10-25',
      modelVersion: 'v1.0.0-test',
      status: 'EMERGING',
      confidenceStatus: 'CALIBRATED',
      pointForecast: 10,
      interval: null,
      riskProbability: 0.72,
      qualityFlags: [],
      sourceSnapshotIds: ['snap-abc']
    };
    expect(() => PredictionSchema.parse(calibrated)).not.toThrow();
  });

  // ── Prediction — invariant violations ───────────────────────────────────────
  it('rejects WITHHELD with non-null pointForecast', () => {
    expect(() =>
      PredictionSchema.parse({
        areaId: 'A',
        geographicLevel: 'district',
        issueDate: '2026-10-25',
        targetWeek: '2026-11-01',
        asOfDate: '2026-10-25',
        modelVersion: 'v1',
        status: 'WITHHELD',
        confidenceStatus: 'NOT_AVAILABLE',
        pointForecast: 5,
        interval: null,
        riskProbability: null,
        qualityFlags: ['FLAG'],
        sourceSnapshotIds: []
      })
    ).toThrow();
  });

  it('rejects WITHHELD with empty qualityFlags', () => {
    expect(() =>
      PredictionSchema.parse({
        areaId: 'A',
        geographicLevel: 'district',
        issueDate: '2026-10-25',
        targetWeek: '2026-11-01',
        asOfDate: '2026-10-25',
        modelVersion: 'v1',
        status: 'WITHHELD',
        confidenceStatus: 'NOT_AVAILABLE',
        pointForecast: null,
        interval: null,
        riskProbability: null,
        qualityFlags: [],
        sourceSnapshotIds: []
      })
    ).toThrow();
  });

  it('rejects non-WITHHELD with null pointForecast', () => {
    expect(() =>
      PredictionSchema.parse({
        areaId: 'A',
        geographicLevel: 'district',
        issueDate: '2026-10-25',
        targetWeek: '2026-11-01',
        asOfDate: '2026-10-25',
        modelVersion: 'v1',
        status: 'STABLE',
        confidenceStatus: 'NOT_AVAILABLE',
        pointForecast: null,
        interval: null,
        riskProbability: null,
        qualityFlags: [],
        sourceSnapshotIds: ['snap-1']
      })
    ).toThrow();
  });

  it('rejects non-WITHHELD with empty sourceSnapshotIds', () => {
    expect(() =>
      PredictionSchema.parse({
        areaId: 'A',
        geographicLevel: 'district',
        issueDate: '2026-10-25',
        targetWeek: '2026-11-01',
        asOfDate: '2026-10-25',
        modelVersion: 'v1',
        status: 'STABLE',
        confidenceStatus: 'NOT_AVAILABLE',
        pointForecast: 5,
        interval: null,
        riskProbability: null,
        qualityFlags: [],
        sourceSnapshotIds: []
      })
    ).toThrow();
  });

  it('rejects riskProbability when confidenceStatus is not CALIBRATED', () => {
    expect(() =>
      PredictionSchema.parse({
        areaId: 'A',
        geographicLevel: 'district',
        issueDate: '2026-10-25',
        targetWeek: '2026-11-01',
        asOfDate: '2026-10-25',
        modelVersion: 'v1',
        status: 'EMERGING',
        confidenceStatus: 'UNCALIBRATED',
        pointForecast: 5,
        interval: null,
        riskProbability: 0.8,
        qualityFlags: [],
        sourceSnapshotIds: ['snap-1']
      })
    ).toThrow();
  });

  it('rejects targetWeek not after issueDate', () => {
    expect(() =>
      PredictionSchema.parse({
        areaId: 'A',
        geographicLevel: 'district',
        issueDate: '2026-11-01',
        targetWeek: '2026-10-25',
        asOfDate: '2026-11-01',
        modelVersion: 'v1',
        status: 'STABLE',
        confidenceStatus: 'NOT_AVAILABLE',
        pointForecast: 5,
        interval: null,
        riskProbability: null,
        qualityFlags: [],
        sourceSnapshotIds: ['snap-1']
      })
    ).toThrow();
  });

  it('rejects probability outside [0,1]', () => {
    expect(() =>
      PredictionSchema.parse({
        areaId: 'A',
        geographicLevel: 'district',
        issueDate: '2026-10-25',
        targetWeek: '2026-11-01',
        asOfDate: '2026-10-25',
        modelVersion: 'v1',
        status: 'EMERGING',
        confidenceStatus: 'CALIBRATED',
        pointForecast: 5,
        interval: null,
        riskProbability: 1.5,
        qualityFlags: [],
        sourceSnapshotIds: ['snap-1']
      })
    ).toThrow();
  });

  // ── HealthResponse ──────────────────────────────────────────────────────────
  it('validates HealthResponse schema', () => {
    const health = {
      status: 'ok',
      apiVersion: '1.0.0',
      service: 'dengueahead-api',
      timestamp: new Date().toISOString()
    };
    const parsed = HealthResponseSchema.parse(health);
    expect(parsed.status).toBe('ok');
  });

  // ── ReadinessResponse ───────────────────────────────────────────────────────
  it('validates ReadinessResponse with DB up', () => {
    const ready = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      components: { database: { status: 'up', latencyMs: 5 } }
    };
    expect(() => ReadinessResponseSchema.parse(ready)).not.toThrow();
  });

  it('validates ReadinessResponse with DB down', () => {
    const notReady = {
      status: 'error',
      timestamp: new Date().toISOString(),
      components: { database: { status: 'down', latencyMs: null } }
    };
    expect(() => ReadinessResponseSchema.parse(notReady)).not.toThrow();
  });

  // ── SourceSnapshot ──────────────────────────────────────────────────────────
  it('rejects SourceSnapshot with invalid URL', () => {
    expect(() =>
      SourceSnapshotSchema.parse({
        sourceId: 'ndcu-weekly',
        sourceUrl: 'not-a-url',
        observedPeriod: '2026-W43',
        retrievedAt: new Date().toISOString(),
        sha256: 'a'.repeat(64),
        licenceStatus: 'PENDING_VERIFICATION',
        parserVersion: '1.0.0',
        status: 'SUCCESS',
        error: null
      })
    ).toThrow();
  });
});

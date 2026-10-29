import { describe, it, expect } from 'vitest';
import {
  AreaSchema,
  PredictionSchema,
  SourceSnapshotSchema,
  HealthResponseSchema
} from '../index.js';

describe('Contracts & Schemas', () => {
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
      level: 'province', // only 'district' or 'moh'
      centroid: { latitude: 6.9, longitude: 79.8 }
    };
    expect(() => AreaSchema.parse(invalidArea)).toThrow();
  });

  it('validates a WITHHELD prediction with null point forecast', () => {
    const withheldPrediction = {
      areaId: 'LK-11',
      geographicLevel: 'district',
      issueDate: '2026-10-25',
      targetWeek: '2026-10-26',
      modelVersion: 'v1.0.0-test',
      status: 'WITHHELD',
      confidenceStatus: 'UNAVAILABLE',
      pointForecast: null,
      interval: null,
      riskProbability: null,
      qualityFlags: ['INSUFFICIENT_SOURCE_COVERAGE'],
      sourceSnapshotIds: ['snap-123'],
      asOfDate: '2026-10-25'
    };
    const parsed = PredictionSchema.parse(withheldPrediction);
    expect(parsed.status).toBe('WITHHELD');
    expect(parsed.pointForecast).toBeNull();
  });

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
});


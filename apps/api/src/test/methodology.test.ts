import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

describe('GET /api/v1/methodology', () => {
  it('returns 200 with methodology envelope', async () => {
    const app = createApp();
    const res = await request(app).get('/api/v1/methodology');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('targetDefinition');
    expect(res.body).toHaveProperty('hotspotThresholdRule');
    expect(res.body).toHaveProperty('statusTaxonomy');
    expect(res.body).toHaveProperty('nonClinicalDisclaimer');
  });

  it('statusTaxonomy contains all 5 status keys', async () => {
    const app = createApp();
    const res = await request(app).get('/api/v1/methodology');
    expect(res.status).toBe(200);
    const taxonomy = res.body.statusTaxonomy as Record<string, string>;
    expect(taxonomy).toHaveProperty('EMERGING');
    expect(taxonomy).toHaveProperty('PERSISTENT');
    expect(taxonomy).toHaveProperty('COOLING');
    expect(taxonomy).toHaveProperty('STABLE');
    expect(taxonomy).toHaveProperty('WITHHELD');
  });

  it('nonClinicalDisclaimer mentions population-level tool and no clinical advice', async () => {
    const app = createApp();
    const res = await request(app).get('/api/v1/methodology');
    expect(res.body.nonClinicalDisclaimer).toContain('population-level');
    expect(res.body.nonClinicalDisclaimer).toContain('public health');
  });

  it('works even without a DB connection (static response)', async () => {
    // methodology has no DB dependency
    const app = createApp();
    const res = await request(app).get('/api/v1/methodology');
    expect(res.status).toBe(200);
  });
});

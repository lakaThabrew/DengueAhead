import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

describe('GET /api/v1/methodology', () => {
  it('returns 200 OK with methodology definitions and non-clinical disclaimer', async () => {
    const app = createApp(undefined);
    const res = await request(app).get('/api/v1/methodology');

    expect(res.status).toBe(200);
    expect(res.body.targetDefinition).toContain('Continuous 1-week ahead');
    expect(res.body.statusTaxonomy.EMERGING).toBeDefined();
    expect(res.body.nonClinicalDisclaimer).toContain('non-clinical');
  });
});

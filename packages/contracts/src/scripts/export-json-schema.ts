/**
 * Export Zod schemas as JSON Schema files.
 * Run via: npm run schema:export -w @dengueahead/contracts
 * Output: packages/contracts/json-schema/*.json
 *
 * Committed output is used for cross-language contract parity (Python/pytest).
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  AreaSchema,
  PredictionSchema,
  SourceSnapshotSchema,
  EvaluationMetricsSchema,
  HealthResponseSchema,
  ReadinessResponseSchema,
  ApiErrorSchema
} from '../index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../../json-schema');
mkdirSync(OUT_DIR, { recursive: true });

const schemas: Record<string, z.ZodTypeAny> = {
  area: AreaSchema,
  prediction: PredictionSchema,
  source_snapshot: SourceSnapshotSchema,
  evaluation_metrics: EvaluationMetricsSchema,
  health_response: HealthResponseSchema,
  readiness_response: ReadinessResponseSchema,
  api_error: ApiErrorSchema
};

for (const [name, schema] of Object.entries(schemas)) {
  const jsonSchema = zodToJsonSchema(schema, { target: 'jsonSchema7' });
  const outPath = join(OUT_DIR, `${name}.json`);
  writeFileSync(outPath, JSON.stringify(jsonSchema, null, 2) + '\n', 'utf-8');
  console.log(`Written: ${outPath}`);
}
console.log('JSON Schema export complete.');

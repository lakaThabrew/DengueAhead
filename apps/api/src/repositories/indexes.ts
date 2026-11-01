/**
 * MongoDB index automation.
 * Ensures all required compound and single-field indexes exist on startup.
 * Uses createIndex with background-safe options; idempotent — safe to call on every boot.
 */
import type { DbClient } from './mongo.js';

export interface IndexDefinition {
  collection: string;
  key: Record<string, 1 | -1>;
  options?: { unique?: boolean; name?: string };
}

export const REQUIRED_INDEXES: IndexDefinition[] = [
  // areas
  {
    collection: 'areas',
    key: { areaId: 1 },
    options: { unique: true, name: 'areas_areaId_unique' }
  },

  // dengue_weekly
  {
    collection: 'dengue_weekly',
    key: { areaId: 1, weekStart: 1 },
    options: { unique: true, name: 'dengue_weekly_area_week_unique' }
  },
  {
    collection: 'dengue_weekly',
    key: { weekStart: -1 },
    options: { name: 'dengue_weekly_weekStart_desc' }
  },

  // weather_weekly
  {
    collection: 'weather_weekly',
    key: { areaId: 1, weekStart: 1 },
    options: { unique: true, name: 'weather_weekly_area_week_unique' }
  },

  // predictions
  {
    collection: 'predictions',
    key: { areaId: 1, issueDate: 1, targetWeek: 1 },
    options: { unique: true, name: 'predictions_area_issue_target_unique' }
  },
  {
    collection: 'predictions',
    key: { issueDate: -1 },
    options: { name: 'predictions_issueDate_desc' }
  },
  { collection: 'predictions', key: { status: 1 }, options: { name: 'predictions_status' } },

  // model_runs
  {
    collection: 'model_runs',
    key: { modelVersion: 1 },
    options: { unique: true, name: 'model_runs_version_unique' }
  },
  {
    collection: 'model_runs',
    key: { trainedAt: -1 },
    options: { name: 'model_runs_trainedAt_desc' }
  },

  // source_snapshots
  {
    collection: 'source_snapshots',
    key: { sourceId: 1, sha256: 1 },
    options: { unique: true, name: 'source_snapshots_id_sha_unique' }
  },
  {
    collection: 'source_snapshots',
    key: { retrievedAt: -1 },
    options: { name: 'source_snapshots_retrievedAt_desc' }
  }
];

export interface EnsureIndexesResult {
  created: string[];
  errors: string[];
}

export async function ensureIndexes(db: DbClient): Promise<EnsureIndexesResult> {
  const created: string[] = [];
  const errors: string[] = [];

  for (const spec of REQUIRED_INDEXES) {
    try {
      const col = db.collection(spec.collection);
      await col.createIndex(spec.key, spec.options ?? {});
      created.push(`${spec.collection}::${spec.options?.name ?? JSON.stringify(spec.key)}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Index already exists with the same definition is not an error
      if (msg.includes('already exists') || msg.includes('IndexOptionsConflict')) {
        created.push(
          `${spec.collection}::${spec.options?.name ?? JSON.stringify(spec.key)} (already exists)`
        );
      } else {
        errors.push(
          `${spec.collection}::${spec.options?.name ?? JSON.stringify(spec.key)}: ${msg}`
        );
      }
    }
  }

  return { created, errors };
}

import type { DbClient } from './mongo.js';

export interface ModelRunsRepository {
  listRuns(opts: {
    modelVersion?: string;
    from?: string;
    to?: string;
    limit: number;
  }): Promise<unknown[]>;
  getLatestActiveModelVersion(): Promise<string | null>;
}

export function createModelRunsRepository(db: DbClient): ModelRunsRepository {
  return {
    async listRuns(opts) {
      const filter: Record<string, unknown> = {};
      if (opts.modelVersion) filter['modelVersion'] = opts.modelVersion;
      if (opts.from) filter['trainedAt'] = { $gte: opts.from };
      if (opts.to) {
        const trainedAt = filter['trainedAt'] as Record<string, unknown> | undefined;
        filter['trainedAt'] = { ...(trainedAt ?? {}), $lte: opts.to };
      }
      return db
        .collection('model_runs')
        .find(filter, { projection: { _id: 0 } })
        .sort({ trainedAt: -1 })
        .limit(opts.limit)
        .toArray();
    },

    async getLatestActiveModelVersion() {
      const docs = await db
        .collection('model_runs')
        .find({ outperformsBaseline: true }, { projection: { _id: 0, modelVersion: 1 } })
        .sort({ trainedAt: -1 })
        .limit(1)
        .toArray();
      const doc = docs[0] as { modelVersion?: string } | undefined;
      if (doc?.modelVersion) return doc.modelVersion;
      // fallback: any latest run
      const anyDocs = await db
        .collection('model_runs')
        .find({}, { projection: { _id: 0, modelVersion: 1 } })
        .sort({ trainedAt: -1 })
        .limit(1)
        .toArray();
      const anyDoc = anyDocs[0] as { modelVersion?: string } | undefined;
      return anyDoc?.modelVersion ?? null;
    }
  };
}

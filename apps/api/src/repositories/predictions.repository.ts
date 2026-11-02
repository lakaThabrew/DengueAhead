import type { DbClient } from './mongo.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const AREA_ID_RE = /^[A-Z]{2}-\d{1,2}$/;

export interface PredictionsRepository {
  queryPredictions(opts: {
    issueDate?: string;
    status?: string;
    modelVersion?: string;
    areaId?: string;
    limit: number;
    offset: number;
  }): Promise<{ data: unknown[]; total: number }>;
  getLatestPrediction(
    areaId: string,
    issueDate?: string,
    modelVersion?: string
  ): Promise<unknown | null>;
  getOverviewCounts(issueDate: string): Promise<Record<string, number>>;
  getTopEmergingAreas(issueDate: string, topN: number): Promise<unknown[]>;
  getLatestIssueDate(): Promise<string | null>;
}

export function createPredictionsRepository(db: DbClient): PredictionsRepository {
  return {
    async queryPredictions(opts) {
      const filter: Record<string, unknown> = {};
      if (opts.issueDate && DATE_RE.test(opts.issueDate)) filter['issueDate'] = opts.issueDate;
      if (opts.status) filter['status'] = opts.status;
      if (opts.modelVersion) filter['modelVersion'] = opts.modelVersion;
      if (opts.areaId && AREA_ID_RE.test(opts.areaId)) filter['areaId'] = opts.areaId;

      const [data, total] = await Promise.all([
        db
          .collection('predictions')
          .find(filter, { projection: { _id: 0 } })
          .sort({ areaId: 1 })
          .skip(opts.offset)
          .limit(opts.limit)
          .toArray(),
        db.collection('predictions').countDocuments(filter)
      ]);
      return { data, total };
    },

    async getLatestPrediction(areaId, issueDate, modelVersion) {
      if (!AREA_ID_RE.test(areaId)) return null;
      const filter: Record<string, unknown> = { areaId };
      if (issueDate && DATE_RE.test(issueDate)) filter['issueDate'] = issueDate;
      if (modelVersion) filter['modelVersion'] = modelVersion;

      const docs = await db
        .collection('predictions')
        .find(filter, { projection: { _id: 0 } })
        .sort({ issueDate: -1 })
        .limit(1)
        .toArray();
      return docs[0] ?? null;
    },

    async getOverviewCounts(issueDate) {
      const pipeline = [
        { $match: { issueDate } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ];
      const rows = await db.collection('predictions').aggregate(pipeline).toArray();
      const counts: Record<string, number> = {};
      for (const row of rows) {
        counts[String(row['_id'])] = Number(row['count']);
      }
      return counts;
    },

    async getTopEmergingAreas(issueDate, topN) {
      return db
        .collection('predictions')
        .find(
          { issueDate, status: 'EMERGING' },
          { projection: { _id: 0, areaId: 1, status: 1, pointForecast: 1, riskProbability: 1 } }
        )
        .sort({ riskProbability: -1, pointForecast: -1 })
        .limit(topN)
        .toArray();
    },

    async getLatestIssueDate() {
      const docs = await db
        .collection('predictions')
        .find({}, { projection: { _id: 0, issueDate: 1 } })
        .sort({ issueDate: -1 })
        .limit(1)
        .toArray();
      const doc = docs[0] as { issueDate?: string } | undefined;
      return doc?.issueDate ?? null;
    }
  };
}

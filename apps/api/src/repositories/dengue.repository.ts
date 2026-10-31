import type { DbClient } from './mongo.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface DengueRepository {
  getSeries(
    areaId: string,
    opts: { from?: string; to?: string; limit: number }
  ): Promise<unknown[]>;
}

export function createDengueRepository(db: DbClient): DengueRepository {
  return {
    async getSeries(
      areaId: string,
      opts: { from?: string; to?: string; limit: number }
    ): Promise<unknown[]> {
      const filter: Record<string, unknown> = { areaId };
      if (opts.from && DATE_RE.test(opts.from)) {
        filter['weekStart'] = { ...(filter['weekStart'] as object), $gte: opts.from };
      }
      if (opts.to && DATE_RE.test(opts.to)) {
        filter['weekStart'] = { ...(filter['weekStart'] as object), $lte: opts.to };
      }

      return db
        .collection('dengue_weekly')
        .find(filter, {
          projection: { _id: 0, weekStart: 1, weekEnd: 1, cases: 1, reportedAt: 1, qualityFlags: 1 }
        })
        .sort({ weekStart: 1 })
        .limit(opts.limit)
        .toArray();
    }
  };
}

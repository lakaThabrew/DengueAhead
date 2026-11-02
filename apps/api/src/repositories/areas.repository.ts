import type { DbClient } from './mongo.js';

const AREA_ID_RE = /^[A-Z]{2}-\d{1,2}$/;

export interface AreasRepository {
  listAreas(limit: number, offset: number): Promise<unknown[]>;
  getArea(areaId: string): Promise<unknown | null>;
}

export function createAreasRepository(db: DbClient): AreasRepository {
  return {
    async listAreas(limit: number, offset: number): Promise<unknown[]> {
      return db
        .collection('areas')
        .find({}, { projection: { _id: 0 } })
        .sort({ areaId: 1 })
        .skip(offset)
        .limit(limit)
        .toArray();
    },

    async getArea(areaId: string): Promise<unknown | null> {
      if (!AREA_ID_RE.test(areaId)) return null;
      const doc = await db.collection('areas').findOne({ areaId }, { projection: { _id: 0 } });
      return doc ?? null;
    }
  };
}

export function isValidAreaId(areaId: string): boolean {
  return AREA_ID_RE.test(areaId);
}

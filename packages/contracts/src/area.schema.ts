import { z } from 'zod';

export const GeographicLevelSchema = z.enum(['district', 'moh']);
export type GeographicLevel = z.infer<typeof GeographicLevelSchema>;

export const CentroidSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});
export type Centroid = z.infer<typeof CentroidSchema>;

export const AreaSchema = z.object({
  areaId: z.string().min(1),
  name: z.string().min(1),
  level: GeographicLevelSchema,
  parentAreaId: z.string().nullable().optional(),
  centroid: CentroidSchema,
  geometryRef: z.string().nullable().optional(),
  population: z.number().int().nonnegative().nullable().optional(),
  populationYear: z.number().int().min(1900).max(2100).nullable().optional()
});
export type Area = z.infer<typeof AreaSchema>;

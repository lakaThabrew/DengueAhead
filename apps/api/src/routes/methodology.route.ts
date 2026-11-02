import { Router, Request, Response } from 'express';
import { MethodologyResponseSchema } from '@dengueahead/contracts';

export function createMethodologyRouter(): Router {
  const router = Router();

  router.get('/methodology', (_req: Request, res: Response) => {
    const methodology = MethodologyResponseSchema.parse({
      targetDefinition:
        'Continuous 1-week ahead case count (y_{t+1}) and binary hotspot threshold crossing (y_{t+1} >= tau_{a, w})',
      hotspotThresholdRule:
        'District-specific seasonal 75th percentile estimated strictly on historical training split (<= 2023)',
      statusTaxonomy: {
        EMERGING: 'Current cases < threshold and forecasted cases >= threshold',
        PERSISTENT: 'Current cases >= threshold and forecasted cases >= threshold',
        COOLING: 'Current cases >= threshold and forecasted cases < threshold',
        STABLE: 'Current cases < threshold and forecasted cases < threshold',
        WITHHELD: 'Forecast suppressed due to insufficient history or data quality issues'
      },
      nonClinicalDisclaimer:
        'DengueAhead is a population-level decision support tool for public health resource planning. It is non-clinical and does not provide medical diagnoses or clinical advice.'
    });

    res.json(methodology);
  });

  return router;
}

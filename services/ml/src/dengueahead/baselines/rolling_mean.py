"""4-week rolling mean forecaster (Baseline 2).

Predicts next-week case count equal to the 4-week historical moving average.
Produces standard Prediction objects with confidenceStatus='NOT_AVAILABLE'.
"""

from __future__ import annotations

from dengueahead.contracts.prediction import Prediction
from dengueahead.features.builder import FeatureRecord
from dengueahead.features.taxonomy import classify_status

MODEL_VERSION = "baseline-rolling-mean-4w-v1"


class RollingMean4wForecaster:
    """Baseline 2: 4-week rolling mean forecaster."""

    def __init__(self, model_version: str = MODEL_VERSION) -> None:
        self.model_version = model_version

    def predict(
        self,
        record: FeatureRecord,
        current_threshold: float,
        next_threshold: float,
    ) -> Prediction:
        """Generate next-week 4-week rolling mean prediction from feature record."""
        c1 = record.features.get("cases_lag_1")
        roll_mean = record.features.get("cases_roll_mean_4w")

        if record.is_withheld or c1 is None or roll_mean is None:
            flags = list(record.quality_flags) or ["INSUFFICIENT_HISTORY"]
            return Prediction(
                areaId=record.area_id,
                geographicLevel="district",
                issueDate=record.issue_date,
                targetWeek=record.target_week,
                asOfDate=record.issue_date,
                modelVersion=self.model_version,
                status="WITHHELD",
                confidenceStatus="NOT_AVAILABLE",
                pointForecast=None,
                interval=None,
                riskProbability=None,
                qualityFlags=flags,
                sourceSnapshotIds=record.source_snapshot_ids,
            )

        point_forecast = round(float(roll_mean), 2)
        status = classify_status(
            current_cases=float(c1),
            next_cases=point_forecast,
            current_threshold=current_threshold,
            next_threshold=next_threshold,
        )

        snapshot_ids = record.source_snapshot_ids or ["snap-baseline-observed"]

        return Prediction(
            areaId=record.area_id,
            geographicLevel="district",
            issueDate=record.issue_date,
            targetWeek=record.target_week,
            asOfDate=record.issue_date,
            modelVersion=self.model_version,
            status=status,
            confidenceStatus="NOT_AVAILABLE",
            pointForecast=point_forecast,
            interval=None,
            riskProbability=None,
            qualityFlags=record.quality_flags,
            sourceSnapshotIds=snapshot_ids,
        )

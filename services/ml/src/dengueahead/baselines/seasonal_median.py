"""Seasonal historical median forecaster (Baseline 3).

Predicts next-week case count equal to the historical median for that calendar week.
Produces standard Prediction objects with confidenceStatus='NOT_AVAILABLE'.
"""

from __future__ import annotations

from dengueahead.contracts.prediction import Prediction
from dengueahead.features.builder import FeatureRecord
from dengueahead.features.taxonomy import classify_status

MODEL_VERSION = "baseline-seasonal-median-v1"


class SeasonalMedianForecaster:
    """Baseline 3: Seasonal historical median forecaster."""

    def __init__(self, model_version: str = MODEL_VERSION) -> None:
        self.model_version = model_version

    def predict(
        self,
        record: FeatureRecord,
        current_threshold: float,
        next_threshold: float,
    ) -> Prediction:
        """Generate next-week seasonal median prediction from feature record."""
        c1 = record.features.get("cases_lag_1")
        seasonal_median = record.features.get("seasonal_historical_median")

        if record.is_withheld or c1 is None or seasonal_median is None:
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

        point_forecast = round(float(seasonal_median), 2)
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

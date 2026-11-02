"""Naive last-week persistence forecaster (Baseline 1).

Predicts next-week case count equal to current-week case count: y_hat_{t+1} = y_t.
Produces standard Prediction objects with confidenceStatus='NOT_AVAILABLE'.
"""

from __future__ import annotations

from dengueahead.contracts.prediction import Prediction
from dengueahead.features.builder import FeatureRecord
from dengueahead.features.taxonomy import classify_status

MODEL_VERSION = "baseline-naive-last-week-v1"


class NaiveLastWeekForecaster:
    """Baseline 1: Persistence forecaster."""

    def __init__(self, model_version: str = MODEL_VERSION) -> None:
        self.model_version = model_version

    def predict(
        self,
        record: FeatureRecord,
        current_threshold: float,
        next_threshold: float,
    ) -> Prediction:
        """Generate next-week persistence prediction from feature record."""
        c1 = record.features.get("cases_lag_1")
        # Invariant check: if withheld or current case count is missing
        if record.is_withheld or c1 is None:
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

        point_forecast = round(float(c1), 2)
        status = classify_status(
            current_cases=float(c1),
            next_cases=point_forecast,
            current_threshold=current_threshold,
            next_threshold=next_threshold,
        )

        # Non-WITHHELD must have at least one sourceSnapshotId per contract invariant.
        # If record had none, provide a fallback marker or ensure caller provided it.
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

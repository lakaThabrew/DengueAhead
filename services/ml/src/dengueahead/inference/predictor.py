"""Production inference engine with schema and artifact failure guards (ML-05, ML-06)."""

from __future__ import annotations

from typing import Any

import numpy as np

from dengueahead.contracts.prediction import Prediction
from dengueahead.features.builder import FeatureRecord
from dengueahead.features.taxonomy import classify_status
from dengueahead.training.dataset import extract_feature_vector


class MLHotspotPredictor:
    """Inference wrapper around trained ML model, calibrator, and interval calculator."""

    def __init__(
        self,
        model: Any,
        calibrator: Any = None,
        interval_calc: Any = None,
        model_version: str = "dengueahead-ml-v1",
        feature_names: list[str] | None = None,
    ) -> None:
        self.model = model
        self.calibrator = calibrator
        self.interval_calc = interval_calc
        self.model_version = model_version
        self.feature_names = feature_names

    def predict(
        self,
        record: FeatureRecord,
        current_threshold: float,
        next_threshold: float,
    ) -> Prediction:
        """Produce validated Prediction object from FeatureRecord."""
        # Check if input record is withheld
        if record.is_withheld:
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

        c1 = record.features.get("cases_lag_1")
        if c1 is None:
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
                qualityFlags=["MISSING_CURRENT_REPORT"],
                sourceSnapshotIds=record.source_snapshot_ids,
            )

        # Assemble feature vector
        vec = extract_feature_vector(record.features, self.feature_names)
        X = np.array([vec], dtype=np.float64)

        # Generate continuous prediction
        try:
            preds = self.model.predict_counts(X)
            point_forecast = round(float(preds[0]), 2)
        except Exception:  # noqa: BLE001
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
                qualityFlags=["MODEL_PREDICTION_FAILED"],
                sourceSnapshotIds=record.source_snapshot_ids,
            )

        # Non-negative guard (ML-04)
        point_forecast = max(0.0, point_forecast)

        # Calibrated probability
        risk_probability = None
        confidence_status = "NOT_AVAILABLE"

        if self.calibrator is not None:
            margin = point_forecast - next_threshold
            prob = self.calibrator.predict_probability(margin)
            if prob is not None:
                risk_probability = prob
                confidence_status = "CALIBRATED"
            else:
                confidence_status = "UNCALIBRATED"
                risk_probability = None

        # Prediction interval
        interval = None
        if self.interval_calc is not None:
            interval = self.interval_calc.compute_interval(point_forecast)

        # Hotspot transition classification
        status = classify_status(
            current_cases=float(c1),
            next_cases=point_forecast,
            current_threshold=current_threshold,
            next_threshold=next_threshold,
        )

        snapshot_ids = record.source_snapshot_ids or ["snap-ml-observed"]

        return Prediction(
            areaId=record.area_id,
            geographicLevel="district",
            issueDate=record.issue_date,
            targetWeek=record.target_week,
            asOfDate=record.issue_date,
            modelVersion=self.model_version,
            status=status,
            confidenceStatus=confidence_status,
            pointForecast=point_forecast,
            interval=interval,
            riskProbability=risk_probability,
            qualityFlags=record.quality_flags,
            sourceSnapshotIds=snapshot_ids,
        )

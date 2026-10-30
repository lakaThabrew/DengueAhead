"""Rolling origin temporal backtest execution harness.

Simulates weekly operational forecast issuance across an out-of-time evaluation window.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from dengueahead.contracts.prediction import Prediction
from dengueahead.evaluation.metrics import (
    ComputedMetrics,
    EvaluationInstance,
    compute_metrics,
)
from dengueahead.evaluation.split import DateRange, get_weekly_dates_in_range
from dengueahead.features.as_of import parse_iso_date
from dengueahead.features.builder import build_features_for_area
from dengueahead.features.seasonality import (
    calculate_hotspot_thresholds,
    calculate_seasonal_medians,
)


class BacktestRunner:
    """Orchestrates rolling temporal backtests for forecasters."""

    def __init__(
        self,
        observations: list[dict[str, Any]],
        areas: list[str],
        weather_records: list[dict[str, Any]] | None = None,
        train_end_date: str = "2023-12-25",
    ) -> None:
        self.observations = observations
        self.areas = areas
        self.weather_records = weather_records
        self.train_end_date = train_end_date

        # Fit seasonal medians and hotspot thresholds strictly on training data
        self.seasonal_medians = calculate_seasonal_medians(
            observations, train_end_date=train_end_date
        )
        self.hotspot_thresholds = calculate_hotspot_thresholds(
            observations, quantile=0.75, train_end_date=train_end_date
        )

        # Build fast lookup for actual observations by (areaId, weekStart)
        self._obs_lookup: dict[tuple[str, str], float] = {}
        for o in observations:
            area = o.get("areaId")
            ws = o.get("weekStart")
            cases = o.get("cases")
            if area and ws and cases is not None:
                self._obs_lookup[(area, ws)] = float(cases)

    def run_backtest(
        self,
        forecaster: Any,
        eval_range: DateRange,
        top_k: int = 3,
    ) -> tuple[ComputedMetrics, list[Prediction]]:
        """Execute rolling origin backtest over eval_range."""
        issue_dates = get_weekly_dates_in_range(eval_range.start_date, eval_range.end_date)
        eval_instances: list[EvaluationInstance] = []
        predictions: list[Prediction] = []

        for issue_date in issue_dates:
            issue_dt = parse_iso_date(issue_date)
            # Threshold for current week
            curr_iso_week = issue_dt.isocalendar().week

            for area_id in self.areas:
                rec = build_features_for_area(
                    area_id=area_id,
                    as_of=issue_date,
                    observations=self.observations,
                    weather_records=self.weather_records,
                    seasonal_medians=self.seasonal_medians,
                )

                curr_thresh = self.hotspot_thresholds.get((area_id, curr_iso_week), 50.0)
                target_iso_week = parse_iso_date(rec.target_week).isocalendar().week
                next_thresh = self.hotspot_thresholds.get((area_id, target_iso_week), 50.0)

                pred = forecaster.predict(
                    record=rec,
                    current_threshold=curr_thresh,
                    next_threshold=next_thresh,
                )
                predictions.append(pred)

                # Check if ground truth actual cases exist for target week
                actual = self._obs_lookup.get((area_id, rec.target_week))
                if actual is not None and pred.pointForecast is not None:
                    eval_instances.append(
                        EvaluationInstance(
                            area_id=area_id,
                            target_week=rec.target_week,
                            actual_cases=actual,
                            predicted_cases=pred.pointForecast,
                            threshold=next_thresh,
                        )
                    )

        metrics = compute_metrics(eval_instances, top_k=top_k)
        return metrics, predictions

    def build_model_run_record(
        self,
        model_version: str,
        model_name: str,
        metrics: ComputedMetrics,
        train_range: DateRange,
        test_range: DateRange,
        baseline_metrics_list: list[dict[str, Any]] | None = None,
        outperforms_baseline: bool = False,
        notes: str = "",
    ) -> dict[str, Any]:
        """Build a document matching EvaluationMetricsSchema."""
        return {
            "modelVersion": model_version,
            "modelName": model_name,
            "trainedAt": datetime.now(UTC).isoformat(),
            "trainRange": {
                "startWeek": train_range.start_date,
                "endWeek": train_range.end_date,
            },
            "testRange": {
                "startWeek": test_range.start_date,
                "endWeek": test_range.end_date,
            },
            "totalEvaluatedInstances": metrics.total_instances,
            "mae": metrics.mae,
            "topKRecall": metrics.top_k_recall,
            "precision": metrics.precision,
            "recall": metrics.recall,
            "brierScore": metrics.brier_score,
            "baselines": baseline_metrics_list or [],
            "outperformsBaseline": outperforms_baseline,
            "notes": notes,
        }

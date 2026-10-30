"""Unit tests for evaluation metrics calculation (EVAL-01)."""

from __future__ import annotations

from dengueahead.evaluation.metrics import EvaluationInstance, compute_metrics


def test_eval_01_metrics_calculation() -> None:
    """EVAL-01: Hand-calculated fixture values match exactly."""
    instances = [
        # Week 1: 3 areas
        # LK-11: actual=100, pred=90, thresh=80 -> TP (both >= 80)
        EvaluationInstance(
            area_id="LK-11",
            target_week="2024-07-08",
            actual_cases=100.0,
            predicted_cases=90.0,
            threshold=80.0,
        ),
        # LK-12: actual=50, pred=70, thresh=60 -> FP (pred >= 60, actual < 60)
        EvaluationInstance(
            area_id="LK-12",
            target_week="2024-07-08",
            actual_cases=50.0,
            predicted_cases=70.0,
            threshold=60.0,
        ),
        # LK-13: actual=40, pred=30, thresh=50 -> TN (both < 50)
        EvaluationInstance(
            area_id="LK-13",
            target_week="2024-07-08",
            actual_cases=40.0,
            predicted_cases=30.0,
            threshold=50.0,
        ),
    ]

    metrics = compute_metrics(instances, top_k=2)

    # MAE = (|100 - 90| + |50 - 70| + |40 - 30|) / 3 = (10 + 20 + 10) / 3 = 40 / 3 = 13.33
    assert metrics.mae == 13.33

    # TP = 1 (LK-11), FP = 1 (LK-12), FN = 0, TN = 1 (LK-13)
    # Precision = 1 / (1 + 1) = 0.5
    assert metrics.precision == 0.5
    # Recall = 1 / (1 + 0) = 1.0
    assert metrics.recall == 1.0

    # Top-2 for week 2024-07-08:
    # Actual: LK-11 (100), LK-12 (50)
    # Pred: LK-11 (90), LK-12 (70)
    # Overlap = 2 / 2 = 1.0
    assert metrics.top_k_recall == 1.0
    assert metrics.total_instances == 3
    assert metrics.brier_score is None


def test_empty_metrics() -> None:
    metrics = compute_metrics([])
    assert metrics.total_instances == 0
    assert metrics.mae == 0.0
    assert metrics.precision == 0.0
    assert metrics.recall == 0.0
    assert metrics.top_k_recall == 0.0

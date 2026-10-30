"""Evaluation metric computations matching contracts/evaluation.schema.ts."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class EvaluationInstance:
    area_id: str
    target_week: str
    actual_cases: float
    predicted_cases: float
    threshold: float


@dataclass(frozen=True)
class ComputedMetrics:
    total_instances: int
    mae: float
    precision: float
    recall: float
    top_k_recall: float
    brier_score: float | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "totalEvaluatedInstances": self.total_instances,
            "mae": self.mae,
            "precision": self.precision,
            "recall": self.recall,
            "topKRecall": self.top_k_recall,
            "brierScore": self.brier_score,
        }


def compute_metrics(
    instances: list[EvaluationInstance],
    top_k: int = 3,
) -> ComputedMetrics:
    """Compute MAE, precision, recall, and top-K recall from evaluation instances."""
    if not instances:
        return ComputedMetrics(
            total_instances=0,
            mae=0.0,
            precision=0.0,
            recall=0.0,
            top_k_recall=0.0,
            brier_score=None,
        )

    # 1. MAE
    abs_errors = [abs(inst.actual_cases - inst.predicted_cases) for inst in instances]
    mae = round(sum(abs_errors) / len(abs_errors), 2)

    # 2. Precision & Recall on hotspot threshold (y >= threshold)
    tp = 0
    fp = 0
    fn = 0
    tn = 0

    for inst in instances:
        actual_hotspot = inst.actual_cases >= inst.threshold
        predicted_hotspot = inst.predicted_cases >= inst.threshold

        if predicted_hotspot and actual_hotspot:
            tp += 1
        elif predicted_hotspot and not actual_hotspot:
            fp += 1
        elif not predicted_hotspot and actual_hotspot:
            fn += 1
        else:
            tn += 1

    precision = round(tp / (tp + fp), 4) if (tp + fp) > 0 else 0.0
    recall = round(tp / (tp + fn), 4) if (tp + fn) > 0 else (1.0 if fn == 0 else 0.0)

    # 3. Top-K Recall grouped by target_week
    by_week: dict[str, list[EvaluationInstance]] = {}
    for inst in instances:
        by_week.setdefault(inst.target_week, []).append(inst)

    weekly_recalls: list[float] = []
    for week, week_insts in by_week.items():
        if len(week_insts) < top_k:
            continue
        # Actual top-k areas
        sorted_actual = sorted(week_insts, key=lambda x: x.actual_cases, reverse=True)
        top_actual_areas = {x.area_id for x in sorted_actual[:top_k]}

        # Predicted top-k areas
        sorted_pred = sorted(week_insts, key=lambda x: x.predicted_cases, reverse=True)
        top_pred_areas = {x.area_id for x in sorted_pred[:top_k]}

        overlap = len(top_actual_areas.intersection(top_pred_areas))
        weekly_recalls.append(overlap / top_k)

    top_k_recall = round(sum(weekly_recalls) / len(weekly_recalls), 4) if weekly_recalls else 0.0

    return ComputedMetrics(
        total_instances=len(instances),
        mae=mae,
        precision=precision,
        recall=recall,
        top_k_recall=top_k_recall,
        brier_score=None,
    )

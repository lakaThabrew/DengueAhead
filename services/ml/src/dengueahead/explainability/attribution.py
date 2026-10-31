"""Feature importance and local attribution explainability.

Computes global permutation importances and local feature contributions.
Mandates clear non-causal disclaimers (Rule 6).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np

NON_CAUSAL_DISCLAIMER = (
    "Feature attributions indicate statistical association in historical "
    "surveillance data, not clinical or biological causation."
)


@dataclass(frozen=True)
class FeatureDriver:
    feature_name: str
    impact: float
    direction: str  # "INCREASE_RISK" or "DECREASE_RISK"


@dataclass(frozen=True)
class PredictionExplanation:
    area_id: str
    target_week: str
    top_drivers: list[FeatureDriver]
    disclaimer: str = NON_CAUSAL_DISCLAIMER

    def to_dict(self) -> dict[str, Any]:
        return {
            "areaId": self.area_id,
            "targetWeek": self.target_week,
            "topDrivers": [
                {
                    "featureName": d.feature_name,
                    "impact": d.impact,
                    "direction": d.direction,
                }
                for d in self.top_drivers
            ],
            "disclaimer": self.disclaimer,
        }


def compute_permutation_importance(
    model: Any,
    X: np.ndarray,
    y: np.ndarray,
    feature_names: list[str],
    n_repeats: int = 5,
    random_state: int = 42,
) -> dict[str, float]:
    """Compute permutation feature importance based on MAE increase."""
    if len(y) == 0:
        return {name: 0.0 for name in feature_names}

    baseline_preds = model.predict_counts(X)
    baseline_mae = float(np.mean(np.abs(y - baseline_preds)))

    rng = np.random.RandomState(random_state)
    importances: dict[str, float] = {}

    for j, name in enumerate(feature_names):
        scores = []
        for _ in range(n_repeats):
            X_perm = X.copy()
            perm_idx = rng.permutation(len(X))
            X_perm[:, j] = X_perm[perm_idx, j]

            perm_preds = model.predict_counts(X_perm)
            perm_mae = float(np.mean(np.abs(y - perm_preds)))
            scores.append(perm_mae - baseline_mae)

        mean_diff = float(np.mean(scores))
        importances[name] = round(max(0.0, mean_diff), 4)

    # Normalize relative importances
    total = sum(importances.values())
    if total > 0:
        return {k: round(v / total, 4) for k, v in importances.items()}
    return importances


def explain_instance(
    feature_vector: list[float],
    feature_names: list[str],
    reference_medians: list[float],
    area_id: str,
    target_week: str,
    weights: list[float] | None = None,
    top_k: int = 3,
) -> PredictionExplanation:
    """Derive top local positive and negative feature drivers relative to medians."""
    drivers: list[FeatureDriver] = []
    w = weights or [1.0] * len(feature_names)

    for val, ref, name, weight in zip(
        feature_vector, reference_medians, feature_names, w, strict=False
    ):
        if np.isnan(val) or np.isnan(ref):
            continue
        impact = (val - ref) * weight
        if abs(impact) < 1e-4:
            continue
        direction = "INCREASE_RISK" if impact > 0 else "DECREASE_RISK"
        drivers.append(
            FeatureDriver(
                feature_name=name,
                impact=round(float(abs(impact)), 2),
                direction=direction,
            )
        )

    drivers.sort(key=lambda d: d.impact, reverse=True)
    return PredictionExplanation(
        area_id=area_id,
        target_week=target_week,
        top_drivers=drivers[:top_k],
        disclaimer=NON_CAUSAL_DISCLAIMER,
    )

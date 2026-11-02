"""Unit tests for feature explainability and attribution disclaimers."""

from __future__ import annotations

import numpy as np

from dengueahead.explainability.attribution import (
    NON_CAUSAL_DISCLAIMER,
    compute_permutation_importance,
    explain_instance,
)
from dengueahead.training.linear import RidgeHotspotPipeline


def test_permutation_importance_calculation() -> None:
    # Feature 0 strongly predicts y; Feature 1 is noise
    X = np.array([[10.0, 1.0], [20.0, 1.0], [30.0, 1.0], [40.0, 1.0]] * 5)
    y = np.array([10.0, 20.0, 30.0, 40.0] * 5)
    feature_names = ["important_feature", "noise_feature"]

    model = RidgeHotspotPipeline(alpha=0.1, feature_names=feature_names).fit(X, y)
    importances = compute_permutation_importance(model, X, y, feature_names, random_state=42)

    assert "important_feature" in importances
    assert "noise_feature" in importances
    assert importances["important_feature"] > importances["noise_feature"]


def test_local_explanation_contains_non_causal_disclaimer() -> None:
    feature_names = ["lag_1", "lag_2"]
    vec = [50.0, 20.0]
    ref_medians = [30.0, 20.0]

    explanation = explain_instance(
        feature_vector=vec,
        feature_names=feature_names,
        reference_medians=ref_medians,
        area_id="LK-11",
        target_week="2024-06-24",
    )

    assert explanation.disclaimer == NON_CAUSAL_DISCLAIMER
    assert len(explanation.top_drivers) >= 1
    assert explanation.top_drivers[0].feature_name == "lag_1"
    assert explanation.top_drivers[0].direction == "INCREASE_RISK"

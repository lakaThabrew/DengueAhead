"""Unit tests for RidgeHotspotPipeline (ML-01, ML-04)."""

from __future__ import annotations

import numpy as np

from dengueahead.training.linear import RidgeHotspotPipeline


def test_ml_01_ridge_reproducibility() -> None:
    """ML-01: Two fits on same data with fixed seed produce identical weights and predictions."""
    X = np.array([[10.0, 20.0], [20.0, 30.0], [30.0, 40.0], [40.0, 50.0]])
    y = np.array([25.0, 35.0, 45.0, 55.0])

    m1 = RidgeHotspotPipeline(alpha=1.0, random_state=42, feature_names=["f1", "f2"]).fit(X, y)
    m2 = RidgeHotspotPipeline(alpha=1.0, random_state=42, feature_names=["f1", "f2"]).fit(X, y)

    p1 = m1.predict_counts(X)
    p2 = m2.predict_counts(X)

    np.testing.assert_array_equal(p1, p2)
    assert m1.get_feature_coefficients() == m2.get_feature_coefficients()


def test_ml_04_ridge_non_negative_projection() -> None:
    """ML-04: Predictions are non-negative; negative continuous outputs are clamped at 0.0."""
    X = np.array([[10.0], [20.0], [30.0]])
    y = np.array([10.0, 20.0, 30.0])
    model = RidgeHotspotPipeline(alpha=0.1, feature_names=["f1"]).fit(X, y)

    # Input that would predict far into negative values
    X_extreme_neg = np.array([[-1000.0]])
    preds = model.predict_counts(X_extreme_neg)

    assert preds[0] == 0.0
    assert (preds >= 0.0).all()

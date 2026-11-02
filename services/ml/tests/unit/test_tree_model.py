"""Unit tests for HGBHotspotPipeline (ML-01, ML-04)."""

from __future__ import annotations

import numpy as np

from dengueahead.training.tree import HGBHotspotPipeline


def test_ml_01_hgb_reproducibility() -> None:
    """ML-01: Two fits on same data with fixed seed produce identical predictions."""
    X = np.array([[10.0, 5.0], [20.0, 15.0], [30.0, 25.0], [40.0, 35.0], [50.0, 45.0]] * 10)
    y = np.array([12.0, 22.0, 32.0, 42.0, 52.0] * 10)

    m1 = HGBHotspotPipeline(random_state=42, min_samples_leaf=2).fit(X, y)
    m2 = HGBHotspotPipeline(random_state=42, min_samples_leaf=2).fit(X, y)

    p1 = m1.predict_counts(X)
    p2 = m2.predict_counts(X)

    np.testing.assert_array_equal(p1, p2)


def test_ml_04_hgb_non_negative_projection() -> None:
    """ML-04: Predictions are clamped at >= 0.0."""
    X = np.array([[1.0], [2.0], [3.0]] * 10)
    y = np.array([0.0, 0.0, 0.0] * 10)
    model = HGBHotspotPipeline(min_samples_leaf=2).fit(X, y)

    preds = model.predict_counts(np.array([[-100.0]]))
    assert (preds >= 0.0).all()

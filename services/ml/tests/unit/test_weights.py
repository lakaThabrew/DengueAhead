"""Unit tests for sample recency and time-decay weighting (ML)."""

import numpy as np
import pytest

from dengueahead.training.weights import compute_recency_weights
from dengueahead.training.tree import HGBHotspotPipeline
from dengueahead.training.linear import RidgeHotspotPipeline


def test_compute_recency_weights_empty():
    weights = compute_recency_weights([])
    assert len(weights) == 0


def test_compute_recency_weights_recent_window():
    # Dates within recent 8 weeks should all have weight 1.0
    dates = [
        "2026-11-02",
        "2026-10-26",
        "2026-10-19",
        "2026-10-12",
        "2026-10-05",
        "2026-09-28",
        "2026-09-21",
        "2026-09-14",
    ]
    weights = compute_recency_weights(dates, recent_window_weeks=8)
    assert len(weights) == 8
    assert np.all(weights == 1.0)


def test_compute_recency_weights_decay():
    # Dates spanning 2 years
    dates = [
        "2026-11-02",  # Most recent -> 1.0
        "2026-08-03",  # ~13 weeks ago -> decayed
        "2025-11-03",  # 52 weeks ago -> lower
        "2024-11-04",  # 104 weeks ago -> minimum floor (0.15)
    ]
    weights = compute_recency_weights(dates, recent_window_weeks=8, min_weight=0.15)
    assert weights[0] == 1.0
    assert weights[1] < weights[0]
    assert weights[2] < weights[1]
    assert weights[3] >= 0.15


def test_hgb_fit_with_sample_weights():
    X = np.array([
        [10.0, 5.0, 1.0],
        [20.0, 10.0, 2.0],
        [30.0, 15.0, 3.0],
        [40.0, 20.0, 4.0],
        [50.0, 25.0, 5.0],
    ])
    y = np.array([12.0, 22.0, 31.0, 42.0, 53.0])
    weights = np.array([0.2, 0.4, 0.6, 0.8, 1.0])

    m = HGBHotspotPipeline(min_samples_leaf=2, random_state=42)
    m.fit(X, y, sample_weight=weights)
    assert m.is_fitted
    preds = m.predict_counts(X)
    assert len(preds) == len(y)
    assert np.all(preds >= 0.0)


def test_ridge_fit_with_sample_weights():
    X = np.array([
        [10.0, 5.0],
        [20.0, 10.0],
        [30.0, 15.0],
        [40.0, 20.0],
        [50.0, 25.0],
    ])
    y = np.array([12.0, 22.0, 31.0, 42.0, 53.0])
    weights = np.array([0.2, 0.4, 0.6, 0.8, 1.0])

    m = RidgeHotspotPipeline(alpha=1.0, random_state=42, feature_names=["f1", "f2"])
    m.fit(X, y, sample_weight=weights)
    assert m.is_fitted
    preds = m.predict_counts(X)
    assert len(preds) == len(y)
    assert np.all(preds >= 0.0)


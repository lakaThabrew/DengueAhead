"""Unit tests for tabular dataset assembly (ML-02)."""

from __future__ import annotations

import numpy as np

from dengueahead.evaluation.split import DateRange
from dengueahead.training.dataset import build_tabular_dataset


def test_ml_02_lookahead_leakage_prevention() -> None:
    """ML-02: Target y_{t+1} is strictly isolated from feature matrix X."""
    observations = [
        {"areaId": "LK-11", "weekStart": "2023-01-02", "cases": 10},
        {"areaId": "LK-11", "weekStart": "2023-01-09", "cases": 20},
        {"areaId": "LK-11", "weekStart": "2023-01-16", "cases": 30},
        {"areaId": "LK-11", "weekStart": "2023-01-23", "cases": 40},
        {"areaId": "LK-11", "weekStart": "2023-01-30", "cases": 50},  # target for 2023-01-23
    ]
    split = DateRange(start_date="2023-01-23", end_date="2023-01-23")
    dataset = build_tabular_dataset(observations=observations, areas=["LK-11"], date_range=split)

    assert len(dataset) == 1
    # Target y should be week 2023-01-30 cases = 50.0
    assert dataset.y[0] == 50.0
    # Lag 1 in X should be week 2023-01-23 cases = 40.0
    cases_lag_1_idx = dataset.feature_names.index("cases_lag_1")
    assert dataset.X[0, cases_lag_1_idx] == 40.0

    # Mutating target week count cannot affect X
    mutated_obs = [
        {"areaId": "LK-11", "weekStart": "2023-01-02", "cases": 10},
        {"areaId": "LK-11", "weekStart": "2023-01-09", "cases": 20},
        {"areaId": "LK-11", "weekStart": "2023-01-16", "cases": 30},
        {"areaId": "LK-11", "weekStart": "2023-01-23", "cases": 40},
        {"areaId": "LK-11", "weekStart": "2023-01-30", "cases": 9999},  # altered target
    ]
    mutated_dataset = build_tabular_dataset(
        observations=mutated_obs, areas=["LK-11"], date_range=split
    )

    np.testing.assert_array_equal(dataset.X, mutated_dataset.X)
    assert mutated_dataset.y[0] == 9999.0

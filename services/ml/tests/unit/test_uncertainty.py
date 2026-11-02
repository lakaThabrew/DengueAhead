"""Unit tests for conformal prediction intervals."""

from __future__ import annotations

import numpy as np
import pytest

from dengueahead.training.uncertainty import ConformalIntervalCalculator


def test_conformal_interval_calculation() -> None:
    actuals = np.array([100.0, 150.0, 200.0, 250.0])
    preds = np.array([110.0, 140.0, 190.0, 270.0])
    # Residuals: [10, 10, 10, 20]

    calc = ConformalIntervalCalculator(target_coverage=0.80).fit(actuals, preds)
    assert calc.delta is not None

    interval = calc.compute_interval(100.0)
    assert interval is not None
    assert interval.lower >= 0.0
    assert interval.upper > interval.lower
    assert interval.coverage == 0.80
    assert interval.method == "conformal_residual_quantile"


def test_conformal_interval_clamps_negative_lower_bound() -> None:
    actuals = np.array([100.0])
    preds = np.array([50.0])
    # Residual = 50.0

    calc = ConformalIntervalCalculator(target_coverage=0.50).fit(actuals, preds)
    interval = calc.compute_interval(10.0)
    assert interval is not None
    # 10 - 50 = -40, clamped to 0.0
    assert interval.lower == 0.0


def test_invalid_coverage_raises() -> None:
    with pytest.raises(ValueError, match="target_coverage must be in"):
        ConformalIntervalCalculator(target_coverage=1.5)

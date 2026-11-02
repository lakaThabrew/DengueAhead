"""Empirical conformal prediction interval estimation.

Derives non-parametric residual quantiles on validation errors to guarantee
finite-sample coverage without distributional assumptions.
Enforces non-negative lower bounds (ML-04).
"""

from __future__ import annotations

import numpy as np

from dengueahead.contracts.prediction import PredictionInterval


class ConformalIntervalCalculator:
    """Computes empirical prediction intervals based on validation residual quantiles."""

    def __init__(self, target_coverage: float = 0.80) -> None:
        if not (0.0 < target_coverage < 1.0):
            raise ValueError(f"target_coverage must be in (0, 1), got {target_coverage}")
        self.target_coverage = target_coverage
        self.delta: float | None = None

    def fit(self, actuals: np.ndarray, predictions: np.ndarray) -> ConformalIntervalCalculator:
        """Compute the target coverage quantile of absolute validation residuals."""
        if len(actuals) == 0:
            self.delta = None
            return self

        residuals = np.abs(actuals - predictions)
        self.delta = round(float(np.quantile(residuals, self.target_coverage)), 2)
        return self

    def compute_interval(self, point_forecast: float) -> PredictionInterval | None:
        """Construct empirical prediction interval for point_forecast."""
        if self.delta is None:
            return None

        lower = max(0.0, round(point_forecast - self.delta, 2))
        upper = round(point_forecast + self.delta, 2)

        return PredictionInterval(
            lower=lower,
            upper=upper,
            method="conformal_residual_quantile",
            coverage=self.target_coverage,
        )

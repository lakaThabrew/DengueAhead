"""HistGradientBoosting regression model for non-linear hotspot forecasting (ML-01, ML-04)."""

from __future__ import annotations

import numpy as np
from sklearn.ensemble import HistGradientBoostingRegressor

from dengueahead.training.dataset import FEATURE_NAMES

MODEL_VERSION = "dengueahead-hgb-v1"


class HGBHotspotPipeline:
    """HistGradientBoosting regressor with non-negative projection."""

    def __init__(
        self,
        learning_rate: float = 0.05,
        max_depth: int = 4,
        min_samples_leaf: int = 10,
        l2_regularization: float = 1.0,
        random_state: int = 42,
        model_version: str = MODEL_VERSION,
        feature_names: list[str] | None = None,
    ) -> None:
        self.learning_rate = learning_rate
        self.max_depth = max_depth
        self.min_samples_leaf = min_samples_leaf
        self.l2_regularization = l2_regularization
        self.random_state = random_state
        self.model_version = model_version
        self.feature_names = feature_names or list(FEATURE_NAMES)
        self.regressor = HistGradientBoostingRegressor(
            learning_rate=learning_rate,
            max_depth=max_depth,
            min_samples_leaf=min_samples_leaf,
            l2_regularization=l2_regularization,
            random_state=random_state,
        )
        self.is_fitted = False
        # Mask of columns retained after dropping constant / all-NaN columns at fit time.
        # Stored so predict uses the same column subset (ML-05 feature schema parity).
        self._active_col_mask: np.ndarray | None = None

    @staticmethod
    def _active_columns(X: np.ndarray) -> np.ndarray:
        """Return boolean mask of columns with >= 2 distinct non-NaN values.

        HistGradientBoostingRegressor requires at least 2 distinct values per
        feature to compute bin thresholds via sliding_window_view(..., 2).
        Columns that are all-NaN or constant after NaN removal are dropped.
        """
        mask = np.zeros(X.shape[1], dtype=bool)
        for j in range(X.shape[1]):
            col = X[:, j]
            distinct = np.unique(col[~np.isnan(col)])
            if len(distinct) >= 2:
                mask[j] = True
        return mask

    def fit(
        self,
        X: np.ndarray,
        y: np.ndarray,
        sample_weight: np.ndarray | None = None,
    ) -> HGBHotspotPipeline:
        """Fit HistGradientBoosting regressor on (X, y) with optional sample_weight.

        Automatically drops constant or all-NaN feature columns so that
        sklearn's binning step never encounters a degenerate sliding window.
        """
        if len(y) == 0:
            raise ValueError("Cannot fit HGB model on empty training set")
        self._active_col_mask = self._active_columns(X)
        if not self._active_col_mask.any():
            raise ValueError("All feature columns are constant or all-NaN; cannot fit HGB model")
        self.regressor.fit(X[:, self._active_col_mask], y, sample_weight=sample_weight)
        self.is_fitted = True
        return self

    def predict_counts(self, X: np.ndarray) -> np.ndarray:
        """Predict continuous counts; strictly clipped at 0.0 (ML-04 non-negative)."""
        if not self.is_fitted:
            raise RuntimeError("Model must be fitted before predict")
        if self._active_col_mask is None:
            raise RuntimeError("Model fitted state inconsistent: missing column mask")
        raw = self.regressor.predict(X[:, self._active_col_mask])
        return np.maximum(0.0, np.round(raw, 2))

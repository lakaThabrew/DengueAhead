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

    def fit(self, X: np.ndarray, y: np.ndarray) -> HGBHotspotPipeline:
        """Fit HistGradientBoosting regressor on (X, y)."""
        if len(y) == 0:
            raise ValueError("Cannot fit HGB model on empty training set")
        self.regressor.fit(X, y)
        self.is_fitted = True
        return self

    def predict_counts(self, X: np.ndarray) -> np.ndarray:
        """Predict continuous counts; strictly clipped at 0.0 (ML-04 non-negative)."""
        if not self.is_fitted:
            raise RuntimeError("Model must be fitted before predict")
        raw = self.regressor.predict(X)
        return np.maximum(0.0, np.round(raw, 2))

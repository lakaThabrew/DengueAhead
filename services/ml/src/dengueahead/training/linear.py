"""Regularized Ridge linear regression hotspot model (ML-01, ML-04).

Produces non-negative continuous count predictions using StandardScaler + Ridge.
"""

from __future__ import annotations

import numpy as np
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from dengueahead.training.dataset import FEATURE_NAMES

MODEL_VERSION = "dengueahead-ridge-v1"


class RidgeHotspotPipeline:
    """Standardized Ridge Regression model with non-negative projection."""

    def __init__(
        self,
        alpha: float = 10.0,
        random_state: int = 42,
        model_version: str = MODEL_VERSION,
        feature_names: list[str] | None = None,
    ) -> None:
        self.alpha = alpha
        self.random_state = random_state
        self.model_version = model_version
        self.feature_names = feature_names or list(FEATURE_NAMES)
        self.pipeline = Pipeline(
            [
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler()),
                ("regressor", Ridge(alpha=alpha, random_state=random_state)),
            ]
        )
        self.is_fitted = False

    def fit(self, X: np.ndarray, y: np.ndarray) -> RidgeHotspotPipeline:
        """Fit scaler and ridge regressor on training matrix (X, y)."""
        if len(y) == 0:
            raise ValueError("Cannot fit Ridge model on empty training set")
        self.pipeline.fit(X, y)
        self.is_fitted = True
        return self

    def predict_counts(self, X: np.ndarray) -> np.ndarray:
        """Predict continuous counts; strictly clips at 0.0 (ML-04 non-negative)."""
        if not self.is_fitted:
            raise RuntimeError("Model must be fitted before predict")
        raw = self.pipeline.predict(X)
        return np.maximum(0.0, np.round(raw, 2))

    def get_feature_coefficients(self) -> dict[str, float]:
        """Return regression coefficients mapped to feature names."""
        if not self.is_fitted:
            raise RuntimeError("Model must be fitted before coefficients")
        reg = self.pipeline.named_steps["regressor"]
        coefs = reg.coef_
        return {
            name: round(float(coefs[i]), 4)
            for i, name in enumerate(self.feature_names)
            if i < len(coefs)
        }

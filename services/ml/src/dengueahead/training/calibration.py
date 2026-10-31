"""Probability calibration via Platt scaling (ML-03, Rule 6).

Fits a univariate logistic sigmoid on validation prediction margins.
Enforces that uncalibrated models output riskProbability=None and confidenceStatus='UNCALIBRATED'.
"""

from __future__ import annotations

import numpy as np
from sklearn.linear_model import LogisticRegression


class PlattCalibrator:
    """Logistic sigmoid probability calibrator on prediction margin (y_hat - threshold)."""

    def __init__(self, random_state: int = 42) -> None:
        self.random_state = random_state
        self.classifier = LogisticRegression(penalty=None, random_state=random_state)
        self.is_calibrated = False
        self.brier_score: float | None = None

    def fit(
        self,
        margins: np.ndarray,
        binary_ground_truth: np.ndarray,
    ) -> PlattCalibrator:
        """Fit sigmoid on validation margins (s = y_hat - tau) and binary labels.

        Evaluates Brier score; only marks is_calibrated=True if calibration improves
        upon the naive climatology base rate.
        """
        if len(binary_ground_truth) == 0:
            self.is_calibrated = False
            return self

        # Check if both classes are present
        unique_labels = np.unique(binary_ground_truth)
        if len(unique_labels) < 2:
            # Cannot calibrate on single-class set
            self.is_calibrated = False
            return self

        X_margins = margins.reshape(-1, 1)
        self.classifier.fit(X_margins, binary_ground_truth)

        # Compute Brier score on validation
        probs = self.classifier.predict_proba(X_margins)[:, 1]
        brier = float(np.mean((probs - binary_ground_truth) ** 2))
        self.brier_score = round(brier, 4)

        # Baseline climatology Brier score: constant prediction of base rate p_bar
        p_bar = float(np.mean(binary_ground_truth))
        brier_climatology = float(np.mean((p_bar - binary_ground_truth) ** 2))

        # Must beat climatology to be considered calibrated
        if brier <= brier_climatology:
            self.is_calibrated = True
        else:
            self.is_calibrated = False

        return self

    def predict_probability(self, margin: float) -> float | None:
        """Predict calibrated posterior probability.

        Returns None if calibration is invalid or degraded (Rule 6).
        """
        if not self.is_calibrated:
            return None
        prob = float(self.classifier.predict_proba(np.array([[margin]]))[:, 1][0])
        # Bound strictly between 0 and 1
        return round(min(max(prob, 0.0), 1.0), 4)

    def get_confidence_status(self) -> str:
        return "CALIBRATED" if self.is_calibrated else "UNCALIBRATED"

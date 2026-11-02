"""Unit tests for Platt probability calibration (ML-03)."""

from __future__ import annotations

import numpy as np

from dengueahead.training.calibration import PlattCalibrator


def test_ml_03_calibrated_probabilities_in_unit_range() -> None:
    """ML-03: Probabilities are strictly in [0.0, 1.0] and monotonic with margin."""
    # Margins: negative -> no hotspot, positive -> hotspot
    margins = np.array([-50.0, -30.0, -10.0, 0.0, 10.0, 30.0, 50.0] * 5)
    labels = np.array([0, 0, 0, 1, 1, 1, 1] * 5)

    calib = PlattCalibrator(random_state=42).fit(margins, labels)

    assert calib.is_calibrated
    assert calib.get_confidence_status() == "CALIBRATED"

    p_low = calib.predict_probability(-40.0)
    p_high = calib.predict_probability(40.0)

    assert p_low is not None and p_high is not None
    assert 0.0 <= p_low <= 1.0
    assert 0.0 <= p_high <= 1.0
    assert p_high > p_low


def test_ml_03_uncalibrated_fallback_when_single_class() -> None:
    """ML-03: When calibration cannot be reliably fit, outputs None and UNCALIBRATED."""
    margins = np.array([10.0, 20.0, 30.0])
    labels = np.array([1, 1, 1])  # single class

    calib = PlattCalibrator().fit(margins, labels)

    assert not calib.is_calibrated
    assert calib.get_confidence_status() == "UNCALIBRATED"
    assert calib.predict_probability(15.0) is None

"""Sample weighting functions for temporal recency and time-decay learning."""

from __future__ import annotations

import numpy as np

from dengueahead.features.as_of import parse_iso_date


def compute_recency_weights(
    issue_dates: list[str],
    recent_window_weeks: int = 8,
    decay_rate: float = 0.02,
    min_weight: float = 0.15,
) -> np.ndarray:
    """Compute time-decay sample weights giving higher weight to recent weeks.

    Parameters
    ----------
    issue_dates : list[str]
        ISO issue date strings (YYYY-MM-DD) for each row in dataset.
    recent_window_weeks : int, default 8
        Recent weeks within this window receive the maximum weight (1.0).
    decay_rate : float, default 0.02
        Exponential decay rate per week beyond the recent window.
    min_weight : float, default 0.15
        Floor minimum weight so ancient observations still contribute
        to long-term seasonal baselines.

    Returns
    -------
    np.ndarray
        Array of positive weights of length len(issue_dates).
    """
    if not issue_dates:
        return np.array([])

    dates = [parse_iso_date(d) for d in issue_dates]
    max_date = max(dates)

    weights: list[float] = []
    for d in dates:
        delta_weeks = max(0, (max_date - d).days // 7)
        if delta_weeks <= recent_window_weeks:
            weights.append(1.0)
        else:
            excess_weeks = delta_weeks - recent_window_weeks
            w = float(np.exp(-decay_rate * excess_weeks))
            weights.append(float(np.clip(w, min_weight, 1.0)))

    return np.array(weights, dtype=float)


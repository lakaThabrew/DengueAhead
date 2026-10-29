"""Contract parity tests: Pydantic Prediction model must accept/reject the same fixtures as Zod."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from dengueahead.contracts.prediction import Prediction

# Fixtures live at packages/contracts/fixtures/ relative to the repo root.
# File path: services/ml/tests/test_contract_parity.py
# parents[0]=tests, parents[1]=ml, parents[2]=services, parents[3]=repo root
_REPO_ROOT = Path(__file__).resolve().parents[3]
_FIXTURES_DIR = _REPO_ROOT / "packages" / "contracts" / "fixtures"


def _load_fixture(path: Path) -> dict:
    """Load a JSON fixture, stripping the _comment key used for documentation."""
    data = json.loads(path.read_text(encoding="utf-8"))
    data.pop("_comment", None)
    return data


def _valid_fixtures() -> list[Path]:
    return sorted((_FIXTURES_DIR / "valid").glob("prediction*.json"))


def _invalid_fixtures() -> list[Path]:
    return sorted((_FIXTURES_DIR / "invalid").glob("prediction*.json"))


@pytest.mark.parametrize("fixture_path", _valid_fixtures(), ids=lambda p: p.name)
def test_valid_fixture_parses(fixture_path: Path) -> None:
    """Every valid fixture must be accepted by the Pydantic Prediction model."""
    data = _load_fixture(fixture_path)
    prediction = Prediction.model_validate(data)
    assert prediction.areaId == data["areaId"]


@pytest.mark.parametrize("fixture_path", _invalid_fixtures(), ids=lambda p: p.name)
def test_invalid_fixture_rejected(fixture_path: Path) -> None:
    """Every invalid fixture must be rejected by the Pydantic Prediction model."""
    data = _load_fixture(fixture_path)
    with pytest.raises(ValidationError):
        Prediction.model_validate(data)

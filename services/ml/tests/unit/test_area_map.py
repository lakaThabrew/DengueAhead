"""Unit tests for ingestion/area_map.py — DATA-03."""

from __future__ import annotations

from pathlib import Path

import pytest
import yaml

from dengueahead.ingestion.area_map import (
    QUARANTINE_ID,
    AreaMap,
    ParseError,
    load_area_map,
    resolve_area,
)


def _make_area_map(policy: str = "quarantine") -> AreaMap:
    return AreaMap(
        mappings={
            "Colombo": "LK-11",
            "Gampaha": "LK-12",
            "Col.": "LK-11",
        },
        unmatched_policy=policy,  # type: ignore[arg-type]
    )


# DATA-03: Unrecognised alias → None / QUARANTINE
class TestResolveArea:
    def test_exact_match(self) -> None:
        area_map = _make_area_map()
        assert resolve_area("Colombo", area_map) == "LK-11"

    def test_abbreviation_match(self) -> None:
        area_map = _make_area_map()
        assert resolve_area("Col.", area_map) == "LK-11"

    def test_case_insensitive_fallback(self) -> None:
        area_map = _make_area_map()
        assert resolve_area("colombo", area_map) == "LK-11"

    def test_unmatched_quarantine_policy(self) -> None:
        area_map = _make_area_map("quarantine")
        result = resolve_area("UnknownXYZ", area_map)
        assert result == QUARANTINE_ID
        assert area_map.quarantined_count == 1
        assert "UnknownXYZ" in area_map.unmatched_names

    def test_unmatched_warn_policy_returns_none(self) -> None:
        area_map = _make_area_map("warn")
        result = resolve_area("UnknownXYZ", area_map)
        assert result is None

    def test_unmatched_reject_policy_raises(self) -> None:
        area_map = _make_area_map("reject")
        with pytest.raises(ParseError):
            resolve_area("UnknownXYZ", area_map)

    def test_resolved_count_incremented(self) -> None:
        area_map = _make_area_map()
        resolve_area("Colombo", area_map)
        resolve_area("Gampaha", area_map)
        assert area_map.resolved_count == 2

    def test_quarantine_does_not_increment_resolved(self) -> None:
        area_map = _make_area_map("quarantine")
        resolve_area("Unknown", area_map)
        assert area_map.resolved_count == 0
        assert area_map.quarantined_count == 1


class TestLoadAreaMap:
    def test_load_from_yaml(self, tmp_path: Path) -> None:
        data = {
            "unmatched_policy": "quarantine",
            "mappings": {"Colombo": "LK-11", "Gampaha": "LK-12"},
        }
        yaml_path = tmp_path / "area_map.yaml"
        yaml_path.write_text(yaml.dump(data), encoding="utf-8")
        area_map = load_area_map(yaml_path)
        assert area_map.mappings["Colombo"] == "LK-11"
        assert area_map.unmatched_policy == "quarantine"

    def test_invalid_policy_raises(self, tmp_path: Path) -> None:
        data = {"unmatched_policy": "explode", "mappings": {}}
        yaml_path = tmp_path / "area_map.yaml"
        yaml_path.write_text(yaml.dump(data), encoding="utf-8")
        with pytest.raises(ValueError, match="Invalid unmatched_policy"):
            load_area_map(yaml_path)

    def test_real_area_map_loads(self) -> None:
        """The committed configs/area_map.yaml must load and contain all 25 districts."""
        real_path = Path("configs/area_map.yaml")
        if not real_path.exists():
            pytest.skip("configs/area_map.yaml not found")
        area_map = load_area_map(real_path)
        # All 25 district IDs LK-11 through LK-92 must be present as values
        expected_ids = {
            "LK-11",
            "LK-12",
            "LK-13",
            "LK-21",
            "LK-22",
            "LK-23",
            "LK-31",
            "LK-32",
            "LK-33",
            "LK-41",
            "LK-42",
            "LK-43",
            "LK-44",
            "LK-45",
            "LK-51",
            "LK-52",
            "LK-53",
            "LK-61",
            "LK-62",
            "LK-71",
            "LK-72",
            "LK-81",
            "LK-82",
            "LK-91",
            "LK-92",
        }
        mapped_ids = set(area_map.mappings.values())
        assert expected_ids.issubset(mapped_ids), f"Missing districts: {expected_ids - mapped_ids}"

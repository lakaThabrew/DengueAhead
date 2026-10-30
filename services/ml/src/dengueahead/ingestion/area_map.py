"""Area name → canonical areaId mapping with configurable unmatched policy."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal

import yaml

from dengueahead.common import logging as log

UnmatchedPolicy = Literal["quarantine", "warn", "reject"]

QUARANTINE_ID = "QUARANTINE"
UNMATCHED_FLAG = "UNMATCHED_AREA"


class ParseError(Exception):
    """Raised by area_map when unmatched_policy='reject' and a name is unresolved."""

    def __init__(self, message: str, raw_excerpt: str = "") -> None:
        super().__init__(message)
        self.raw_excerpt = raw_excerpt


@dataclass
class AreaMap:
    mappings: dict[str, str]
    unmatched_policy: UnmatchedPolicy = "quarantine"
    # Stats tracked during a run
    _resolved: int = field(default=0, repr=False)
    _quarantined: int = field(default=0, repr=False)
    _unmatched_names: list[str] = field(default_factory=list, repr=False)

    @property
    def resolved_count(self) -> int:
        return self._resolved

    @property
    def quarantined_count(self) -> int:
        return self._quarantined

    @property
    def unmatched_names(self) -> list[str]:
        return list(self._unmatched_names)


def load_area_map(path: Path) -> AreaMap:
    """Load an :class:`AreaMap` from a YAML file at *path*."""
    raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    mappings: dict[str, str] = {str(k): str(v) for k, v in raw.get("mappings", {}).items()}
    policy: UnmatchedPolicy = raw.get("unmatched_policy", "quarantine")
    if policy not in ("quarantine", "warn", "reject"):
        raise ValueError(f"Invalid unmatched_policy '{policy}' in {path}")
    return AreaMap(mappings=mappings, unmatched_policy=policy)


def resolve_area(name: str, area_map: AreaMap) -> str | None:
    """Resolve *name* to a canonical areaId using *area_map*.

    Returns:
        The canonical ``areaId`` string, ``QUARANTINE_ID`` if unmatched and
        policy is 'quarantine', or ``None`` if policy is 'warn'.

    Raises:
        ParseError: when ``unmatched_policy`` is ``'reject'`` and *name* is not mapped.
    """
    # Exact match first
    area_id = area_map.mappings.get(name)
    if area_id is None:
        # Case-insensitive fallback
        lower = name.strip().lower()
        for key, val in area_map.mappings.items():
            if key.strip().lower() == lower:
                area_id = val
                break

    if area_id is not None:
        area_map._resolved += 1
        return area_id

    # Unmatched
    area_map._unmatched_names.append(name)
    log.warning("Unmatched area name", name=name, policy=area_map.unmatched_policy)

    if area_map.unmatched_policy == "reject":
        raise ParseError(
            f"Area name '{name}' could not be resolved to a canonical areaId",
            raw_excerpt=name,
        )
    if area_map.unmatched_policy == "quarantine":
        area_map._quarantined += 1
        return QUARANTINE_ID
    # warn: skip
    return None

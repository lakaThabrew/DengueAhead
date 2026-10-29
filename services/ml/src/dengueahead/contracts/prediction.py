"""Pydantic Prediction model — parity with the Zod PredictionSchema in packages/contracts."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, model_validator

PredictionStatus = Literal["EMERGING", "PERSISTENT", "COOLING", "STABLE", "WITHHELD"]
ConfidenceStatus = Literal["CALIBRATED", "UNCALIBRATED", "NOT_AVAILABLE"]
GeographicLevel = Literal["district", "moh"]

_DATE_RE = r"^\d{4}-\d{2}-\d{2}$"


class PredictionInterval(BaseModel):
    lower: float = Field(ge=0)
    upper: float = Field(ge=0)
    method: str = Field(min_length=1)
    coverage: float = Field(gt=0, lt=1)


class Prediction(BaseModel):
    areaId: str = Field(min_length=1)
    geographicLevel: GeographicLevel
    issueDate: str = Field(pattern=_DATE_RE)
    targetWeek: str = Field(pattern=_DATE_RE)
    asOfDate: str = Field(pattern=_DATE_RE)
    modelVersion: str = Field(min_length=1)
    status: PredictionStatus
    confidenceStatus: ConfidenceStatus = "NOT_AVAILABLE"
    pointForecast: float | None = Field(default=None, ge=0)
    interval: PredictionInterval | None = None
    riskProbability: float | None = Field(default=None, ge=0, le=1)
    qualityFlags: list[str] = Field(default_factory=list)
    sourceSnapshotIds: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def check_invariants(self) -> Prediction:
        # WITHHELD must have null numeric fields and at least one quality flag
        if self.status == "WITHHELD":
            if self.pointForecast is not None:
                raise ValueError("WITHHELD prediction must have null pointForecast")
            if self.interval is not None:
                raise ValueError("WITHHELD prediction must have null interval")
            if self.riskProbability is not None:
                raise ValueError("WITHHELD prediction must have null riskProbability")
            if len(self.qualityFlags) == 0:
                raise ValueError("WITHHELD prediction must include at least one qualityFlag")
        # Non-WITHHELD must have provenance and a point forecast
        if self.status != "WITHHELD":
            if len(self.sourceSnapshotIds) == 0:
                raise ValueError(
                    "Non-WITHHELD prediction must reference at least one sourceSnapshotId"
                )
            if self.pointForecast is None:
                raise ValueError("Non-WITHHELD prediction must have a non-null pointForecast")
        # riskProbability only when CALIBRATED
        if self.riskProbability is not None and self.confidenceStatus != "CALIBRATED":
            raise ValueError("riskProbability may only be set when confidenceStatus is CALIBRATED")
        # targetWeek must be after issueDate
        if self.targetWeek <= self.issueDate:
            raise ValueError("targetWeek must be after issueDate")
        return self

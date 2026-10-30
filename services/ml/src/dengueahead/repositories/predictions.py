"""predictions collection — published forecast and historical replay repository."""

from __future__ import annotations

from typing import Any

from pymongo.database import Database

from dengueahead.contracts.prediction import Prediction
from dengueahead.repositories.source_snapshots import UpsertResult


def prediction_to_doc(pred: Prediction) -> dict[str, Any]:
    """Convert a Prediction Pydantic model into a MongoDB document."""
    doc = pred.model_dump(exclude_none=False)
    # Ensure nested interval is dict or None
    if pred.interval is not None:
        doc["interval"] = pred.interval.model_dump()
    return doc


def upsert_prediction(
    db: Database,  # type: ignore[type-arg]
    prediction: Prediction,
) -> UpsertResult:
    """Upsert a prediction document keyed on (areaId, targetWeek, modelVersion, issueDate)."""
    doc = prediction_to_doc(prediction)
    result = db["predictions"].update_one(
        {
            "areaId": prediction.areaId,
            "targetWeek": prediction.targetWeek,
            "modelVersion": prediction.modelVersion,
            "issueDate": prediction.issueDate,
        },
        {"$setOnInsert": doc},
        upsert=True,
    )
    return UpsertResult(
        matched=result.matched_count,
        inserted=1 if result.upserted_id is not None else 0,
        modified=result.modified_count,
    )


def upsert_predictions_batch(
    db: Database,  # type: ignore[type-arg]
    predictions: list[Prediction],
) -> int:
    """Batch upsert predictions into MongoDB."""
    inserted = 0
    for pred in predictions:
        res = upsert_prediction(db, pred)
        if res.inserted:
            inserted += 1
    return inserted


def query_predictions(
    db: Database,  # type: ignore[type-arg]
    as_of: str | None = None,
    area_id: str | None = None,
    model_version: str | None = None,
    limit: int = 1000,
) -> list[dict[str, Any]]:
    """Query published predictions matching criteria."""
    query: dict[str, Any] = {}
    if as_of:
        query["asOfDate"] = as_of
    if area_id:
        query["areaId"] = area_id
    if model_version:
        query["modelVersion"] = model_version

    return list(db["predictions"].find(query, {"_id": 0}).sort("areaId", 1).limit(limit))

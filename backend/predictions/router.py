"""Predictions router."""

from fastapi import APIRouter, Depends

from auth.jwt_utils import get_current_user
from predictions.service import (
    generate_predictions,
    get_prediction,
    get_predictions,
    get_prediction_vs_actual,
)

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.get("/")
def list_predictions(current_user: dict = Depends(get_current_user)):
    return get_predictions(current_user["sub"])


@router.post("/generate")
def generate(current_user: dict = Depends(get_current_user)):
    new_preds = generate_predictions(current_user["sub"])
    return {"generated": len(new_preds), "predictions": new_preds}


@router.get("/vs-actual")
def prediction_vs_actual(current_user: dict = Depends(get_current_user)):
    """Resolved challenges: predicted vs actual spend over time (for charts)."""
    return get_prediction_vs_actual(current_user["sub"])


@router.get("/{prediction_id}")
def single_prediction(
    prediction_id: int, current_user: dict = Depends(get_current_user)
):
    return get_prediction(prediction_id, current_user["sub"])

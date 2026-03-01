"""Challenges router."""

from fastapi import APIRouter, Depends

from auth.jwt_utils import get_current_user
from challenges.models import CreateChallenge, ReportSpend
from challenges.service import (
    accept_challenge,
    create_challenge,
    decline_challenge,
    get_challenge,
    list_challenges,
    report_spend,
    get_win_loss_stats,
)

router = APIRouter(prefix="/challenges", tags=["challenges"])


@router.post("/")
def create(body: CreateChallenge, current_user: dict = Depends(get_current_user)):
    return create_challenge(
        initiator_id=current_user["sub"],
        friend_id=body.friend_id,
        prediction_id=body.prediction_id,
        event_id=body.event_id,
        spend_limit=body.spend_limit,
        stake_per_side=body.stake_per_side,
    )


@router.get("/")
def list_all(current_user: dict = Depends(get_current_user)):
    return list_challenges(current_user["sub"])


@router.get("/stats")
def stats(current_user: dict = Depends(get_current_user)):
    """Win/loss aggregate for current user (wins, losses, total_won, total_lost, win_rate)."""
    return get_win_loss_stats(current_user["sub"])


@router.get("/{challenge_id}")
def single(challenge_id: int, current_user: dict = Depends(get_current_user)):
    return get_challenge(challenge_id, current_user["sub"])


@router.post("/{challenge_id}/accept")
def accept(challenge_id: int, current_user: dict = Depends(get_current_user)):
    return accept_challenge(challenge_id, current_user["sub"])


@router.post("/{challenge_id}/decline")
def decline(challenge_id: int, current_user: dict = Depends(get_current_user)):
    return decline_challenge(challenge_id, current_user["sub"])


@router.post("/{challenge_id}/report")
def report(
    challenge_id: int,
    body: ReportSpend,
    current_user: dict = Depends(get_current_user),
):
    return report_spend(challenge_id, current_user["sub"], body.actual_amount_spent)

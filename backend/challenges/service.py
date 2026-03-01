"""Challenge state machine + wallet transaction logic."""

from fastapi import HTTPException

from database import run_query, transaction
from friends.service import are_friends
from wallet.service import record_transaction

STAKE = 5.00


def create_challenge(
    initiator_id: str,
    friend_id: str,
    prediction_id: int,
    event_id: str,
    spend_limit: float,
    stake_per_side: float = STAKE,
) -> dict:
    if initiator_id == friend_id:
        raise HTTPException(status_code=400, detail="Cannot challenge yourself")
    if not are_friends(initiator_id, friend_id):
        raise HTTPException(status_code=403, detail="You must be friends to challenge")

    # Check balance
    bal_rows = run_query(
        "SELECT wallet_balance FROM users WHERE user_id = %s", (initiator_id,)
    )
    if not bal_rows or float(bal_rows[0]["WALLET_BALANCE"]) < stake_per_side:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    with transaction() as conn:
        from database import run_query_in_txn

        rows = run_query_in_txn(
            conn,
            """
            INSERT INTO challenges
                (initiator_id, friend_id, prediction_id, event_id, spend_limit, stake_per_side)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (initiator_id, friend_id, prediction_id, event_id, spend_limit, stake_per_side),
            fetch=False,
        )
        # Get the new challenge_id
        id_rows = run_query_in_txn(
            conn,
            "SELECT MAX(challenge_id) AS cid FROM challenges WHERE initiator_id = %s",
            (initiator_id,),
        )
        challenge_id = id_rows[0]["CID"]

        record_transaction(
            conn,
            user_id=initiator_id,
            txn_type="stake_lock",
            amount=-stake_per_side,
            description=f"Stake locked for challenge #{challenge_id}",
            challenge_id=challenge_id,
        )

    return {"challenge_id": challenge_id, "status": "pending_friend"}


def accept_challenge(challenge_id: int, friend_id: str) -> dict:
    rows = run_query(
        "SELECT * FROM challenges WHERE challenge_id = %s AND friend_id = %s AND status = 'pending_friend'",
        (challenge_id, friend_id),
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Challenge not found or not yours to accept")

    ch = rows[0]
    stake = float(ch["STAKE_PER_SIDE"])

    bal_rows = run_query(
        "SELECT wallet_balance FROM users WHERE user_id = %s", (friend_id,)
    )
    if not bal_rows or float(bal_rows[0]["WALLET_BALANCE"]) < stake:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    with transaction() as conn:
        from database import run_query_in_txn

        run_query_in_txn(
            conn,
            "UPDATE challenges SET status = 'active', updated_at = CURRENT_TIMESTAMP() "
            "WHERE challenge_id = %s",
            (challenge_id,),
            fetch=False,
        )
        record_transaction(
            conn,
            user_id=friend_id,
            txn_type="stake_lock",
            amount=-stake,
            description=f"Stake locked for challenge #{challenge_id}",
            challenge_id=challenge_id,
        )

    return {"challenge_id": challenge_id, "status": "active"}


def decline_challenge(challenge_id: int, friend_id: str) -> dict:
    rows = run_query(
        "SELECT * FROM challenges WHERE challenge_id = %s AND friend_id = %s AND status = 'pending_friend'",
        (challenge_id, friend_id),
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Challenge not found")

    ch = rows[0]
    initiator_id = ch["INITIATOR_ID"]
    stake = float(ch["STAKE_PER_SIDE"])

    with transaction() as conn:
        from database import run_query_in_txn

        run_query_in_txn(
            conn,
            "UPDATE challenges SET status = 'declined', updated_at = CURRENT_TIMESTAMP() "
            "WHERE challenge_id = %s",
            (challenge_id,),
            fetch=False,
        )
        record_transaction(
            conn,
            user_id=initiator_id,
            txn_type="stake_release",
            amount=stake,
            description=f"Stake returned - challenge #{challenge_id} declined",
            challenge_id=challenge_id,
        )

    return {"challenge_id": challenge_id, "status": "declined"}


def report_spend(challenge_id: int, initiator_id: str, actual_amount: float) -> dict:
    rows = run_query(
        "SELECT * FROM challenges WHERE challenge_id = %s AND initiator_id = %s AND status = 'pending_report'",
        (challenge_id, initiator_id),
    )
    if not rows:
        raise HTTPException(
            status_code=404,
            detail="Challenge not found or not in pending_report state",
        )

    ch = rows[0]
    friend_id = ch["FRIEND_ID"]
    spend_limit = float(ch["SPEND_LIMIT"])
    stake = float(ch["STAKE_PER_SIDE"])
    pot = stake * 2

    # Under budget → initiator wins; over budget → friend wins
    if actual_amount <= spend_limit:
        winner_id, loser_id = initiator_id, friend_id
    else:
        winner_id, loser_id = friend_id, initiator_id

    with transaction() as conn:
        from database import run_query_in_txn

        run_query_in_txn(
            conn,
            "UPDATE challenges SET status = 'resolved', updated_at = CURRENT_TIMESTAMP() "
            "WHERE challenge_id = %s",
            (challenge_id,),
            fetch=False,
        )
        run_query_in_txn(
            conn,
            """
            INSERT INTO challenge_outcomes
                (challenge_id, actual_amount_spent, winner_id, loser_id,
                 pot_amount, resolution_type)
            VALUES (%s, %s, %s, %s, %s, 'reported')
            """,
            (challenge_id, actual_amount, winner_id, loser_id, pot),
            fetch=False,
        )
        record_transaction(
            conn,
            user_id=winner_id,
            txn_type="winnings",
            amount=pot,
            description=f"Won challenge #{challenge_id}",
            challenge_id=challenge_id,
        )

    return {
        "challenge_id": challenge_id,
        "status": "resolved",
        "winner_id": winner_id,
        "pot": pot,
    }


def list_challenges(user_id: str) -> list[dict]:
    return run_query(
        """
        SELECT c.*,
               ui.display_name AS initiator_name,
               uf.display_name AS friend_name,
               ce.title AS event_title, ce.start_time
        FROM challenges c
        JOIN users ui ON ui.user_id = c.initiator_id
        JOIN users uf ON uf.user_id = c.friend_id
        JOIN calendar_events ce ON ce.event_id = c.event_id AND ce.user_id = c.initiator_id
        WHERE c.initiator_id = %s OR c.friend_id = %s
        ORDER BY c.created_at DESC
        """,
        (user_id, user_id),
    )


def get_challenge(challenge_id: int, user_id: str) -> dict:
    rows = run_query(
        """
        SELECT c.*,
               ui.display_name AS initiator_name,
               uf.display_name AS friend_name,
               ce.title AS event_title, ce.start_time, ce.end_time
        FROM challenges c
        JOIN users ui ON ui.user_id = c.initiator_id
        JOIN users uf ON uf.user_id = c.friend_id
        JOIN calendar_events ce ON ce.event_id = c.event_id AND ce.user_id = c.initiator_id
        WHERE c.challenge_id = %s
          AND (c.initiator_id = %s OR c.friend_id = %s)
        """,
        (challenge_id, user_id, user_id),
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return rows[0]


def get_win_loss_stats(user_id: str) -> dict:
    """Aggregate challenge_outcomes for current user: wins, losses, total_won, total_lost, win_rate."""
    rows = run_query(
        """
        SELECT
            COUNT(CASE WHEN winner_id = %s THEN 1 END) AS wins,
            COUNT(CASE WHEN loser_id = %s THEN 1 END) AS losses,
            COALESCE(SUM(CASE WHEN winner_id = %s THEN pot_amount ELSE 0 END), 0) AS total_won,
            COALESCE(SUM(CASE WHEN loser_id = %s THEN pot_amount ELSE 0 END), 0) AS total_lost
        FROM challenge_outcomes
        WHERE winner_id = %s OR loser_id = %s
        """,
        (user_id, user_id, user_id, user_id, user_id, user_id),
    )
    if not rows:
        return {
            "wins": 0,
            "losses": 0,
            "total_won": 0.0,
            "total_lost": 0.0,
            "win_rate": None,
        }
    r = rows[0]
    wins = int(r.get("WINS") or 0)
    losses = int(r.get("LOSSES") or 0)
    total = wins + losses
    win_rate = (wins / total * 100) if total else None
    return {
        "wins": wins,
        "losses": losses,
        "total_won": float(r.get("TOTAL_WON") or 0),
        "total_lost": float(r.get("TOTAL_LOST") or 0),
        "win_rate": round(win_rate, 1) if win_rate is not None else None,
    }

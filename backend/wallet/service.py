"""Wallet service: balance and transaction log."""

from database import run_query


def get_balance(user_id: str) -> dict:
    rows = run_query(
        "SELECT wallet_balance FROM users WHERE user_id = %s",
        (user_id,),
    )
    return {"balance": rows[0]["WALLET_BALANCE"] if rows else 0.0}


def get_transactions(user_id: str) -> list[dict]:
    return run_query(
        """
        SELECT txn_id, challenge_id, txn_type, amount, balance_after,
               description, created_at
        FROM wallet_transactions
        WHERE user_id = %s
        ORDER BY created_at DESC
        LIMIT 100
        """,
        (user_id,),
    )


def get_balance_history(user_id: str) -> list[dict]:
    """Return created_at and balance_after for wallet balance-over-time chart."""
    return run_query(
        """
        SELECT created_at, balance_after
        FROM wallet_transactions
        WHERE user_id = %s
        ORDER BY created_at ASC
        """,
        (user_id,),
    )


def record_transaction(
    conn,
    user_id: str,
    txn_type: str,
    amount: float,
    description: str,
    challenge_id: int | None = None,
) -> float:
    """
    Update wallet balance and insert a transaction record within an open transaction.
    Returns the new balance.
    """
    from database import run_query_in_txn

    run_query_in_txn(
        conn,
        "UPDATE users SET wallet_balance = wallet_balance + %s, "
        "updated_at = CURRENT_TIMESTAMP() WHERE user_id = %s",
        (amount, user_id),
        fetch=False,
    )

    balance_rows = run_query_in_txn(
        conn,
        "SELECT wallet_balance FROM users WHERE user_id = %s",
        (user_id,),
    )
    new_balance = balance_rows[0]["WALLET_BALANCE"]

    run_query_in_txn(
        conn,
        """
        INSERT INTO wallet_transactions
            (user_id, challenge_id, txn_type, amount, balance_after, description)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (user_id, challenge_id, txn_type, amount, new_balance, description),
        fetch=False,
    )
    return new_balance

"""Calendar sync service."""

import json
from pathlib import Path

from fastapi import HTTPException

from database import get_db_type, run_query
from gcalendar.google_calendar import fetch_next_7_days

# #region agent log
def _debug_log(message: str, data: dict) -> None:
    try:
        log_path = Path(__file__).resolve().parent.parent.parent / "debug-185af0.log"
        with open(log_path, "a") as f:
            f.write(
                json.dumps(
                    {
                        "sessionId": "185af0",
                        "location": "gcalendar/service.py",
                        "message": message,
                        "data": data,
                        "hypothesisId": "sync_debug",
                        "timestamp": __import__("time").time_ns() // 1_000_000,
                    }
                )
                + "\n"
            )
    except Exception:
        pass
# #endregion


def sync_calendar(user_id: str) -> list[dict]:
    """Fetch Google Calendar events and upsert into Snowflake."""
    rows = run_query(
        "SELECT google_refresh_token FROM users WHERE user_id = %s",
        (user_id,),
    )
    # #region agent log
    _debug_log(
        "sync_calendar: token check",
        {
            "db_type": get_db_type(),
            "has_rows": bool(rows),
            "has_token": bool(rows and rows[0].get("GOOGLE_REFRESH_TOKEN")),
        },
    )
    # #endregion
    if not rows or not rows[0].get("GOOGLE_REFRESH_TOKEN"):
        # #region agent log
        _debug_log("sync_calendar: no token", {"reason": "no_rows_or_token"})
        # #endregion
        raise HTTPException(status_code=400, detail="No Google refresh token on file")

    encrypted_token = rows[0]["GOOGLE_REFRESH_TOKEN"]
    try:
        events = fetch_next_7_days(encrypted_token)
    except Exception as exc:
        # #region agent log
        _debug_log(
            "sync_calendar: fetch failed",
            {
                "error_type": type(exc).__name__,
                "error_message": str(exc)[:500],
            },
        )
        # #endregion
        raise HTTPException(
            status_code=502, detail=f"Google Calendar fetch failed: {exc}"
        )

    # #region agent log
    _debug_log("sync_calendar: fetch ok, saving events", {"event_count": len(events)})
    # #endregion

    db_type = get_db_type()
    if db_type == "sqlite":
        # SQLite: INSERT ... ON CONFLICT (MERGE not supported)
        sql = """
            INSERT INTO calendar_events (event_id, user_id, title, start_time, end_time, description, location)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT(event_id, user_id) DO UPDATE SET
                title = excluded.title, start_time = excluded.start_time, end_time = excluded.end_time,
                description = excluded.description, location = excluded.location,
                synced_at = datetime('now')
        """
    else:
        # Snowflake: MERGE
        sql = """
            MERGE INTO calendar_events AS tgt
            USING (SELECT %s AS event_id, %s AS user_id, %s AS title,
                          %s::TIMESTAMP_TZ AS start_time, %s::TIMESTAMP_TZ AS end_time,
                          %s AS description, %s AS location) AS src
            ON tgt.event_id = src.event_id AND tgt.user_id = src.user_id
            WHEN MATCHED THEN UPDATE SET
                title = src.title, start_time = src.start_time, end_time = src.end_time,
                description = src.description, location = src.location,
                synced_at = CURRENT_TIMESTAMP()
            WHEN NOT MATCHED THEN INSERT
                (event_id, user_id, title, start_time, end_time, description, location)
            VALUES
                (src.event_id, src.user_id, src.title, src.start_time, src.end_time,
                 src.description, src.location)
        """

    try:
        for ev in events:
            run_query(
                sql,
                (
                    ev["event_id"], user_id, ev["title"],
                    ev["start_time"], ev["end_time"],
                    ev["description"], ev["location"],
                ),
                fetch=False,
            )
    except Exception as exc:
        # #region agent log
        _debug_log(
            "sync_calendar: save events failed",
            {"error_type": type(exc).__name__, "error_message": str(exc)[:500]},
        )
        # #endregion
        raise HTTPException(
            status_code=502, detail=f"Calendar save failed: {exc}"
        )

    return events


def list_events(user_id: str) -> list[dict]:
    return run_query(
        """
        SELECT ce.event_id, ce.title, ce.start_time, ce.end_time,
               ce.description, ce.location,
               sp.prediction_id, sp.predicted_amount, sp.suggested_limit, sp.reasoning_text
        FROM calendar_events ce
        LEFT JOIN spending_predictions sp
            ON sp.event_id = ce.event_id AND sp.user_id = ce.user_id
        WHERE ce.user_id = %s
          AND ce.start_time >= CURRENT_TIMESTAMP()
          AND ce.start_time <= DATEADD('day', 7, CURRENT_TIMESTAMP())
        ORDER BY ce.start_time
        """,
        (user_id,),
    )

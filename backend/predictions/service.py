"""Prediction service: run Cortex for unpredicted events and store results."""

from fastapi import HTTPException

from database import run_query
from predictions.cortex import predict_spending


def _parse_band(text: str) -> float:
    """Map quiz band text to numeric value (best-effort)."""
    if not text:
        return 0.0
    t = str(text).lower()
    import re
    m = re.search(r"(\d+\.?\d*)", t)
    if m:
        return float(m.group(1))
    if "5" in t or "five" in t:
        return 5.0
    if "10" in t or "ten" in t:
        return 10.0
    if "20" in t or "twenty" in t:
        return 20.0
    if "50" in t or "fifty" in t:
        return 50.0
    if "low" in t or "cheap" in t:
        return 5.0
    if "high" in t or "expensive" in t:
        return 30.0
    return 15.0


def _infer_category(title: str) -> str:
    """Infer category from event title."""
    t = (title or "").lower()
    if any(k in t for k in ["coffee", "cafe", "starbucks"]):
        return "COFFEE"
    if any(k in t for k in ["food", "lunch", "dinner", "breakfast", "restaurant", "eat"]):
        return "FOOD"
    if any(k in t for k in ["transport", "uber", "lyft", "car", "bus", "train"]):
        return "TRANSPORT"
    if any(k in t for k in ["movie", "concert", "party", "bar", "club", "entertainment"]):
        return "ENTERTAINMENT"
    return "OTHER"


def _predict_deterministic(
    title: str, lunch_band: str, transport_band: str, going_out_band: str
) -> dict:
    """Deterministic fallback when Cortex unavailable (e.g. SQLite)."""
    avg_lunch = _parse_band(lunch_band) or 15.0
    weekly_transport = _parse_band(transport_band) or 20.0
    eat_out = _parse_band(going_out_band) or 1.0
    if eat_out < 1:
        eat_out = 1.0 + (eat_out * 0.5)
    cat = _infer_category(title)
    transport = weekly_transport / 7.0
    mult = {"FOOD": 1.5, "COFFEE": 0.5, "ENTERTAINMENT": 2.0, "TRANSPORT": 0.3, "OTHER": 1.0}.get(
        cat, 1.0
    )
    food = avg_lunch * mult * eat_out
    pred = min(150.0, max(0.0, food + transport))
    limit = pred * 1.3
    t = (title or "").lower()
    if "birthday" in t or "bday" in t:
        insight = "Birthday events often involve gifts or treats. Estimate based on your spending habits."
    elif cat == "FOOD":
        insight = "Food-related events typically include meal costs. Based on your lunch and eating-out habits."
    elif cat == "COFFEE":
        insight = "Coffee or cafe visits are usually low-cost. Reflects your typical spending."
    elif cat == "ENTERTAINMENT":
        insight = "Entertainment events may involve tickets and extras. Estimate reflects your going-out habits."
    elif cat == "TRANSPORT":
        insight = "Transport costs scaled from your weekly travel spending."
    else:
        insight = "Estimate based on your spending habits and the event type."
    return {
        "predicted_amount": round(pred, 2),
        "suggested_limit": round(limit, 2),
        "reasoning": insight,
    }


def _sanitize_reasoning(reasoning: str | None, title: str) -> str:
    """Replace legacy/internal reasoning with user-friendly insight."""
    if not reasoning:
        return ""
    r = (reasoning or "").strip()
    if "Cortex unavailable" in r or "Deterministic estimate" in r or "OTHER category" in r:
        t = (title or "").lower()
        if "birthday" in t or "bday" in t:
            return "Birthday events often involve gifts or treats. Estimate based on your spending habits."
        return "Estimate based on your spending habits and the event type."
    return r


def get_predictions(user_id: str) -> list[dict]:
    rows = run_query(
        """
        SELECT sp.prediction_id, sp.event_id, sp.predicted_amount,
               sp.suggested_limit, sp.reasoning_text, sp.generated_at,
               ce.title, ce.start_time
        FROM spending_predictions sp
        JOIN calendar_events ce ON ce.event_id = sp.event_id AND ce.user_id = sp.user_id
        WHERE sp.user_id = %s
        ORDER BY ce.start_time
        """,
        (user_id,),
    )
    for r in rows:
        r["REASONING_TEXT"] = _sanitize_reasoning(
            r.get("REASONING_TEXT"), r.get("TITLE") or ""
        )
    return rows


def generate_predictions(user_id: str) -> list[dict]:
    """
    Run Cortex COMPLETE() for every calendar event that lacks a prediction.
    Returns list of newly created prediction records.
    """
    # Get quiz answers
    answers_rows = run_query(
        "SELECT question_key, answer_text FROM quiz_answers WHERE user_id = %s",
        (user_id,),
    )
    if not answers_rows:
        raise HTTPException(
            status_code=400,
            detail="Complete onboarding quiz before generating predictions",
        )
    habits = {r["QUESTION_KEY"]: r["ANSWER_TEXT"] for r in answers_rows}

    # Events without predictions
    events = run_query(
        """
        SELECT ce.event_id, ce.title, ce.start_time, ce.location
        FROM calendar_events ce
        LEFT JOIN spending_predictions sp
            ON sp.event_id = ce.event_id AND sp.user_id = ce.user_id
        WHERE ce.user_id = %s
          AND sp.prediction_id IS NULL
          AND ce.start_time >= CURRENT_TIMESTAMP()
        """,
        (user_id,),
    )

    results = []
    for ev in events:
        try:
            pred = predict_spending(
                title=ev.get("TITLE") or "",
                date=str(ev.get("START_TIME") or ""),
                location=ev.get("LOCATION") or "",
                lunch_last_3=habits.get("lunch_last_3", ""),
                transport_last_week=habits.get("transport_last_week", ""),
                going_out_last_weekend=habits.get("going_out_last_weekend", ""),
            )
        except Exception as exc:
            pred = _predict_deterministic(
                ev.get("TITLE") or "",
                habits.get("lunch_last_3", ""),
                habits.get("transport_last_week", ""),
                habits.get("going_out_last_weekend", ""),
            )

        run_query(
            """
            INSERT INTO spending_predictions
                (user_id, event_id, predicted_amount, suggested_limit, reasoning_text)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                user_id,
                ev["EVENT_ID"],
                float(pred.get("predicted_amount", 0)),
                float(pred.get("suggested_limit", 0)),
                pred.get("reasoning", ""),
            ),
            fetch=False,
        )

        results.append(
            {
                "event_id": ev["EVENT_ID"],
                "TITLE": ev.get("TITLE") or "",
                "START_TIME": ev.get("START_TIME"),
                "predicted_amount": pred.get("predicted_amount"),
                "suggested_limit": pred.get("suggested_limit"),
                "reasoning": pred.get("reasoning"),
            }
        )

    return results


def get_prediction(prediction_id: int, user_id: str) -> dict:
    rows = run_query(
        "SELECT * FROM spending_predictions WHERE prediction_id = %s AND user_id = %s",
        (prediction_id, user_id),
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return rows[0]


def get_prediction_vs_actual(user_id: str) -> list[dict]:
    """
    Return resolved challenges with predicted vs actual spend for charting.
    JOIN predictions + challenges + outcomes; filter by user as initiator or friend.
    """
    return run_query(
        """
        SELECT
            co.resolved_at AS resolved_at,
            sp.predicted_amount AS predicted_amount,
            co.actual_amount_spent AS actual_amount,
            c.challenge_id AS challenge_id,
            ce.title AS event_title
        FROM challenge_outcomes co
        JOIN challenges c ON c.challenge_id = co.challenge_id
        JOIN spending_predictions sp ON sp.prediction_id = c.prediction_id
        JOIN calendar_events ce ON ce.event_id = c.event_id AND ce.user_id = c.initiator_id
        WHERE (c.initiator_id = %s OR c.friend_id = %s)
        ORDER BY co.resolved_at ASC
        """,
        (user_id, user_id),
    )

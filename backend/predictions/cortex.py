"""Snowflake Cortex COMPLETE() wrapper and prompt templates."""

import json
import re

from config import settings
from database import run_query

_SYSTEM_PROMPT = (
    "You are a personal finance assistant. Given a calendar event and the user's "
    "recent spending habits, predict how much money the user is likely to spend. "
    "Respond in valid JSON only."
)


def predict_spending(
    title: str,
    date: str,
    location: str,
    lunch_last_3: str,
    transport_last_week: str,
    going_out_last_weekend: str,
) -> dict:
    """
    Call Snowflake Cortex COMPLETE() and return parsed prediction dict.

    Returns: {predicted_amount, suggested_limit, reasoning}
    """
    user_prompt = (
        f'Event: "{title}", {date}, Location: "{location}"\n'
        f"User habits: lunch_last_3={lunch_last_3}, "
        f"transport_last_week={transport_last_week}, "
        f"going_out_last_weekend={going_out_last_weekend}\n"
        'Respond ONLY as: {"predicted_amount": <number>, "suggested_limit": <number>, '
        '"reasoning": "<1-2 sentences>"}'
    )

    messages = json.dumps(
        [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ]
    )

    # COMPLETE(model, messages, options): options must be present for messages-array format
    model = settings.CORTEX_MODEL or "mistral-large2"
    rows = run_query(
        "SELECT SNOWFLAKE.CORTEX.COMPLETE(%s, PARSE_JSON(%s), PARSE_JSON(%s)) AS response",
        (model, messages, "{}"),
    )

    raw = rows[0]["RESPONSE"] if rows else "{}"

    # Cortex returns a JSON object with choices[0].messages
    try:
        outer = json.loads(raw) if isinstance(raw, str) else raw
        content = outer["choices"][0]["messages"]
    except (KeyError, IndexError, TypeError):
        content = raw if isinstance(raw, str) else str(raw)

    # Extract JSON from content
    match = re.search(r"\{.*\}", content, re.DOTALL)
    if match:
        return json.loads(match.group())

    raise ValueError(f"Could not parse Cortex response: {content}")

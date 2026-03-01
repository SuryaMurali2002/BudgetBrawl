"""Onboarding quiz persistence."""

from database import run_query


def save_quiz_answers(user_id: str, answers: list[dict]) -> None:
    for answer in answers:
        params = (user_id, answer["question_key"], answer["answer_text"])
        run_query(
            """
            MERGE INTO quiz_answers AS tgt
            USING (SELECT %s AS user_id, %s AS question_key, %s AS answer_text) AS src
            ON tgt.user_id = src.user_id AND tgt.question_key = src.question_key
            WHEN MATCHED THEN UPDATE SET answer_text = src.answer_text
            WHEN NOT MATCHED THEN INSERT (user_id, question_key, answer_text)
                VALUES (src.user_id, src.question_key, src.answer_text)
            """,
            params,
            fetch=False,
        )

    run_query(
        "UPDATE users SET onboarding_done = TRUE, updated_at = CURRENT_TIMESTAMP() "
        "WHERE user_id = %s",
        (user_id,),
        fetch=False,
    )


def get_quiz_answers(user_id: str) -> list[dict]:
    return run_query(
        "SELECT question_key, answer_text FROM quiz_answers WHERE user_id = %s",
        (user_id,),
    )

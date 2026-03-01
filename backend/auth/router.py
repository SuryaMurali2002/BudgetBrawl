"""Auth router: Google OAuth flow + /auth/me."""

import httpx

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse

from auth.google_client import authorization_url, build_flow, exchange_code
from auth.jwt_utils import create_token, get_current_user
from config import settings
from database import run_query
from users.service import upsert_user

router = APIRouter(prefix="/auth", tags=["auth"])


def _encrypt_token(token: str) -> str:
    """Fernet-encrypt a refresh token. Returns base64-encoded ciphertext."""
    from cryptography.fernet import Fernet

    key = settings.ENCRYPTION_KEY.encode()
    f = Fernet(key)
    return f.encrypt(token.encode()).decode()


@router.get("/google")
def login_google():
    """Redirect to Google's OAuth consent page."""
    flow = build_flow()
    url, state, code_verifier = authorization_url(flow)
    response = RedirectResponse(url)
    response.set_cookie("oauth_state", state, httponly=True, max_age=300)
    if code_verifier:
        response.set_cookie("code_verifier", code_verifier, httponly=True, max_age=300)
    return response


def _debug_log(msg: str, data: dict):
    import json
    import os
    try:
        log_path = os.path.join(os.path.dirname(__file__), "..", "debug-058dcb.log")
        with open(log_path, "a") as f:
            f.write(json.dumps({"sessionId": "058dcb", "location": "auth/router.py", "message": msg, "data": data, "hypothesisId": "H5", "timestamp": __import__("time").time() * 1000}) + "\n")
    except Exception:
        pass


@router.get("/callback")
async def auth_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
):
    """Exchange Google code, upsert user, issue JWT, redirect to frontend."""
    # #region agent log
    _debug_log("auth_callback reached", {"has_code": code is not None, "has_state": state is not None})
    # #endregion
    if code is None or state is None:
        # #region agent log
        _debug_log("auth_callback fail: missing code/state", {})
        # #endregion
        raise HTTPException(
            status_code=400,
            detail="Missing code or state. This page should only be reached after signing in with Google. Please go to the login page and try again.",
        )
    flow = build_flow(state=state)
    code_verifier = request.cookies.get("code_verifier") or None
    try:
        credentials = exchange_code(flow, code, code_verifier)
    except Exception as exc:
        # #region agent log
        _debug_log("auth_callback fail: exchange_code", {"err": str(exc), "has_code_verifier": bool(code_verifier)})
        # #endregion
        raise HTTPException(status_code=400, detail=f"OAuth exchange failed: {exc}")

    # Fetch user profile
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {credentials.token}"},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch Google profile")

    profile = resp.json()
    try:
        user_id = profile["sub"]
        email = profile["email"]
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Google profile missing required field: {e}") from e
    display_name = profile.get("name", "")
    avatar_url = profile.get("picture", "")

    # Encrypt refresh token before storing
    encrypted_refresh = ""
    if credentials.refresh_token:
        try:
            encrypted_refresh = _encrypt_token(credentials.refresh_token)
        except Exception:
            encrypted_refresh = credentials.refresh_token  # fallback if key not set

    try:
        upsert_user(
            user_id=user_id,
            email=email,
            display_name=display_name,
            avatar_url=avatar_url,
            encrypted_refresh_token=encrypted_refresh,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}") from e

    token = create_token(user_id=user_id, email=email)
    redirect_url = f"{settings.FRONTEND_URL}/auth/callback?token={token}"
    # #region agent log
    _debug_log("OAuth callback success, redirecting", {"redirect_url": redirect_url, "frontend_url": settings.FRONTEND_URL})
    # #endregion
    return RedirectResponse(redirect_url)


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    """Return current user profile + onboarding_done flag."""
    rows = run_query(
        "SELECT user_id, email, display_name, avatar_url, onboarding_done, wallet_balance "
        "FROM users WHERE user_id = %s",
        (current_user["sub"],),
    )
    if not rows:
        raise HTTPException(status_code=404, detail="User not found")
    return rows[0]

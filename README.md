# BudgetBrawl

BudgetBrawl is a hackathon webapp that turns your Google Calendar events into spending predictions and social betting challenges. Log in with Google, answer three spending habit questions, sync your next 7 days of calendar events, and Snowflake Cortex predicts how much you'll spend per event. Then challenge a friend to a $5 virtual bet on whether you'll stay under budget.

## Tech Stack

- **Backend**: FastAPI, Snowflake (database + Cortex LLM), Google OAuth, PyJWT, APScheduler
- **Frontend**: React 18, Vite, React Router v6, TypeScript, Axios
- **AI**: Snowflake Cortex `COMPLETE('mistral-large2', ...)` for spending predictions
- **Auth**: Google OAuth only (no email/password)

## Prerequisites

- Python 3.10+
- Node.js 18+
- A Snowflake account (use `us-west-2` or `us-east-1` region for Cortex availability)
- Google Cloud project with OAuth 2.0 credentials and Calendar API enabled

## Setup

### 1. Snowflake

Run `snowflake_setup.sql` in Snowflake as ACCOUNTADMIN. This creates the database, schema, warehouse, role, and all tables.

The Cortex LLM grant is included in the setup script:

```sql
GRANT DATABASE ROLE SNOWFLAKE.CORTEX_USER TO ROLE BUDGETBRAWL_ROLE;
```

### 2. Google Cloud Console

1. Create a project (or use an existing one).
2. Enable the **Google Calendar API**.
3. Create **OAuth 2.0 Client ID** credentials (Web application type).
4. Add `http://localhost:8000/auth/callback` as an authorized redirect URI.
5. Note your Client ID and Client Secret for the backend `.env`.

### 3. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env` with the variables listed in the Environment Variables section below, then start the server:

```bash
uvicorn main:app --reload --port 8000
```

### 4. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```
VITE_API_BASE_URL=http://localhost:8000
```

Start the dev server:

```bash
npm run dev
```

The frontend runs at `http://localhost:5173`.

## Environment Variables

All backend variables go in `backend/.env`.

| Variable | Description | Default |
|---|---|---|
| `SECRET_KEY` | JWT signing secret (random 32-byte hex) | `change-me-in-production` |
| `JWT_ALGORITHM` | JWT algorithm | `HS256` |
| `JWT_EXPIRY_MINUTES` | Token lifetime in minutes | `1440` (24h) |
| `FRONTEND_URL` | Frontend origin for CORS/redirects | `http://localhost:5173` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | (required) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | (required) |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL | `http://localhost:8000/auth/callback` |
| `SNOWFLAKE_ACCOUNT` | Snowflake account identifier (`<org>-<account>`) | (required) |
| `SNOWFLAKE_USER` | Snowflake login user | (required) |
| `SNOWFLAKE_PASSWORD` | Snowflake login password | (required) |
| `SNOWFLAKE_DATABASE` | Snowflake database name | `BUDGETBRAWL_DB` |
| `SNOWFLAKE_SCHEMA` | Snowflake schema name | `APP` |
| `SNOWFLAKE_WAREHOUSE` | Snowflake warehouse name | `BUDGETBRAWL_WH` |
| `SNOWFLAKE_ROLE` | Snowflake role name | `BUDGETBRAWL_ROLE` |
| `ENCRYPTION_KEY` | Fernet key for encrypting Google refresh tokens | (required) |
| `CORTEX_MODEL` | Snowflake Cortex model name | `mistral-large2` |

Generate `ENCRYPTION_KEY`:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

## Project Structure

```
BudgetBrawl/
├── snowflake_setup.sql        # Snowflake DDL (run as ACCOUNTADMIN)
├── backend/
│   ├── main.py                # FastAPI entrypoint, mounts all routers
│   ├── config.py              # Pydantic BaseSettings from .env
│   ├── database.py            # Snowflake connection + run_query helper
│   ├── scheduler.py           # APScheduler auto-forfeit job
│   ├── auth/                  # Google OAuth + JWT
│   ├── users/                 # User search/upsert
│   ├── onboarding/            # 3-question spending quiz
│   ├── friends/               # Friend requests
│   ├── calendar/              # Google Calendar sync
│   ├── predictions/           # Snowflake Cortex spending predictions
│   ├── challenges/            # Challenge state machine + wallet logic
│   └── wallet/                # Balance + transaction history
└── frontend/
    └── src/
        ├── App.tsx            # Routes + navigation
        ├── api/               # Axios client + per-domain API calls
        ├── contexts/          # AuthContext, WalletContext
        └── pages/             # Login, Onboarding, Dashboard, Friends,
                               # Challenges, Wallet
```

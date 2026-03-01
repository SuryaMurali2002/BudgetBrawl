import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { colors, fonts, fontSize, lineHeight, btnAccent } from "../theme";

const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export default function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // #region agent log
    fetch("http://127.0.0.1:7442/ingest/92e0bf12-cf29-4ffa-90e8-0a9b856a2e52", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "058dcb" },
      body: JSON.stringify({ sessionId: "058dcb", location: "LoginPage.tsx", message: "LoginPage mount", data: { hasUser: !!user }, hypothesisId: "H3", timestamp: Date.now() }),
    }).catch(() => {});
    // #endregion
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: colors.textPrimary,
        fontFamily: fonts.body,
        fontSize: fontSize.body,
        lineHeight: lineHeight.body,
        textAlign: "center",
        padding: "2rem",
      }}
    >
        <h1
          style={{
            fontFamily: fonts.heading,
            fontSize: fontSize.hero,
            marginBottom: "0.5rem",
            fontWeight: 600,
            lineHeight: lineHeight.heading,
            color: colors.textPrimary,
            letterSpacing: "-0.02em",
          }}
        >
          BudgetBrawl
        </h1>
        <p
          style={{
            color: colors.textSecondary,
            marginBottom: "2rem",
            fontSize: fontSize.body,
            fontWeight: 500,
          }}
        >
          Bet your friends you can stay under budget
        </p>
        <a
          href={`${API}/auth/google`}
          className="hover-btn-accent"
          style={{
            ...btnAccent,
            padding: "0.85rem 2rem",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.6rem",
            boxShadow: "0 4px 14px rgba(0, 93, 170, 0.25)",
            borderRadius: "10px",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.616Z"
              fill="currentColor"
            />
            <path
              d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
              fill="currentColor"
            />
            <path
              d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
              fill="currentColor"
            />
            <path
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
              fill="currentColor"
            />
          </svg>
          Sign in with Google
        </a>
    </div>
  );
}

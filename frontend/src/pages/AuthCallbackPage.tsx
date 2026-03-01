import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { colors, fonts, fontSize } from "../theme";

const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export default function AuthCallbackPage() {
  const [params] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get("token");
    const code = params.get("code");
    const state = params.get("state");

    if (token) {
      login(token)
        .then(() => navigate("/dashboard", { replace: true }))
        .catch(() => setError("Could not verify sign-in. The server may be starting up — try again."));
    } else if (code && state) {
      window.location.href = `${API}/auth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
    } else {
      navigate("/login", { replace: true });
    }
  }, [params, login, navigate]);

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          background: colors.pageBg,
          color: colors.textSecondary,
          fontFamily: fonts.body,
          fontSize: fontSize.body,
          textAlign: "center",
        }}
      >
        <span style={{ color: colors.textPrimary }}>{error}</span>
        <Link
          to="/login"
          replace
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            background: colors.accent,
            color: "#1A1A2E",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Try again
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: colors.pageBg,
        color: colors.textSecondary,
        fontFamily: fonts.body,
        fontSize: fontSize.body,
      }}
    >
      Signing you in...
    </div>
  );
}

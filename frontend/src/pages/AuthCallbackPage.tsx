import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { colors, fonts, fontSize } from "../theme";

const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export default function AuthCallbackPage() {
  const [params] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // #region agent log
    const log = (m: string, d: Record<string, unknown>) =>
      fetch("http://127.0.0.1:7442/ingest/92e0bf12-cf29-4ffa-90e8-0a9b856a2e52", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "058dcb" },
        body: JSON.stringify({ sessionId: "058dcb", location: "AuthCallbackPage.tsx", message: m, data: d, timestamp: Date.now() }),
      }).catch(() => {});
    // #endregion
    const token = params.get("token");
    const code = params.get("code");
    const state = params.get("state");
    // #region agent log
    log("AuthCallback params", { hasToken: !!token, hasCode: !!code, hasState: !!state, hypothesisId: "H1" });
    // #endregion
    if (token) {
      login(token).then(() => {
        // #region agent log
        log("login done, navigating to dashboard", { hypothesisId: "H1" });
        // #endregion
        navigate("/dashboard", { replace: true });
      });
    } else if (code && state) {
      // #region agent log
      log("redirecting to backend with code+state", { hypothesisId: "H4" });
      // #endregion
      window.location.href = `${API}/auth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
    } else {
      // #region agent log
      log("no token/code/state, redirecting to login", { hypothesisId: "H1" });
      // #endregion
      navigate("/login", { replace: true });
    }
  }, [params, login, navigate]);

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

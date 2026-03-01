import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getMe } from "../api/auth";

interface User {
  USER_ID: string;
  EMAIL: string;
  DISPLAY_NAME: string;
  AVATAR_URL: string;
  ONBOARDING_DONE: boolean;
  WALLET_BALANCE: number;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    () => {
      const t = localStorage.getItem("token");
      // #region agent log
      fetch("http://127.0.0.1:7442/ingest/92e0bf12-cf29-4ffa-90e8-0a9b856a2e52", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "058dcb" },
        body: JSON.stringify({ sessionId: "058dcb", location: "AuthContext.tsx:init", message: "token from localStorage", data: { hasToken: !!t }, hypothesisId: "H2", timestamp: Date.now() }),
      }).catch(() => {});
      // #endregion
      return t;
    }
  );
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    // #region agent log
    const log = (m: string, d: Record<string, unknown>) =>
      fetch("http://127.0.0.1:7442/ingest/92e0bf12-cf29-4ffa-90e8-0a9b856a2e52", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "058dcb" },
        body: JSON.stringify({ sessionId: "058dcb", location: "AuthContext.tsx", message: m, data: d, hypothesisId: "H2", timestamp: Date.now() }),
      }).catch(() => {});
    // #endregion
    try {
      const data = await getMe();
      setUser(data);
      // #region agent log
      log("refreshUser success", { hasUser: !!data });
      // #endregion
    } catch (e) {
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      // #region agent log
      log("refreshUser failed", { err: String(e) });
      // #endregion
    }
  }, []);

  const login = useCallback(
    async (newToken: string) => {
      localStorage.setItem("token", newToken);
      setToken(newToken);
      await refreshUser();
    },
    [refreshUser]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token, refreshUser]);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

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
    () => localStorage.getItem("token")
  );
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async (throwOnFailure = false) => {
    try {
      const data = await getMe();
      setUser(data);
    } catch (e) {
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      if (throwOnFailure) throw e;
    }
  }, []);

  const login = useCallback(
    async (newToken: string) => {
      localStorage.setItem("token", newToken);
      setToken(newToken);
      await refreshUser(true);
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

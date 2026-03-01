import { Navigate, useLocation, useRoutes } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "./contexts/AuthContext";
import { colors, fonts, fontSize, lineHeight } from "./theme";
import LoadingSpinner from "./components/LoadingSpinner";
import RainbowBackground from "./components/RainbowBackground";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import ChallengePage from "./pages/ChallengePage";
import ChallengesListPage from "./pages/ChallengesListPage";
import NewChallengePage from "./pages/NewChallengePage";
import DashboardPage from "./pages/DashboardPage";
import FriendsPage from "./pages/FriendsPage";
import LoginPage from "./pages/LoginPage";
import OnboardingPage from "./pages/OnboardingPage";
import WalletPage from "./pages/WalletPage";

function Nav() {
  const { user, logout } = useAuth();
  const loc = useLocation();

  const navLink = (to: string, label: string) => (
    <a
      href={to}
      className="hover-nav-link"
      style={{
        color: loc.pathname === to ? colors.primary : colors.textSecondary,
        textDecoration: "none",
        fontWeight: loc.pathname === to ? 600 : 500,
        fontSize: fontSize.bodySmall,
      }}
    >
      {label}
    </a>
  );

  if (!user) return null;
  return (
    <nav
      style={{
        background: "rgba(255, 255, 255, 0.12)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        padding: "0.75rem 1.5rem",
        display: "flex",
        gap: "1.5rem",
        alignItems: "center",
        borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
      }}
    >
      <a href="/dashboard" className="nav-logo-link" style={{ marginRight: "auto", display: "flex", alignItems: "center", textDecoration: "none", overflow: "visible" }}>
        <img src="/BudgetBrawl.png" alt="Budget Brawl" style={{ height: "64px", width: "auto", objectFit: "contain", transform: "scale(1.4)", transformOrigin: "center center" }} />
      </a>
      {navLink("/dashboard", "Dashboard")}
      {navLink("/friends", "Friends")}
      {navLink("/challenges", "Challenges")}
      {navLink("/wallet", "Wallet")}
      <button
        type="button"
        onClick={logout}
        className="hover-ghost"
        style={{
          padding: "0.35rem 0.75rem",
          borderRadius: "8px",
          border: "1px solid rgba(255, 255, 255, 0.35)",
          background: "rgba(255, 255, 255, 0.08)",
          color: colors.textPrimary,
          cursor: "pointer",
          fontSize: fontSize.bodySmall,
          fontWeight: 500,
          transition: "color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease",
        }}
      >
        Sign out
      </button>
    </nav>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          color: colors.textPrimary,
          fontFamily: fonts.body,
          fontSize: fontSize.body,
          lineHeight: lineHeight.body,
        }}
      >
        <LoadingSpinner size="lg" />
        <span>Loading...</span>
      </div>
    );

  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />;

  if (!user.ONBOARDING_DONE && loc.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

const pageTransition = {
  initial: { opacity: 0, x: 10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 },
  transition: { duration: 0.2, ease: "easeInOut" },
};

function RoutesConfig() {
  const location = useLocation();
  const element = useRoutes([
    { path: "/login", element: <LoginPage /> },
    { path: "/auth/callback", element: <AuthCallbackPage /> },
    {
      path: "/onboarding",
      element: (
        <ProtectedRoute>
          <OnboardingPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/dashboard",
      element: (
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/friends",
      element: (
        <ProtectedRoute>
          <FriendsPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/challenges",
      element: (
        <ProtectedRoute>
          <ChallengesListPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/challenges/new",
      element: (
        <ProtectedRoute>
          <NewChallengePage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/challenges/:id",
      element: (
        <ProtectedRoute>
          <ChallengePage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/wallet",
      element: (
        <ProtectedRoute>
          <WalletPage />
        </ProtectedRoute>
      ),
    },
    { path: "*", element: <Navigate to="/dashboard" replace /> },
  ]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={pageTransition.initial}
        animate={pageTransition.animate}
        exit={pageTransition.exit}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {element}
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <RainbowBackground />
      <div style={{ position: "relative", zIndex: 1 }}>
        <Nav />
        <RoutesConfig />
      </div>
    </div>
  );
}

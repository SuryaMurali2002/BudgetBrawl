import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
} from "recharts";
import { syncCalendar } from "../api/calendar";
import { generatePredictions, getPredictions, getPredictionVsActual } from "../api/predictions";
import { getWinLossStats } from "../api/challenges";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "../contexts/WalletContext";
import { colors, fonts, fontSize, lineHeight, pageStyle, cardStyle, btnPrimary, btnSecondary, linkStyle } from "../theme";

type WinLossStats = {
  wins: number;
  losses: number;
  total_won: number;
  total_lost: number;
  win_rate: number | null;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { balance, refresh: refreshWallet } = useWallet();
  const [predictions, setPredictions] = useState<any[]>([]);
  const [vsActual, setVsActual] = useState<any[]>([]);
  const [winLossStats, setWinLossStats] = useState<WinLossStats | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getPredictions().then(setPredictions).catch(() => {});
    getPredictionVsActual().then(setVsActual).catch(() => {});
    getWinLossStats().then(setWinLossStats).catch(() => {});
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setMsg("");
    try {
      const res = await syncCalendar();
      setMsg(`Synced ${res.synced} event(s) from Google Calendar.`);
    } catch (e: any) {
      setMsg(e.response?.data?.detail ?? "Sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setMsg("");
    try {
      const res = await generatePredictions();
      setPredictions((p) => [...p, ...res.predictions]);
      setMsg(`Generated ${res.generated} new prediction(s).`);
    } catch (e: any) {
      setMsg(e.response?.data?.detail ?? "Generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={pageStyle}>
      <h1 style={{ fontFamily: fonts.heading, fontSize: fontSize.hero, fontWeight: 600, lineHeight: lineHeight.heading, marginBottom: "0.25rem" }}>
        Welcome, {user?.DISPLAY_NAME ?? user?.EMAIL}
      </h1>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <div className="hover-card" style={{ ...cardStyle, flex: 1, minWidth: "160px" }}>
          <div style={{ fontSize: fontSize.bodySmall, color: colors.textSecondary, fontWeight: 500 }}>Wallet</div>
          <div style={{ fontSize: fontSize.display, fontWeight: 600, color: colors.green, lineHeight: lineHeight.tight }}>
            ${balance?.toFixed(2) ?? "---"}
          </div>
          <Link to="/wallet" className="hover-link" style={linkStyle}>
            View transactions
          </Link>
        </div>
        <div className="hover-card" style={{ ...cardStyle, flex: 1, minWidth: "160px" }}>
          <div style={{ fontSize: fontSize.bodySmall, color: colors.textSecondary, fontWeight: 500 }}>
            Predictions
          </div>
          <div style={{ fontSize: fontSize.display, fontWeight: 600, lineHeight: lineHeight.tight }}>
            {predictions.length}
          </div>
          <Link to="/challenges" className="hover-link" style={linkStyle}>
            View challenges
          </Link>
        </div>
        {winLossStats && (winLossStats.wins > 0 || winLossStats.losses > 0) && (
          <div className="hover-card" style={{ ...cardStyle, flex: 1, minWidth: "180px" }}>
            <div style={{ fontSize: fontSize.bodySmall, color: colors.textSecondary, fontWeight: 500 }}>Win / Loss</div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <div style={{ fontSize: fontSize.body, fontWeight: 600, lineHeight: lineHeight.tight }}>
                <span style={{ color: colors.green }}>{winLossStats.wins}W</span>
                <span style={{ color: colors.textSecondary, margin: "0 0.25rem" }}>/</span>
                <span style={{ color: colors.coral }}>{winLossStats.losses}L</span>
              </div>
              {winLossStats.win_rate != null && (
                <span style={{ fontSize: fontSize.bodySmall, color: colors.textSecondary }}>
                  {winLossStats.win_rate}% win rate
                </span>
              )}
            </div>
            <div style={{ fontSize: fontSize.bodySmall, color: colors.textSecondary, marginTop: "0.25rem" }}>
              +${winLossStats.total_won.toFixed(2)} / −${winLossStats.total_lost.toFixed(2)}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
        <button onClick={handleSync} disabled={syncing} className="hover-btn-secondary" style={btnSecondary}>
          {syncing ? "Syncing..." : "Sync Calendar"}
        </button>
        <button onClick={handleGenerate} disabled={generating} className="hover-btn-primary" style={btnPrimary}>
          {generating ? "Generating..." : "Generate Predictions"}
        </button>
      </div>

      {msg && (
        <p style={{ color: colors.primary, marginBottom: "1rem", fontSize: fontSize.bodySmall, fontWeight: 500 }}>{msg}</p>
      )}

      {winLossStats && (winLossStats.wins > 0 || winLossStats.losses > 0) && (
        <>
          <h2 style={{ fontFamily: fonts.heading, fontSize: fontSize.h2, fontWeight: 600, lineHeight: lineHeight.heading, marginBottom: "0.5rem" }}>Win / Loss</h2>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            <div className="hover-card" style={{ ...cardStyle, minWidth: "200px" }}>
              <div style={{ fontSize: fontSize.bodySmall, color: colors.textSecondary, marginBottom: "0.5rem" }}>Challenges resolved</div>
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Wins", value: winLossStats.wins, fill: colors.green },
                      { name: "Losses", value: winLossStats.losses, fill: colors.coral },
                    ].filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={56}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}`}
                  />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {vsActual.length > 0 && (
        <>
          <h2 style={{ fontFamily: fonts.heading, fontSize: fontSize.h2, fontWeight: 600, lineHeight: lineHeight.heading, marginBottom: "0.5rem" }}>Prediction vs Actual</h2>
          <div className="hover-card" style={{ ...cardStyle, marginBottom: "1.5rem", overflow: "auto" }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={vsActual.map((r: any) => {
                  const resolved = r.RESOLVED_AT || r.resolved_at;
                  return {
                    name: resolved ? new Date(resolved).toLocaleDateString() : `#${r.CHALLENGE_ID ?? r.challenge_id}`,
                    eventTitle: r.EVENT_TITLE || r.event_title || "",
                    predicted: Number(r.PREDICTED_AMOUNT ?? r.predicted_amount ?? 0),
                    actual: Number(r.ACTUAL_AMOUNT ?? r.actual_amount ?? 0),
                  };
                })}
                margin={{ top: 12, right: 12, left: 8, bottom: 24 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="rgba(255,255,255,0.6)" />
                <YAxis tick={{ fontSize: 11 }} stroke="rgba(255,255,255,0.6)" tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(v) => [`$${Number(v ?? 0).toFixed(2)}`]}
                  contentStyle={{ background: "rgba(26,26,46,0.9)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8 }}
                  labelFormatter={(_, payload) => (payload[0]?.payload?.eventTitle as string) || ""}
                />
                <Legend />
                <Bar dataKey="predicted" name="Predicted" fill={colors.primary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Actual" fill={colors.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <h2 style={{ fontFamily: fonts.heading, fontSize: fontSize.h2, fontWeight: 600, lineHeight: lineHeight.heading }}>Upcoming Events & Predictions</h2>
      {predictions.length === 0 ? (
        <p style={{ color: colors.textSecondary, fontSize: fontSize.body }}>
          No predictions yet. Sync your calendar and generate predictions.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {predictions.map((p: any) => (
            <div key={p.PREDICTION_ID ?? p.event_id} className="hover-card" style={cardStyle}>
              <div style={{ fontWeight: 600, fontSize: fontSize.body, color: colors.textPrimary }}>
                {p.TITLE ?? p.event_id}
              </div>
              <div style={{ color: colors.textSecondary, fontSize: fontSize.bodySmall }}>
                {p.START_TIME
                  ? new Date(p.START_TIME).toLocaleString()
                  : ""}
              </div>
              <div style={{ marginTop: "0.4rem", fontSize: fontSize.body }}>
                Predicted:{" "}
                <strong style={{ color: colors.green, fontWeight: 600 }}>
                  ${(p.PREDICTED_AMOUNT ?? p.predicted_amount ?? 0).toFixed(2)}
                </strong>
                {(p.SUGGESTED_LIMIT ?? p.suggested_limit) && (
                  <>
                    {" "} · Suggested limit:{" "}
                    <strong style={{ color: colors.orange, fontWeight: 600 }}>
                      ${(p.SUGGESTED_LIMIT ?? p.suggested_limit).toFixed(2)}
                    </strong>
                  </>
                )}
              </div>
              {(p.REASONING_TEXT ?? p.reasoning) && (
                <p
                  style={{
                    color: colors.textSecondary,
                    fontSize: fontSize.bodySmall,
                    lineHeight: lineHeight.body,
                    marginTop: "0.25rem",
                  }}
                >
                  {p.REASONING_TEXT ?? p.reasoning}
                </p>
              )}
              <Link
                to={`/challenges/new?predictionId=${p.PREDICTION_ID ?? p.prediction_id}`}
                className="hover-link"
                style={{ ...linkStyle, marginTop: "0.4rem", display: "block" }}
              >
                Create a challenge
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

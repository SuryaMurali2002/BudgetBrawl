import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getChallenge, reportSpend } from "../api/challenges";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "../contexts/WalletContext";
import { colors, fonts, fontSize, lineHeight, pageStyle, cardStyle, inputStyle, btnPrimary } from "../theme";
import LoadingSpinner from "../components/LoadingSpinner";

export default function ChallengePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { refresh: refreshWallet } = useWallet();
  const [challenge, setChallenge] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) getChallenge(Number(id)).then(setChallenge).catch(() => {});
  }, [id]);

  if (!challenge)
    return (
      <div style={{ ...pageStyle, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", color: colors.textSecondary, fontSize: fontSize.body }}>
        <LoadingSpinner size="md" />
        <span>Loading...</span>
      </div>
    );

  const isInitiator = challenge.INITIATOR_ID === user?.USER_ID;
  const canReport =
    challenge.STATUS === "pending_report" && isInitiator;

  const handleReport = async () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val < 0) {
      setError("Enter a valid amount.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await reportSpend(Number(id), val);
      setResult(res);
      setChallenge((c: any) => ({ ...c, STATUS: "resolved" }));
      refreshWallet();
    } catch (e: any) {
      setError(e.response?.data?.detail ?? "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ ...pageStyle, maxWidth: "600px" }}>
      <h1 style={{ fontFamily: fonts.heading, fontSize: fontSize.h1, fontWeight: 600, lineHeight: lineHeight.heading }}>{challenge.EVENT_TITLE ?? challenge.EVENT_ID}</h1>
      <p style={{ color: colors.textSecondary, fontSize: fontSize.bodySmall }}>
        {challenge.START_TIME
          ? new Date(challenge.START_TIME).toLocaleString()
          : ""}
        {challenge.END_TIME
          ? ` – ${new Date(challenge.END_TIME).toLocaleString()}`
          : ""}
      </p>

      <div className="hover-card" style={{ ...cardStyle, marginTop: "1rem", padding: "1rem 1.25rem" }}>
        <Row label="Status" value={challenge.STATUS?.replace(/_/g, " ")} />
        <Row label="Initiator" value={challenge.INITIATOR_NAME} />
        <Row label="Friend" value={challenge.FRIEND_NAME} />
        <Row
          label="Spend limit"
          value={`$${(challenge.SPEND_LIMIT ?? 0).toFixed(2)}`}
        />
        <Row
          label="Stake per side"
          value={`$${(challenge.STAKE_PER_SIDE ?? 5).toFixed(2)}`}
        />
        {challenge.REPORT_DEADLINE && (
          <Row
            label="Report deadline"
            value={new Date(challenge.REPORT_DEADLINE).toLocaleString()}
          />
        )}
      </div>

      {result && (
        <div
          style={{
            background: result.winner_id === user?.USER_ID ? "#E8F5E9" : "#FFEBEE",
            borderRadius: "16px",
            padding: "1rem 1.25rem",
            marginTop: "1rem",
            color: result.winner_id === user?.USER_ID ? "#2E7D32" : "#C62828",
            fontWeight: 600,
            fontSize: fontSize.body,
          }}
        >
          {result.winner_id === user?.USER_ID
            ? `You won $${result.pot}!`
            : `You lost. Better luck next time.`}
        </div>
      )}

      {canReport && !result && (
        <div style={{ marginTop: "1.5rem" }}>
          <h2 style={{ fontFamily: fonts.heading, fontSize: fontSize.h2, fontWeight: 600, lineHeight: lineHeight.heading }}>Report Actual Spend</h2>
          <p style={{ color: colors.textSecondary, fontSize: fontSize.bodySmall }}>
            Enter what you actually spent at this event.
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              style={{ ...inputStyle, flex: 1, width: "auto" }}
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 42.50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button type="button" onClick={handleReport} disabled={submitting} className="hover-btn-primary" style={btnPrimary}>
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
          {error && <p style={{ color: colors.coral, marginTop: "0.5rem", fontSize: fontSize.bodySmall }}>{error}</p>}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "0.45rem 0",
        borderBottom: `1px solid ${colors.borderLight}`,
      }}
    >
      <span style={{ color: colors.textSecondary, fontSize: fontSize.bodySmall }}>{label}</span>
      <span style={{ fontWeight: 500, fontSize: fontSize.body }}>{value}</span>
    </div>
  );
}

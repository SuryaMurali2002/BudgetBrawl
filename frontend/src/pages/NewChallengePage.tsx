import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getFriends } from "../api/friends";
import { getPredictions } from "../api/predictions";
import { createChallenge } from "../api/challenges";
import { colors, fonts, fontSize, lineHeight, pageStyle, selectStyle, inputStyle, btnPrimary, labelStyle } from "../theme";

export default function NewChallengePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const predictionIdFromUrl = searchParams.get("predictionId");
  const [friends, setFriends] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [friendId, setFriendId] = useState("");
  const [predictionIdx, setPredictionIdx] = useState<number>(-1);
  const [spendLimit, setSpendLimit] = useState("");
  const [stake, setStake] = useState("5.00");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getFriends().then(setFriends).catch(() => {});
    getPredictions().then(setPredictions).catch(() => {});
  }, []);

  useEffect(() => {
    if (predictionIdFromUrl && predictions.length > 0 && predictionIdx === -1) {
      const idx = predictions.findIndex(
        (p: any) => String(p.PREDICTION_ID ?? p.prediction_id) === predictionIdFromUrl
      );
      if (idx >= 0) setPredictionIdx(idx);
    }
  }, [predictions, predictionIdFromUrl]);

  const selectedPrediction = predictionIdx >= 0 ? predictions[predictionIdx] : null;

  useEffect(() => {
    if (selectedPrediction) {
      setSpendLimit(
        (selectedPrediction.SUGGESTED_LIMIT ?? selectedPrediction.suggested_limit ?? "").toString()
      );
    }
  }, [predictionIdx]);

  const handleSubmit = async () => {
    if (!friendId) {
      setError("Select a friend to challenge.");
      return;
    }
    if (!selectedPrediction) {
      setError("Select an event.");
      return;
    }
    const limit = parseFloat(spendLimit);
    if (isNaN(limit) || limit <= 0) {
      setError("Enter a valid spend limit.");
      return;
    }
    const stakeVal = parseFloat(stake);
    if (isNaN(stakeVal) || stakeVal <= 0) {
      setError("Enter a valid stake amount.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await createChallenge({
        friend_id: friendId,
        prediction_id: selectedPrediction.PREDICTION_ID ?? selectedPrediction.prediction_id,
        event_id: selectedPrediction.EVENT_ID ?? selectedPrediction.event_id,
        spend_limit: limit,
        stake_per_side: stakeVal,
      });
      navigate("/challenges");
    } catch (e: any) {
      setError(e.response?.data?.detail ?? "Failed to create challenge.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ ...pageStyle, maxWidth: "600px" }}>
      <h1 style={{ fontFamily: fonts.heading, fontSize: fontSize.h1, fontWeight: 600, lineHeight: lineHeight.heading }}>New Challenge</h1>

      <label style={labelStyle}>Event</label>
      <select
        style={selectStyle}
        value={predictionIdx}
        onChange={(e) => setPredictionIdx(Number(e.target.value))}
      >
        <option value={-1}>Select an event...</option>
        {predictions.map((p: any, i: number) => (
          <option key={p.PREDICTION_ID ?? p.event_id ?? i} value={i}>
            {p.TITLE ?? p.EVENT_TITLE ?? p.event_id} —{" "}
            {p.START_TIME ? new Date(p.START_TIME).toLocaleDateString() : ""} · Predicted $
            {(p.PREDICTED_AMOUNT ?? p.predicted_amount ?? 0).toFixed(2)}
          </option>
        ))}
      </select>

      <label style={labelStyle}>Challenge a Friend</label>
      <select
        style={selectStyle}
        value={friendId}
        onChange={(e) => setFriendId(e.target.value)}
      >
        <option value="">Select a friend...</option>
        {friends.map((f: any) => (
          <option key={f.USER_ID} value={f.USER_ID}>
            {f.DISPLAY_NAME ?? f.EMAIL}
          </option>
        ))}
      </select>

      <label style={labelStyle}>Spend Limit ($)</label>
      <input
        style={inputStyle}
        type="number"
        min="0"
        step="0.01"
        placeholder="e.g. 25.00"
        value={spendLimit}
        onChange={(e) => setSpendLimit(e.target.value)}
      />

      <label style={labelStyle}>Stake per Side ($)</label>
      <input
        style={inputStyle}
        type="number"
        min="0"
        step="0.01"
        placeholder="5.00"
        value={stake}
        onChange={(e) => setStake(e.target.value)}
      />

      {error && <p style={{ color: colors.coral, marginTop: "0.5rem", fontSize: fontSize.bodySmall }}>{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="hover-btn-primary"
        style={{ ...btnPrimary, marginTop: "1.25rem", width: "100%", opacity: submitting ? 0.6 : 1 }}
      >
        {submitting ? "Creating..." : "Create Challenge"}
      </button>
    </div>
  );
}

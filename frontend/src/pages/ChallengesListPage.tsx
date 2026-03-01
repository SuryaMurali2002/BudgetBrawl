import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  acceptChallenge,
  declineChallenge,
  getChallenges,
} from "../api/challenges";
import { useAuth } from "../contexts/AuthContext";
import { colors, fonts, fontSize, lineHeight, pageStyle, cardStyle, btnPrimary, btnSmall, linkStyle } from "../theme";

const STATUS_COLOR: Record<string, string> = {
  pending_friend: colors.orange,
  active: colors.green,
  pending_report: "#E8B612",
  resolved: colors.primary,
  auto_forfeited: colors.coral,
  declined: colors.textMuted,
};

export default function ChallengesListPage() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<any[]>([]);

  const reload = () =>
    getChallenges().then(setChallenges).catch(() => {});

  useEffect(() => {
    reload();
  }, []);

  const handleAccept = async (id: number) => {
    await acceptChallenge(id);
    reload();
  };

  const handleDecline = async (id: number) => {
    await declineChallenge(id);
    reload();
  };

  return (
    <div style={pageStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ fontFamily: fonts.heading, fontSize: fontSize.h1, fontWeight: 600, lineHeight: lineHeight.heading }}>Challenges</h1>
        <Link to="/challenges/new" className="hover-btn-primary" style={{ ...btnPrimary, textDecoration: "none", padding: "0.5rem 1rem" } as React.CSSProperties}>
          + New Challenge
        </Link>
      </div>

      {challenges.length === 0 ? (
        <p style={{ color: colors.textSecondary, fontSize: fontSize.body }}>
          No challenges yet. Create one from the Dashboard.
        </p>
      ) : (
        challenges.map((c: any) => {
          const isInitiator = c.INITIATOR_ID === user?.USER_ID;
          const isFriend = c.FRIEND_ID === user?.USER_ID;
            return (
            <div key={c.CHALLENGE_ID} className="hover-card" style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, fontSize: fontSize.body }}>
                    {c.EVENT_TITLE ?? c.EVENT_ID}
                  </span>{" "}
                  <span style={{ color: colors.textSecondary, fontSize: fontSize.bodySmall }}>
                    {c.START_TIME
                      ? new Date(c.START_TIME).toLocaleDateString()
                      : ""}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: fontSize.caption,
                    fontWeight: 600,
                    color: STATUS_COLOR[c.STATUS] ?? colors.textSecondary,
                    textTransform: "uppercase",
                  }}
                >
                  {c.STATUS?.replace(/_/g, " ")}
                </span>
              </div>

              <div style={{ color: colors.textSecondary, fontSize: fontSize.bodySmall, marginTop: "0.25rem" }}>
                {isInitiator ? "You challenged" : c.INITIATOR_NAME} vs{" "}
                {isFriend ? "you" : c.FRIEND_NAME} · Limit $
                {(c.SPEND_LIMIT ?? 0).toFixed(2)} · Stake $
                {(c.STAKE_PER_SIDE ?? 5).toFixed(2)} each
              </div>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                <Link to={`/challenges/${c.CHALLENGE_ID}`} className="hover-link" style={{ ...linkStyle, padding: "0.35rem 0.75rem", borderRadius: "8px", background: colors.inputBg }}>
                  Details
                </Link>

                {c.STATUS === "pending_friend" && isFriend && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAccept(c.CHALLENGE_ID)}
                      className="hover-btn-small"
                      style={{ ...btnSmall, background: colors.green }}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecline(c.CHALLENGE_ID)}
                      className="hover-btn-small"
                      style={{ ...btnSmall, background: colors.coral }}
                    >
                      Decline
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

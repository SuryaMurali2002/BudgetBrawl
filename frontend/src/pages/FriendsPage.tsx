import { useEffect, useState } from "react";
import {
  acceptRequest,
  declineRequest,
  getFriends,
  getPending,
  sendRequest,
} from "../api/friends";
import { colors, fonts, fontSize, lineHeight, pageStyle, cardStyle, inputStyle, btnPrimary, btnSmall } from "../theme";

export default function FriendsPage() {
  const [friends, setFriends] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const reload = () => {
    getFriends().then(setFriends).catch(() => {});
    getPending().then(setPending).catch(() => {});
  };

  useEffect(() => {
    reload();
  }, []);

  const handleAdd = async () => {
    if (!email.trim()) return;
    try {
      await sendRequest(email.trim());
      setMsg(`Friend request sent to ${email}.`);
      setEmail("");
    } catch (e: any) {
      setMsg(e.response?.data?.detail ?? "Failed.");
    }
  };

  const handleAccept = async (id: number) => {
    await acceptRequest(id);
    reload();
  };

  const handleDecline = async (id: number) => {
    await declineRequest(id);
    reload();
  };

  return (
    <div style={pageStyle}>
      <h1 style={{ fontFamily: fonts.heading, fontSize: fontSize.h1, fontWeight: 600, lineHeight: lineHeight.heading }}>Friends</h1>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          style={{ ...inputStyle, flex: 1, width: "auto" }}
          placeholder="friend@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button type="button" onClick={handleAdd} className="hover-btn-primary" style={btnPrimary}>
          Add Friend
        </button>
      </div>
      {msg && <p style={{ color: colors.primary, fontSize: fontSize.bodySmall, fontWeight: 500 }}>{msg}</p>}

      {pending.length > 0 && (
        <>
          <h2 style={{ fontFamily: fonts.heading, fontSize: fontSize.h2, fontWeight: 600, lineHeight: lineHeight.heading }}>Pending Requests</h2>
          {pending.map((p: any) => (
            <div key={p.FRIENDSHIP_ID} className="hover-card" style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, fontSize: fontSize.body }}>{p.DISPLAY_NAME ?? p.EMAIL}</span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => handleAccept(p.FRIENDSHIP_ID)}
                  className="hover-btn-small"
                  style={{ ...btnSmall, background: colors.green }}
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => handleDecline(p.FRIENDSHIP_ID)}
                  className="hover-btn-small"
                  style={{ ...btnSmall, background: colors.coral }}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      <h2 style={{ fontFamily: fonts.heading, fontSize: fontSize.h2, fontWeight: 600, lineHeight: lineHeight.heading }}>My Friends ({friends.length})</h2>
      {friends.length === 0 ? (
        <p style={{ color: colors.textSecondary, fontSize: fontSize.body }}>No friends yet. Add someone!</p>
      ) : (
        friends.map((f: any) => (
          <div key={f.FRIENDSHIP_ID} className="hover-card" style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: fontSize.body }}>{f.DISPLAY_NAME ?? f.EMAIL}</div>
              <div style={{ color: colors.textSecondary, fontSize: fontSize.bodySmall }}>
                {f.EMAIL}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

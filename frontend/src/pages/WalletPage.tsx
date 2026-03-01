import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getBalanceHistory } from "../api/wallet";
import { useWallet } from "../contexts/WalletContext";
import { colors, fonts, fontSize, lineHeight, pageStyle, cardStyle, btnSecondary } from "../theme";

export default function WalletPage() {
  const { balance, transactions, refresh } = useWallet();
  const [balanceHistory, setBalanceHistory] = useState<{ date: string; balance: number }[]>([]);

  useEffect(() => {
    getBalanceHistory()
      .then((rows: any[]) => {
        setBalanceHistory(
          rows.map((r: any) => ({
            date: r.CREATED_AT || r.created_at
              ? new Date(r.CREATED_AT || r.created_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })
              : "",
            balance: Number(r.BALANCE_AFTER ?? r.balance_after ?? 0),
          }))
        );
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ ...pageStyle, maxWidth: "600px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ fontFamily: fonts.heading, fontSize: fontSize.h1, fontWeight: 600, lineHeight: lineHeight.heading }}>Wallet</h1>
        <button type="button" onClick={refresh} className="hover-btn-secondary" style={btnSecondary}>
          Refresh
        </button>
      </div>

      <div
        className="hover-card"
        style={{
          ...cardStyle,
          textAlign: "center",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ color: colors.textSecondary, fontSize: fontSize.bodySmall, fontWeight: 500 }}>
          Virtual Balance
        </div>
        <div style={{ fontSize: fontSize.display, fontWeight: 600, lineHeight: lineHeight.tight, color: colors.green }}>
          ${balance?.toFixed(2) ?? "---"}
        </div>
      </div>

      {balanceHistory.length > 0 && (
        <>
          <h2 style={{ fontFamily: fonts.heading, fontSize: fontSize.h2, fontWeight: 600, lineHeight: lineHeight.heading, marginBottom: "0.5rem" }}>
            Balance over time
          </h2>
          <div className="hover-card" style={{ ...cardStyle, marginBottom: "1.5rem", overflow: "auto" }}>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={balanceHistory} margin={{ top: 12, right: 12, left: 8, bottom: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="rgba(255,255,255,0.6)" />
                <YAxis tick={{ fontSize: 11 }} stroke="rgba(255,255,255,0.6)" tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(v) => [`$${Number(v ?? 0).toFixed(2)}`, "Balance"]}
                  contentStyle={{ background: "rgba(26,26,46,0.9)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8 }}
                />
                <Line type="monotone" dataKey="balance" stroke={colors.green} strokeWidth={2} dot={{ fill: colors.green }} name="Balance" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <h2 style={{ fontFamily: fonts.heading, fontSize: fontSize.h2, fontWeight: 600, lineHeight: lineHeight.heading }}>Transaction History</h2>
      {(transactions as any[]).length === 0 ? (
        <p style={{ color: colors.textSecondary, fontSize: fontSize.body }}>No transactions yet.</p>
      ) : (
        (transactions as any[]).map((t: any) => (
          <div key={t.TXN_ID} className="hover-card" style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: fontSize.body }}>
              <span style={{ fontWeight: 600 }}>
                {t.TXN_TYPE?.replace(/_/g, " ")}
              </span>
              <span
                style={{
                  fontWeight: 600,
                  color: t.AMOUNT >= 0 ? colors.green : colors.coral,
                }}
              >
                {t.AMOUNT >= 0 ? "+" : ""}
                ${Math.abs(t.AMOUNT).toFixed(2)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: fontSize.bodySmall,
                color: colors.textSecondary,
                marginTop: "0.2rem",
              }}
            >
              <span>{t.DESCRIPTION}</span>
              <span>Balance: ${t.BALANCE_AFTER?.toFixed(2)}</span>
            </div>
            <div style={{ fontSize: fontSize.caption, color: colors.textMuted, marginTop: "0.1rem" }}>
              {t.CREATED_AT ? new Date(t.CREATED_AT).toLocaleString() : ""}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitQuiz } from "../api/onboarding";
import { useAuth } from "../contexts/AuthContext";
import { colors, fonts, fontSize, lineHeight, btnPrimary, inputStyle, cardStyle } from "../theme";

const QUESTIONS = [
  {
    key: "lunch_last_3",
    label: "How much did you spend on lunch in your last 3 outings?",
    placeholder: "e.g. $12, $8, $15",
  },
  {
    key: "transport_last_week",
    label: "How much did you spend on transport last week?",
    placeholder: "e.g. $35 on Uber",
  },
  {
    key: "going_out_last_weekend",
    label: "How much did you spend going out last weekend?",
    placeholder: "e.g. $60 at dinner + drinks",
  },
];

export default function OnboardingPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const q = QUESTIONS[step];

  const handleNext = async () => {
    if (!answers[q.key]?.trim()) return;
    if (step < QUESTIONS.length - 1) {
      setStep((s) => s + 1);
    } else {
      setLoading(true);
      try {
        await submitQuiz(
          QUESTIONS.map((q) => ({
            question_key: q.key,
            answer_text: answers[q.key] ?? "",
          }))
        );
        await refreshUser();
        navigate("/dashboard", { replace: true });
      } catch (e) {
        alert("Failed to save answers. Try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.pageBg,
        color: colors.textPrimary,
        fontFamily: fonts.body,
        fontSize: fontSize.body,
        lineHeight: lineHeight.body,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <h1 style={{ fontFamily: fonts.heading, fontSize: fontSize.h1, fontWeight: 600, lineHeight: lineHeight.heading, marginBottom: "0.5rem" }}>Tell us about your habits</h1>
      <p style={{ color: colors.textSecondary, marginBottom: "2rem", fontSize: fontSize.bodySmall }}>
        Step {step + 1} of {QUESTIONS.length}
      </p>

      <div
        style={{
          ...cardStyle,
          borderRadius: "20px",
          padding: "2rem",
          width: "100%",
          maxWidth: "480px",
          marginBottom: 0,
        }}
      >
        <label
          style={{
            display: "block",
            marginBottom: "0.75rem",
            fontWeight: 500,
            fontSize: fontSize.body,
            color: colors.textPrimary,
          }}
        >
          {q.label}
        </label>
        <input
          style={inputStyle}
          placeholder={q.placeholder}
          value={answers[q.key] ?? ""}
          onChange={(e) =>
            setAnswers((a) => ({ ...a, [q.key]: e.target.value }))
          }
          onKeyDown={(e) => e.key === "Enter" && handleNext()}
        />
        <button
          type="button"
          onClick={handleNext}
          disabled={loading || !answers[q.key]?.trim()}
          className="hover-btn-primary"
          style={{
            ...btnPrimary,
            marginTop: "1.25rem",
            width: "100%",
            opacity: loading || !answers[q.key]?.trim() ? 0.6 : 1,
          }}
        >
          {loading
            ? "Saving..."
            : step < QUESTIONS.length - 1
            ? "Next"
            : "Finish Setup"}
        </button>
      </div>
    </div>
  );
}

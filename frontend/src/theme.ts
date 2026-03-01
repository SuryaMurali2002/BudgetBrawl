/** Shared theme — RBC-inspired (blue #005DAA, yellow #FFD200) */

export const colors = {
  // RBC brand
  primary: "#005DAA",
  primaryHover: "#004a87",
  accent: "#FFD200",
  accentHover: "#e6bd00",

  // Backgrounds
  pageBg: "#FAFAF8",
  cardBg: "#FFFFFF",
  navBg: "#FFFFFF",
  inputBg: "#F4F4F2",

  // Text
  textPrimary: "#1A1A2E",
  textSecondary: "#5a5a6e",
  textMuted: "#8E8E93",

  // Status
  green: "#058c42",
  coral: "#FF6B6B",
  orange: "#FFB020",
  blue: "#005DAA",

  // Borders
  border: "#E8E8E8",
  borderLight: "#F0F0F0",
};

/** Font stack: EB Garamond for headings, Source Sans 3 for body */
export const fonts = {
  heading: "'EB Garamond', Georgia, serif",
  body: "'Source Sans 3', 'Work Sans', sans-serif",
};

/** Type scale — single source for font sizes (RBC/pro fintech style) */
export const fontSize = {
  caption: "0.8125rem",   // 13px — timestamps, tiny labels
  bodySmall: "0.875rem",  // 14px — secondary text, labels, links
  body: "1rem",           // 16px — body copy
  h3: "1.125rem",         // 18px — small headings
  h2: "1.25rem",          // 20px — section headings
  h1: "1.5rem",           // 24px — page title
  hero: "1.75rem",        // 28px — welcome/hero (sparingly)
  display: "2rem",        // 32px — big numbers (balance, etc.)
};

/** Line heights */
export const lineHeight = {
  tight: 1.25,
  heading: 1.3,
  body: 1.5,
};

/** Shared transition for hovers (use in style + hover class) */
export const transition = {
  all: "color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
};

export const pageStyle: React.CSSProperties = {
  padding: "1.5rem",
  maxWidth: "720px",
  margin: "0 auto",
  fontFamily: fonts.body,
  fontSize: fontSize.body,
  lineHeight: lineHeight.body,
  color: colors.textPrimary,
};

/** Glass panel over rainbow — semi-transparent + blur so background shows through */
const glass = {
  background: "rgba(255, 255, 255, 0.14)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)" as const,
  border: "1px solid rgba(255, 255, 255, 0.22)",
};

export const cardStyle: React.CSSProperties = {
  ...glass,
  borderRadius: "12px",
  padding: "1rem 1.25rem",
  marginBottom: "0.75rem",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
  transition: transition.all,
};

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.7rem 0.9rem",
  borderRadius: "10px",
  border: `1px solid ${colors.border}`,
  background: colors.inputBg,
  color: colors.textPrimary,
  fontSize: fontSize.body,
  boxSizing: "border-box",
  outline: "none",
};

export const selectStyle: React.CSSProperties = {
  ...inputStyle,
};

export const btnPrimary: React.CSSProperties = {
  padding: "0.7rem 1.3rem",
  borderRadius: "10px",
  border: "none",
  background: colors.primary,
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: fontSize.body,
  transition: transition.all,
};

export const btnAccent: React.CSSProperties = {
  padding: "0.7rem 1.3rem",
  borderRadius: "10px",
  border: "none",
  background: colors.accent,
  color: "#1A1A2E",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: fontSize.body,
  transition: transition.all,
};

export const btnSecondary: React.CSSProperties = {
  padding: "0.5rem 1rem",
  borderRadius: "10px",
  border: `1px solid ${colors.border}`,
  background: colors.cardBg,
  color: colors.textPrimary,
  fontWeight: 500,
  cursor: "pointer",
  fontSize: fontSize.bodySmall,
  transition: transition.all,
};

export const btnSmall: React.CSSProperties = {
  padding: "0.4rem 0.8rem",
  borderRadius: "8px",
  border: "none",
  color: "#fff",
  fontWeight: 500,
  cursor: "pointer",
  fontSize: fontSize.bodySmall,
  transition: transition.all,
};

export const linkStyle: React.CSSProperties = {
  color: colors.primary,
  textDecoration: "none",
  fontSize: fontSize.bodySmall,
  fontWeight: 500,
  transition: transition.all,
};

export const labelStyle: React.CSSProperties = {
  display: "block",
  marginTop: "1rem",
  marginBottom: "0.4rem",
  color: colors.textSecondary,
  fontSize: fontSize.bodySmall,
  fontWeight: 500,
};

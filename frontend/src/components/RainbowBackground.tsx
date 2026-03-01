import "./rainbow.css";

const LENGTH = 25;

/** RBC-themed rainbow background (blue #005DAA, yellow #FFD200, dark blue #003d73) — pure CSS */
export default function RainbowBackground() {
  return (
    <div className="rainbow-wrapper" aria-hidden>
      {Array.from({ length: LENGTH }, (_, i) => (
        <div key={i} className="rainbow" />
      ))}
      <div className="rainbow-overlay h" />
      <div className="rainbow-overlay v" />
    </div>
  );
}

import { colors } from "../theme";

const sizeMap = { sm: 24, md: 40, lg: 56 };

type Size = "sm" | "md" | "lg";

export default function LoadingSpinner({ size = "md" }: { size?: Size }) {
  const px = sizeMap[size];
  return (
    <div
      className="loading-spinner"
      style={{
        width: px,
        height: px,
        borderWidth: size === "sm" ? 2 : 3,
        borderColor: colors.border,
        borderTopColor: colors.primary,
      }}
      aria-hidden
    />
  );
}

export default function LoadingSpinner({ size = "md" }) {
  const dim = size === "sm" ? 16 : 32;

  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: "spin 1s linear infinite" }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="var(--color-graphite-mid)"
        strokeWidth="3"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="var(--color-teal)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

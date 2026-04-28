// Content-shaped placeholder. Pulse animation while data loads.

export default function Skeleton({
  className = "",
  rounded = "rounded-md",
}: {
  className?: string;
  rounded?: string;
}) {
  return (
    <div
      className={`${rounded} ${className}`}
      style={{
        background:
          "linear-gradient(90deg, rgba(91,31,41,0.06) 0%, rgba(91,31,41,0.12) 50%, rgba(91,31,41,0.06) 100%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 1.6s ease-in-out infinite",
      }}
      aria-hidden="true"
    />
  );
}

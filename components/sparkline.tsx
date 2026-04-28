// Tiny dependency-free SVG sparkline for time-series counts.

export default function Sparkline({
  data,
  height = 56,
  width = 280,
  stroke = "var(--pp-burgundy)",
  fill = "rgba(91, 31, 41, 0.1)",
  showDots = false,
}: {
  data: number[];
  height?: number;
  width?: number;
  stroke?: string;
  fill?: string;
  showDots?: boolean;
}) {
  if (data.length === 0) return <div style={{ height }} />;
  const max = Math.max(...data, 1);
  const padX = 2;
  const padY = 4;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const points = data.map((v, i) => {
    const x = padX + (i / Math.max(data.length - 1, 1)) * innerW;
    const y = padY + innerH - (v / max) * innerH;
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const fillPath =
    `M ${padX} ${height - padY} ` +
    points.map(([x, y]) => `L ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") +
    ` L ${width - padX} ${height - padY} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <path d={fillPath} fill={fill} />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" />
      {showDots &&
        points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={1.5} fill={stroke} />
        ))}
    </svg>
  );
}

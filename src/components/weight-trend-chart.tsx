// A small hand-rolled SVG line chart - no charting library needed for
// something this simple, and it keeps the app's dependency footprint at
// zero for anything UI-related. Pure server-rendered markup, no
// interactivity, so this never needs to be a client component.

const WIDTH = 600;
const HEIGHT = 220;
const PADDING_X = 12;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 28;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function WeightTrendChart({
  points,
  targetKg,
}: {
  points: { date: string; weightKg: number }[];
  targetKg?: number | null;
}) {
  if (points.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        No weight logged yet.
      </p>
    );
  }

  const weights = points.map((p) => p.weightKg);
  const allValues = targetKg ? [...weights, targetKg] : weights;
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  // A little vertical headroom so the line/target never touches the very
  // top or bottom edge - and a floor under the range so a near-flat line
  // (or a single point) doesn't get stretched into a wild zig-zag by a
  // tiny denominator.
  const padding = Math.max((rawMax - rawMin) * 0.15, 1);
  const min = rawMin - padding;
  const max = rawMax + padding;

  const chartWidth = WIDTH - PADDING_X * 2;
  const chartHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  function xFor(index: number) {
    if (points.length === 1) return PADDING_X + chartWidth / 2;
    return PADDING_X + (index / (points.length - 1)) * chartWidth;
  }

  function yFor(value: number) {
    return PADDING_TOP + chartHeight - ((value - min) / (max - min)) * chartHeight;
  }

  const linePoints = points
    .map((p, i) => `${xFor(i)},${yFor(p.weightKg)}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full"
      role="img"
      aria-label="Weight over time"
    >
      {targetKg && (
        <>
          <line
            x1={PADDING_X}
            x2={WIDTH - PADDING_X}
            y1={yFor(targetKg)}
            y2={yFor(targetKg)}
            stroke="var(--accent)"
            strokeOpacity={0.4}
            strokeDasharray="4 4"
            strokeWidth={1.5}
          />
          <text
            x={WIDTH - PADDING_X}
            y={yFor(targetKg) - 6}
            textAnchor="end"
            fontSize={11}
            fill="var(--accent)"
          >
            Target: {targetKg}kg
          </text>
        </>
      )}

      <polyline
        points={linePoints}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {points.map((p, i) => (
        <circle
          key={p.date}
          cx={xFor(i)}
          cy={yFor(p.weightKg)}
          r={i === points.length - 1 ? 4.5 : 3}
          fill={i === points.length - 1 ? "var(--accent)" : "var(--surface)"}
          stroke="var(--accent)"
          strokeWidth={2}
        />
      ))}

      <text x={PADDING_X} y={HEIGHT - 8} fontSize={11} fill="var(--muted)">
        {formatDate(points[0].date)}
      </text>
      <text
        x={WIDTH - PADDING_X}
        y={HEIGHT - 8}
        textAnchor="end"
        fontSize={11}
        fill="var(--muted)"
      >
        {formatDate(points[points.length - 1].date)}
      </text>
    </svg>
  );
}

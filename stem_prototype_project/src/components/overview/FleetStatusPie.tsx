import { useMemo, useState } from "react";
import { type MachinePrediction } from "../../../data/modelData";

// Three-bucket fleet classification
type Bucket = "Critical" | "Watch" | "Normal";

const BUCKETS: { key: Bucket; label: string; desc: string; color: string }[] = [
  { key: "Critical", label: "Critical", desc: "Action required",  color: "#d9534f" },
  { key: "Watch",    label: "Watch",    desc: "Monitor closely",  color: "#e8a33d" },
  { key: "Normal",   label: "Normal",   desc: "Healthy",          color: "#2fab6f" },
];

function classify(dtf: number): Bucket {
  if (dtf < 7) return "Critical";
  if (dtf < 30) return "Watch";
  return "Normal";
}

export default function FleetStatusPie({ machines }: { machines: MachinePrediction[] }) {
  const [hovered, setHovered] = useState<Bucket | null>(null);

  const counts = useMemo(() => {
    const c: Record<Bucket, number> = { Critical: 0, Watch: 0, Normal: 0 };
    for (const m of machines) c[classify(m.daysToFailure)]++;
    return c;
  }, [machines]);

  const total = counts.Critical + counts.Watch + counts.Normal;

  // Geometry — donut centered in (cx, cy) with radius r
  const W = 220, H = 220;
  const cx = W / 2, cy = H / 2;
  const r = 88;
  const rInner = 50;

  // Build slice arcs starting from 12 o'clock, going clockwise
  let angleAcc = -Math.PI / 2;
  const slices = BUCKETS.map((b) => {
    const count = counts[b.key];
    const angle = total === 0 ? 0 : (count / total) * Math.PI * 2;
    const start = angleAcc;
    const end = angleAcc + angle;
    angleAcc = end;
    return { ...b, count, start, end, angle };
  });

  const point = (cx: number, cy: number, radius: number, theta: number) => ({
    x: cx + radius * Math.cos(theta),
    y: cy + radius * Math.sin(theta),
  });

  const sliceToPath = (s: typeof slices[number], radius: number) => {
    if (s.count === 0) return "";
    const a = point(cx, cy, radius, s.start);
    const b = point(cx, cy, radius, s.end);
    const ai = point(cx, cy, rInner, s.end);
    const bi = point(cx, cy, rInner, s.start);
    const large = s.angle > Math.PI ? 1 : 0;
    // outer arc (start→end) → inner arc back (end→start)
    return [
      `M ${a.x} ${a.y}`,
      `A ${radius} ${radius} 0 ${large} 1 ${b.x} ${b.y}`,
      `L ${ai.x} ${ai.y}`,
      `A ${rInner} ${rInner} 0 ${large} 0 ${bi.x} ${bi.y}`,
      "Z",
    ].join(" ");
  };

  return (
    <div className="pdm-pie-wrap">
      <div className="pdm-pie-svg">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img"
             aria-label="Fleet health status pie chart">
          {/* Slices */}
          {slices.map((s) => {
            const isHover = hovered === s.key;
            const radius = isHover ? r + 6 : r;
            return (
              <path
                key={s.key}
                d={sliceToPath(s, radius)}
                fill={s.color}
                stroke="#fff"
                strokeWidth={2}
                style={{ cursor: "pointer", transition: "d 0.15s" }}
                onMouseEnter={() => setHovered(s.key)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}

          {/* Center label */}
          <text
            x={cx} y={cy - 6}
            textAnchor="middle"
            fontSize={26}
            fontWeight={700}
            fill="#14365f"
          >
            {hovered ? counts[hovered] : total}
          </text>
          <text
            x={cx} y={cy + 14}
            textAnchor="middle"
            fontSize={10}
            fill="#7790ad"
            fontWeight={600}
            letterSpacing="0.04em"
          >
            {hovered ? hovered.toUpperCase() : "MACHINES"}
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="pdm-pie-legend">
        {slices.map((s) => {
          const pct = total === 0 ? 0 : Math.round((s.count / total) * 100);
          const isHover = hovered === s.key;
          return (
            <div
              key={s.key}
              className={"pdm-pie-row" + (isHover ? " hover" : "")}
              onMouseEnter={() => setHovered(s.key)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="pdm-pie-swatch" style={{ background: s.color }} />
              <div className="pdm-pie-info">
                <div className="pdm-pie-label">
                  {s.label}
                  <span className="pdm-pie-desc">· {s.desc}</span>
                </div>
                <div className="pdm-pie-sub">
                  <strong style={{ color: s.color }}>{s.count}</strong>
                  <span> machines · {pct}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

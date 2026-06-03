import { type TrendPoint } from "../../../data/modelData";

// Inline SVG chart: area + polyline for fleet-average RUL by week.
export default function RulTrendChart({ data }: { data: TrendPoint[] }) {
  const W = 560,
    H = 150,
    P = 28;
  const max = Math.max(...data.map((d) => d.value)) * 1.15;
  const min = 0;
  const x = (i: number) => P + (i * (W - P * 2)) / (data.length - 1);
  const y = (v: number) => H - P - ((v - min) / (max - min)) * (H - P * 2);

  const linePts = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  const areaPts = `${P},${H - P} ${linePts} ${W - P},${H - P}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="150"
      role="img"
      aria-label="RUL trend chart showing average days to failure over recent weeks"
    >
      {[0.25, 0.5, 0.75, 1].map((g, i) => (
        <line
          key={i}
          x1={P}
          x2={W - P}
          y1={y(max * g)}
          y2={y(max * g)}
          stroke="#eef4fc"
          strokeWidth={1}
        />
      ))}
      <polygon points={areaPts} fill="#e3eefb" />
      <polyline
        points={linePts}
        fill="none"
        stroke="#2a5896"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.value)} r={3.5} fill="#2a5896" />
          <text
            x={x(i)}
            y={H - 8}
            textAnchor="middle"
            fontSize={9}
            fill="#7790ad"
          >
            {d.label.replace("Week ", "W")}
          </text>
        </g>
      ))}
    </svg>
  );
}

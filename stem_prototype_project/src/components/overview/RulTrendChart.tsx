import { useState } from "react";
import { type TrendPoint } from "../../../data/modelData";

// Inline SVG chart: area + polyline for fleet-average RUL per week.
// Y-axis shows numeric ticks (days). Hovering a point reveals a tooltip
// with the exact value for that week.
export default function RulTrendChart({ data }: { data: TrendPoint[] }) {
  const W = 580;
  const H = 180;
  const PL = 40;  // left padding for Y labels
  const PR = 14;
  const PT = 18;
  const PB = 30;

  const innerW = W - PL - PR;
  const innerH = H - PT - PB;

  const rawMax = Math.max(...data.map((d) => d.value));
  // Round the axis maximum up to a clean number so Y ticks are nice.
  const niceMax = Math.max(5, Math.ceil((rawMax * 1.15) / 5) * 5);
  const yMin = 0;

  const x = (i: number) => PL + (i * innerW) / (data.length - 1);
  const y = (v: number) => PT + innerH - ((v - yMin) / (niceMax - yMin)) * innerH;

  const linePts = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  const areaPts = `${PL},${PT + innerH} ${linePts} ${PL + innerW},${PT + innerH}`;

  // 5 evenly-spaced Y ticks: 0, 25%, 50%, 75%, 100% of niceMax
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(niceMax * t));

  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  return (
    <div style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        role="img"
        aria-label="RUL trend chart showing average days to failure over recent weeks"
      >
        {/* Y-axis grid + labels */}
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={PL}
              x2={PL + innerW}
              y1={y(tick)}
              y2={y(tick)}
              stroke="#eef4fc"
              strokeWidth={1}
            />
            <text
              x={PL - 8}
              y={y(tick) + 3}
              textAnchor="end"
              fontSize={10}
              fill="#7790ad"
            >
              {tick}
            </text>
          </g>
        ))}

        {/* Y-axis line */}
        <line
          x1={PL} x2={PL}
          y1={PT} y2={PT + innerH}
          stroke="#d6e4f5"
          strokeWidth={1}
        />

        {/* Y-axis title */}
        <text
          x={12}
          y={PT + innerH / 2}
          textAnchor="middle"
          fontSize={10}
          fill="#46618a"
          fontWeight={600}
          transform={`rotate(-90 12 ${PT + innerH / 2})`}
        >
          Avg Days
        </text>

        <polygon points={areaPts} fill="#e3eefb" />
        <polyline
          points={linePts}
          fill="none"
          stroke="#2a5896"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Data points + hover hit-areas */}
        {data.map((d, i) => {
          const isActive = hoverIdx === i;
          return (
            <g key={i}>
              <circle
                cx={x(i)}
                cy={y(d.value)}
                r={isActive ? 5.5 : 3.5}
                fill={isActive ? "#1e4d8c" : "#2a5896"}
                stroke={isActive ? "#fff" : "none"}
                strokeWidth={isActive ? 2 : 0}
              />
              {/* Hover region — wider than the dot for easier targeting */}
              <rect
                x={x(i) - 22}
                y={PT}
                width={44}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                style={{ cursor: "pointer" }}
              />
              <text
                x={x(i)}
                y={H - 10}
                textAnchor="middle"
                fontSize={10}
                fill="#7790ad"
              >
                {d.label.replace("Week ", "W")}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip — positioned via percentage so it follows the responsive SVG */}
      {hoverIdx !== null && (
        <div
          className="pdm-chart-tooltip"
          style={{
            left: `${((x(hoverIdx)) / W) * 100}%`,
            top: `${((y(data[hoverIdx].value) - 10) / H) * 100}%`,
          }}
        >
          <div className="pdm-chart-tooltip-label">{data[hoverIdx].label} · Fleet Avg</div>
          <div className="pdm-chart-tooltip-val">
            {data[hoverIdx].value.toFixed(1)}<span>days to failure</span>
          </div>
        </div>
      )}
    </div>
  );
}

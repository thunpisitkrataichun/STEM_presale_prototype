import { useState, useRef } from "react";
import { COMPONENT_COLOR, type FailureComponent } from "../../../data/failureData";
import { useDataContext } from "../../context/DataContext";

const COMPS: FailureComponent[] = ["Comp1", "Comp2", "Comp3", "Comp4"];

export default function FailureTrendPanel() {
  const [hidden, setHidden] = useState<Set<FailureComponent>>(new Set());
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const data = useDataContext().weeklyTrend;

  // Compute stacked sums (skipping hidden series for max calculation)
  const stacks = data.map((d) => {
    let sum = 0;
    for (const c of COMPS) if (!hidden.has(c)) sum += d[c];
    return sum;
  });
  const max = Math.max(5, ...stacks);
  const niceMax = Math.ceil((max * 1.1) / 5) * 5;

  const W = 560, H = 200;
  const PL = 38, PR = 12, PT = 16, PB = 36;
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;
  const x = (i: number) => PL + (i * innerW) / Math.max(1, data.length - 1);
  const y = (v: number) => PT + innerH - (v / niceMax) * innerH;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(niceMax * t));

  const toggle = (c: FailureComponent) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c); else next.add(c);
      return next;
    });
  };

  return (
    <div className="pdm-panel">
      <div className="pdm-phead">
        <div>
          <span className="pdm-pt">Failure Trend</span>
          <div className="pdm-phead-sub">Stacked by component · last 12 weeks</div>
        </div>
      </div>

      <div style={{ position: "relative" }}>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
          {/* Y axis grid + labels */}
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={PL} x2={PL + innerW} y1={y(t)} y2={y(t)} stroke="#eef4fc" />
              <text x={PL - 6} y={y(t) + 3} textAnchor="end" fontSize={10} fill="#7790ad">{t}</text>
            </g>
          ))}

          {/* Layered area fills (bottom-up) */}
          {COMPS.filter((c) => !hidden.has(c)).map((c, ci, list) => {
            const bottomPts = data.map((d, i) => {
              let cum = 0;
              for (const cc of list.slice(0, ci)) cum += d[cc];
              return `${x(i)},${y(cum)}`;
            });
            const topPts = data.map((d, i) => {
              let cum = 0;
              for (const cc of list.slice(0, ci + 1)) cum += d[cc];
              return `${x(i)},${y(cum)}`;
            });
            const poly = `${bottomPts.join(" ")} ${topPts.reverse().join(" ")}`;
            return (
              <polygon
                key={c}
                points={poly}
                fill={COMPONENT_COLOR[c]}
                opacity={0.7}
              />
            );
          })}

          {/* Total line (top of stack) */}
          <polyline
            points={data.map((_, i) => `${x(i)},${y(stacks[i])}`).join(" ")}
            fill="none"
            stroke="#2a5896"
            strokeWidth={2}
          />

          {/* Hover hit-areas + week labels */}
          {data.map((d, i) => (
            <g key={i}>
              <rect
                x={x(i) - 18}
                y={PT}
                width={36}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                style={{ cursor: "pointer" }}
              />
              <circle cx={x(i)} cy={y(stacks[i])} r={hoverIdx === i ? 4 : 0} fill="#2a5896" />
              {(i % 2 === 0 || i === data.length - 1) && (
                <text x={x(i)} y={H - 14} textAnchor="middle" fontSize={9} fill="#7790ad">
                  {d.week}
                </text>
              )}
            </g>
          ))}
        </svg>

        {hoverIdx !== null && (() => {
          // The SVG renders inside the wrapper with `preserveAspectRatio="xMidYMid meet"`
          // (the default), so its content can be letterboxed inside the element.
          // Compute the actual pixel offset of the data point so the tooltip
          // sits on top of it regardless of viewport size.
          const svgEl = svgRef.current;
          if (!svgEl) return null;
          const rect = svgEl.getBoundingClientRect();
          const scaleX = rect.width / W;
          const scaleY = rect.height / H;
          const scale = Math.min(scaleX, scaleY);
          const renderedW = W * scale;
          const renderedH = H * scale;
          const offsetX = (rect.width - renderedW) / 2;
          const offsetY = (rect.height - renderedH) / 2;
          const leftPx = offsetX + x(hoverIdx) * scale;
          const topPx = offsetY + y(stacks[hoverIdx]) * scale - 8;
          return (
            <div className="pdm-chart-tooltip" style={{ left: leftPx, top: topPx }}>
              <div className="pdm-chart-tooltip-label">{data[hoverIdx].week}</div>
              <div className="pdm-chart-tooltip-val">
                {stacks[hoverIdx]}<span>failures</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Toggleable legend */}
      <div style={{
        display: "flex", gap: 12, flexWrap: "wrap",
        marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--line)",
      }}>
        {COMPS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => toggle(c)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "none", border: "none", cursor: "pointer",
              fontSize: 11, fontFamily: "inherit",
              color: hidden.has(c) ? "var(--ink-faint)" : "var(--ink-soft)",
              textDecoration: hidden.has(c) ? "line-through" : "none",
              opacity: hidden.has(c) ? 0.5 : 1,
              fontWeight: 600,
            }}
          >
            <span style={{
              width: 10, height: 10, borderRadius: 2,
              background: COMPONENT_COLOR[c],
            }} />
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

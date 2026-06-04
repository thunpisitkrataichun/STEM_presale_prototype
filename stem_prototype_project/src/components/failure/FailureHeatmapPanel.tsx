import { useState } from "react";
import { HEATMAP, HEATMAP_MAX } from "../../../data/failureData";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Linear interpolation between two hex colors
function interp(t: number): string {
  // t in [0, 1]: light blue (#f4f9fe) → strong red (#d9534f)
  const lo = [244, 249, 254];
  const hi = [217, 83, 79];
  const c = lo.map((v, i) => Math.round(v + (hi[i] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export default function FailureHeatmapPanel() {
  const [hover, setHover] = useState<{ d: number; h: number } | null>(null);

  return (
    <div className="pdm-panel">
      <div className="pdm-phead">
        <div>
          <span className="pdm-pt">Failure Heatmap</span>
          <div className="pdm-phead-sub">Pattern by day × hour · darker = more failures</div>
        </div>
      </div>

      <div className="pdm-heatmap-wrap">
        <table className="pdm-heatmap">
          <thead>
            <tr>
              <th></th>
              {Array.from({ length: 24 }, (_, h) => (
                <th key={h}>{h % 4 === 0 ? h : ""}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, d) => (
              <tr key={day}>
                <th className="pdm-heatmap-day">{day}</th>
                {Array.from({ length: 24 }, (_, h) => {
                  const v = HEATMAP[d]?.[h] ?? 0;
                  const t = HEATMAP_MAX === 0 ? 0 : v / HEATMAP_MAX;
                  const active = hover?.d === d && hover?.h === h;
                  return (
                    <td
                      key={h}
                      className="pdm-heatmap-cell"
                      style={{
                        background: interp(t),
                        outline: active ? "1.5px solid #2a5896" : "none",
                        zIndex: active ? 1 : 0,
                      }}
                      onMouseEnter={() => setHover({ d, h })}
                      onMouseLeave={() => setHover(null)}
                      title={`${day} ${h.toString().padStart(2, "0")}:00 · ${v} failures`}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {hover && (
          <div className="pdm-heatmap-tooltip">
            <strong>{DAYS[hover.d]} {hover.h.toString().padStart(2, "0")}:00</strong>
            <span> · {HEATMAP[hover.d][hover.h]} failures</span>
          </div>
        )}

        <div className="pdm-heatmap-legend">
          <span>Less</span>
          <div className="pdm-heatmap-legend-bar" />
          <span>More · max {HEATMAP_MAX}</span>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";

interface Props {
  active: number;
  idle: number;
  needAction: number;
}

const COLORS = { active: "#2fab6f", idle: "#9aa9be" };

export default function MachineStatusPie({ active, idle}: Props) {
  const [hover, setHover] = useState<"active" | "idle" | "any" | null>(null);
  const total = active + idle;

  // Geometry
  const W = 180, H = 180;
  const cx = W / 2, cy = H / 2;
  const r = 70, rIn = 45;

  const angleActive = total === 0 ? 0 : (active / total) * Math.PI * 2;
  const slices = [
    { key: "active" as const, label: "Active",  count: active, color: COLORS.active, start: -Math.PI / 2, end: -Math.PI / 2 + angleActive },
    { key: "idle"   as const, label: "Idle",    count: idle,   color: COLORS.idle,   start: -Math.PI / 2 + angleActive, end: 1.5 * Math.PI },
  ];

  const pt = (radius: number, theta: number) => ({
    x: cx + radius * Math.cos(theta),
    y: cy + radius * Math.sin(theta),
  });

  const arcPath = (start: number, end: number, radius: number) => {
    const a = pt(radius, start);
    const b = pt(radius, end);
    const ai = pt(rIn, end);
    const bi = pt(rIn, start);
    const angle = end - start;
    const large = angle > Math.PI ? 1 : 0;
    return [
      `M ${a.x} ${a.y}`,
      `A ${radius} ${radius} 0 ${large} 1 ${b.x} ${b.y}`,
      `L ${ai.x} ${ai.y}`,
      `A ${rIn} ${rIn} 0 ${large} 0 ${bi.x} ${bi.y}`,
      "Z",
    ].join(" ");
  };

  // Determine center label
  let centerLabel = "MACHINES";
  let centerValue = String(total);
  let centerColor = "var(--ink)";
  if (hover === "active") { centerLabel = "ACTIVE"; centerValue = String(active); centerColor = COLORS.active; }
  else if (hover === "idle") { centerLabel = "IDLE"; centerValue = String(idle); centerColor = COLORS.idle; }

  return (
    <div className="pdm-kpi" style={{ padding: 14, display: "flex", gap: 14, alignItems: "center" }}>
      <div style={{ flex: "0 0 180px" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="180"
          height="180"
          onMouseEnter={() => setHover("any")}
          onMouseLeave={() => setHover(null)}
        >
          {slices.map((s) => (
            s.count === 0 ? null : (
              <path
                key={s.key}
                d={arcPath(s.start, s.end, hover === s.key ? r + 4 : r)}
                fill={s.color}
                stroke="#fff"
                strokeWidth={2}
                style={{ cursor: "pointer", transition: "d 0.15s" }}
                onMouseEnter={(e) => { e.stopPropagation(); setHover(s.key); }}
                onMouseLeave={(e) => { e.stopPropagation(); setHover("any"); }}
              />
            )
          ))}

          <text x={cx} y={cy - 4} textAnchor="middle" fontSize={24} fontWeight={700} fill={centerColor}>
            {centerValue}
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize={9} fontWeight={700}
                fill="#7790ad" letterSpacing="0.06em">
            {centerLabel}
          </text>
        </svg>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="pdm-kpi-lbl" style={{ minHeight: 0, marginBottom: 8 }}>Machine Status</p>
        <div style={{ fontSize: 11, color: "var(--ink-muted)", marginBottom: 6 }}>Fleet operating state</div>

        <div
          className={"pdm-pie-row" + (hover === "active" ? " hover" : "")}
          onMouseEnter={() => setHover("active")}
          onMouseLeave={() => setHover(null)}
        >
          <span className="pdm-pie-swatch" style={{ background: COLORS.active }} />
          <div className="pdm-pie-info">
            <div className="pdm-pie-label">Active <span className="pdm-pie-desc">· In operation</span></div>
            <div className="pdm-pie-sub">
              <strong style={{ color: COLORS.active }}>{active}</strong>
              <span> · {total ? Math.round((active / total) * 100) : 0}%</span>
            </div>
          </div>
        </div>
        <div
          className={"pdm-pie-row" + (hover === "idle" ? " hover" : "")}
          onMouseEnter={() => setHover("idle")}
          onMouseLeave={() => setHover(null)}
        >
          <span className="pdm-pie-swatch" style={{ background: COLORS.idle }} />
          <div className="pdm-pie-info">
            <div className="pdm-pie-label">Idle <span className="pdm-pie-desc">· Stopped</span></div>
            <div className="pdm-pie-sub">
              <strong style={{ color: COLORS.idle }}>{idle}</strong>
              <span> · {total ? Math.round((idle / total) * 100) : 0}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect } from "react";
import {
  type FailureEvent, SENSOR_SNAPSHOTS, COMPONENT_COLOR,
} from "../../../data/failureData";

interface Props {
  event: FailureEvent;
  onClose: () => void;
}

interface MiniChartProps {
  label: string;
  unit: string;
  values: { h: number; val: number }[];
  threshold: { min: number; max: number };
  fmt?: (v: number) => string;
}

function MiniChart({ label, unit, values, threshold, fmt }: MiniChartProps) {
  if (values.length === 0) {
    return (
      <div className="pdm-mini-chart">
        <div className="pdm-mini-label">{label}</div>
        <div className="pdm-empty" style={{ padding: 12, fontSize: 11 }}>No data</div>
      </div>
    );
  }

  const W = 220, H = 80;
  const PL = 4, PR = 4, PT = 6, PB = 14;
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;

  const vals = values.map((v) => v.val);
  const lo = Math.min(...vals, threshold.min);
  const hi = Math.max(...vals, threshold.max);
  const span = Math.max(1, hi - lo);
  const padded = span * 0.1;

  const yMin = lo - padded;
  const yMax = hi + padded;
  const x = (i: number) => PL + (i * innerW) / Math.max(1, values.length - 1);
  const y = (v: number) => PT + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  const linePts = values.map((p, i) => `${x(i)},${y(p.val)}`).join(" ");
  const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
  const anomaly = vals.some((v) => v < threshold.min || v > threshold.max);
  const last = values[values.length - 1].val;

  // Threshold band rect
  const yMaxThr = y(threshold.max);
  const yMinThr = y(threshold.min);

  const dispFmt = fmt ?? ((v: number) => v.toFixed(1));

  return (
    <div className="pdm-mini-chart">
      <div className="pdm-mini-header">
        <span className="pdm-mini-label">{label}</span>
        <span className="pdm-mini-val" style={{ color: anomaly ? "var(--risk-critical)" : "var(--ink)" }}>
          {dispFmt(last)} {unit} {anomaly && "⚠"}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
        {/* Threshold band — green safe zone */}
        <rect
          x={PL} y={yMaxThr}
          width={innerW} height={Math.max(0, yMinThr - yMaxThr)}
          fill="#e6f5ee" opacity={0.5}
        />
        {/* Anomaly highlights — segments outside threshold */}
        {values.map((p, i) => {
          if (i === 0) return null;
          const prev = values[i - 1];
          const both = (v: number) => v < threshold.min || v > threshold.max;
          if (!both(p.val) && !both(prev.val)) return null;
          return (
            <line
              key={i}
              x1={x(i - 1)} y1={y(prev.val)}
              x2={x(i)} y2={y(p.val)}
              stroke="#d9534f" strokeWidth={3}
            />
          );
        })}
        <polyline
          points={linePts}
          fill="none"
          stroke="#2a5896"
          strokeWidth={1.5}
        />
        {/* Failure point — last value highlighted */}
        <circle cx={x(values.length - 1)} cy={y(last)} r={3} fill="#d9534f" />
        <text x={PL} y={H - 3} fontSize={8} fill="#7790ad">-24h</text>
        <text x={W - PR} y={H - 3} textAnchor="end" fontSize={8} fill="#7790ad">failure</text>
      </svg>
      <div className="pdm-mini-foot">avg {dispFmt(avg)}</div>
    </div>
  );
}

// Sensor anomaly thresholds (rough domain knowledge)
const THRESHOLDS = {
  volt:      { min: 150, max: 200 },
  rotate:    { min: 400, max: 500 },
  pressure:  { min: 85,  max: 115 },
  vibration: { min: 30,  max: 50  },
};

function inferCause(triggeredBy: string): string {
  if (triggeredBy === "Multi-sensor") {
    return "Multiple sensor readings drifted from baseline simultaneously — possible compound fault";
  }
  return `${triggeredBy.replace(/[↑↓]/g, "").trim()} sensor deviated significantly in the hours leading up to failure (${triggeredBy})`;
}

export default function FailureDetailModal({ event, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const snapshot = SENSOR_SNAPSHOTS[event.id] || [];

  const volt = snapshot.map((s) => ({ h: s.h, val: s.v }));
  const rotate = snapshot.map((s) => ({ h: s.h, val: s.r }));
  const pressure = snapshot.map((s) => ({ h: s.h, val: s.p }));
  const vibration = snapshot.map((s) => ({ h: s.h, val: s.b }));

  const formattedDt = new Date(event.datetime).toLocaleString("en-US", {
    month: "short", day: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });

  return (
    <div className="pdm-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="pdm-modal"
        style={{ maxWidth: 980 }}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pdm-modal-head">
          <div>
            <div className="pdm-modal-title">
              <span className="pdm-led" style={{ background: COMPONENT_COLOR[event.component] }} />
              {event.id} · {event.machineID} · {event.component}
            </div>
            <div className="pdm-modal-sub">
              Failure Event · {formattedDt} · Triggered by <strong>{event.triggeredBy}</strong>
            </div>
          </div>
        </div>

        {snapshot.length > 0 ? (
          <>
            <div style={{ fontSize: 11, color: "var(--ink-faint)", textTransform: "uppercase",
                          letterSpacing: "0.04em", fontWeight: 600, marginBottom: 8 }}>
              Sensor pattern — 24h before failure (red = outside threshold)
            </div>
            <div className="pdm-mini-row">
              <MiniChart label="Volt" unit="V" values={volt} threshold={THRESHOLDS.volt} />
              <MiniChart label="Rotate" unit="RPM" values={rotate} threshold={THRESHOLDS.rotate} />
              <MiniChart label="Pressure" unit="kPa" values={pressure} threshold={THRESHOLDS.pressure} />
              <MiniChart label="Vibration" unit="mm/s" values={vibration} threshold={THRESHOLDS.vibration} />
            </div>
          </>
        ) : (
          <div className="pdm-empty" style={{ padding: 20 }}>
            Sensor history not available for this event (older record)
          </div>
        )}

        <div style={{
          marginTop: 16, padding: 12,
          background: "var(--blue-25)", borderLeft: "3px solid var(--blue-500)",
          borderRadius: 6, fontSize: 12, color: "var(--ink-soft)",
        }}>
          <strong style={{ color: "var(--ink)" }}>Likely cause:</strong>{" "}
          {inferCause(event.triggeredBy)}
        </div>
        <div style={{
          marginTop: 8, padding: 12,
          background: "#e6f5ee", borderLeft: "3px solid var(--risk-normal)",
          borderRadius: 6, fontSize: 12, color: "var(--ink-soft)",
        }}>
          <strong style={{ color: "var(--ink)" }}>Action taken:</strong>{" "}
          {event.component} replaced · recovery time {event.recoveryHours}h
        </div>

        <div className="pdm-modal-footer" style={{ marginTop: 16 }}>
          <button className="pdm-modal-btn pdm-modal-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect } from "react";
import {
  type LiveSnapshot, type SensorKey, type SensorReading,
  SENSOR_LABEL, SENSOR_UNIT,
} from "../../../data/liveMonitorData";

interface Props {
  snap: LiveSnapshot;
  onClose: () => void;
  onAcknowledge?: () => void;
  onScheduleMaintenance?: () => void;
}

const STATUS_COLOR = {
  running: "#2fab6f",
  idle:    "#9aa9be",
  alarm:   "#d9534f",
};

function MiniChart({ label, unit, reading }: { label: string; unit: string; reading: SensorReading }) {
  const W = 220, H = 70;
  const PL = 4, PR = 4, PT = 8, PB = 16;
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;

  const vals = reading.history;
  const lo = Math.min(...vals, reading.threshold.min);
  const hi = Math.max(...vals, reading.threshold.max);
  const span = Math.max(0.01, hi - lo);
  const pad = span * 0.1;
  const yMin = lo - pad;
  const yMax = hi + pad;
  const x = (i: number) => PL + (i * innerW) / Math.max(1, vals.length - 1);
  const y = (v: number) => PT + innerH - ((v - yMin) / (yMax - yMin)) * innerH;
  const pts = vals.map((v, i) => `${x(i)},${y(v)}`).join(" ");

  const yMaxThr = y(reading.threshold.max);
  const yMinThr = y(reading.threshold.min);

  return (
    <div className="pdm-mini-chart">
      <div className="pdm-mini-header">
        <span className="pdm-mini-label">{label}</span>
        <span className="pdm-mini-val" style={{ color: reading.isAnomaly ? "var(--risk-critical)" : "var(--ink)" }}>
          {reading.current.toFixed(1)} {unit} {reading.isAnomaly && "⚠"}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
        <rect
          x={PL} y={yMaxThr}
          width={innerW} height={Math.max(0, yMinThr - yMaxThr)}
          fill="#e6f5ee" opacity={0.5}
        />
        {/* Anomaly segments */}
        {vals.map((v, i) => {
          if (i === 0) return null;
          const prev = vals[i - 1];
          const oob = (val: number) => val < reading.threshold.min || val > reading.threshold.max;
          if (!oob(v) && !oob(prev)) return null;
          return (
            <line
              key={i}
              x1={x(i - 1)} y1={y(prev)}
              x2={x(i)} y2={y(v)}
              stroke="#d9534f" strokeWidth={2}
            />
          );
        })}
        <polyline points={pts} fill="none" stroke="#2a5896" strokeWidth={1.4} />
        <circle cx={x(vals.length - 1)} cy={y(reading.current)} r={3}
                fill={reading.isAnomaly ? "#d9534f" : "#2a5896"} />
        <text x={PL} y={H - 3} fontSize={8} fill="#7790ad">-30 ticks ago</text>
        <text x={W - PR} y={H - 3} textAnchor="end" fontSize={8} fill="#7790ad">now</text>
      </svg>
    </div>
  );
}

export default function LiveDetailModal({ snap, onClose, onAcknowledge, onScheduleMaintenance }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isAlarm = snap.status === "alarm";

  return (
    <div className="pdm-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="pdm-modal"
        style={{ maxWidth: 720 }}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pdm-modal-head">
          <div>
            <div className="pdm-modal-title">
              <span className="pdm-led" style={{ background: STATUS_COLOR[snap.status] }} />
              {snap.machineID}
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                background: isAlarm ? "var(--risk-critical)" : "var(--blue-50)",
                color: isAlarm ? "#fff" : "var(--blue-800)",
              }}>
                {snap.status.toUpperCase()}
              </span>
            </div>
            <div className="pdm-modal-sub">
              Live · {snap.model} · Utilization {snap.utilization.toFixed(0)}%
              {snap.primaryConcern && isAlarm && (
                <> · concern: <strong>{SENSOR_LABEL[snap.primaryConcern]}</strong></>
              )}
            </div>
          </div>
        </div>

        <div style={{
          fontSize: 11, color: "var(--ink-faint)", textTransform: "uppercase",
          letterSpacing: "0.04em", fontWeight: 600, marginBottom: 8,
        }}>
          Sensor readings (last 30 ticks · live)
        </div>
        <div className="pdm-mini-row">
          {(["volt", "rotate", "pressure", "vibration"] as SensorKey[]).map((s) => (
            <MiniChart
              key={s}
              label={SENSOR_LABEL[s]}
              unit={SENSOR_UNIT[s]}
              reading={snap.sensors[s]}
            />
          ))}
        </div>

        {isAlarm && snap.primaryConcern && (
          <div style={{
            marginTop: 16, padding: 12,
            background: "#fbe9e8", borderLeft: "3px solid var(--risk-critical)",
            borderRadius: 6, fontSize: 12, color: "var(--ink-soft)",
          }}>
            <strong style={{ color: "var(--risk-critical)" }}>⚠ Alarm Triggered:</strong>{" "}
            <strong style={{ color: "var(--ink)" }}>{SENSOR_LABEL[snap.primaryConcern]}</strong>{" "}
            reading <strong>{snap.sensors[snap.primaryConcern].current.toFixed(1)} {SENSOR_UNIT[snap.primaryConcern]}</strong>{" "}
            is outside safe range ({snap.sensors[snap.primaryConcern].threshold.min}–{snap.sensors[snap.primaryConcern].threshold.max}).
          </div>
        )}

        <div className="pdm-modal-footer" style={{ marginTop: 16 }}>
          {isAlarm && onAcknowledge && (
            <button className="pdm-modal-btn pdm-modal-confirm" onClick={() => { onAcknowledge(); onClose(); }}>
              ✓ Acknowledge Alarm
            </button>
          )}
          {onScheduleMaintenance && (
            <button className="pdm-modal-btn pdm-modal-reset" onClick={() => { onScheduleMaintenance(); onClose(); }}>
              📅 Schedule Maintenance
            </button>
          )}
          <button className="pdm-modal-btn pdm-modal-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { type LiveSnapshot, type SensorKey, SENSOR_LABEL, SENSOR_UNIT } from "../../../data/liveMonitorData";

interface Props {
  snapshot: LiveSnapshot[];
  onSelect: (snap: LiveSnapshot) => void;
}

const SENSORS: SensorKey[] = ["volt", "rotate", "pressure", "vibration"];

function interp(t: number): string {
  // 0 → light blue, 1 → red
  const lo = [244, 249, 254];
  const hi = [217, 83, 79];
  const c = lo.map((v, i) => Math.round(v + (hi[i] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export default function FleetHeatmap({ snapshot, onSelect }: Props) {
  const [sensor, setSensor] = useState<SensorKey>("volt");
  const [hover, setHover] = useState<LiveSnapshot | null>(null);

  // Normalize z-scores to 0..1 for color mapping
  const zs = snapshot.map((m) => m.sensors[sensor].zScore);
  const maxZ = Math.max(1, ...zs);

  // Arrange 100 machines as 5 rows of 20
  const cells = [...snapshot].sort((a, b) => a.machineID.localeCompare(b.machineID));

  return (
    <div className="pdm-panel" style={{ marginTop: 18 }}>
      <div className="pdm-phead">
        <div>
          <span className="pdm-pt">Fleet Sensor Heatmap</span>
          <div className="pdm-phead-sub">Latest reading anomaly per machine</div>
        </div>
        <select
          className="pdm-modal-select"
          value={sensor}
          onChange={(e) => setSensor(e.target.value as SensorKey)}
          style={{ width: "auto" }}
        >
          {SENSORS.map((s) => (
            <option key={s} value={s}>Sensor: {SENSOR_LABEL[s]}</option>
          ))}
        </select>
      </div>

      <div className="pdm-fleet-heat">
        {cells.map((m) => {
          const r = m.sensors[sensor];
          const isIdle = m.status === "idle";
          const isAlarm = r.isAnomaly;
          const tNorm = Math.min(1, r.zScore / maxZ);
          const bg = isIdle ? "#9aa9be" : isAlarm ? "#d9534f" : interp(tNorm);
          return (
            <div
              key={m.machineID}
              className="pdm-fleet-heat-cell"
              style={{ background: bg }}
              onMouseEnter={() => setHover(m)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelect(m)}
              title={`${m.machineID} · ${r.current.toFixed(1)} ${SENSOR_UNIT[sensor]}`}
            >
              <span className="pdm-fleet-heat-id">{m.machineID.slice(1)}</span>
            </div>
          );
        })}
      </div>

      {hover && (
        <div className="pdm-fleet-heat-tooltip">
          <strong>{hover.machineID}</strong> · {SENSOR_LABEL[sensor]}{" "}
          <span style={{ fontWeight: 700 }}>
            {hover.sensors[sensor].current.toFixed(1)} {SENSOR_UNIT[sensor]}
          </span>
          {" · "}
          <span style={{
            color: hover.status === "alarm" ? "var(--risk-critical)" :
                   hover.status === "idle" ? "var(--ink-muted)" : "var(--risk-normal)",
          }}>
            {hover.status.toUpperCase()}
          </span>
          {" · z="}{hover.sensors[sensor].zScore.toFixed(2)}
        </div>
      )}

      <div className="pdm-fleet-heat-legend">
        <span>Normal</span>
        <div className="pdm-fleet-heat-legend-bar" />
        <span>High anomaly</span>
        <span style={{ marginLeft: 16 }}>
          <span className="pdm-fleet-heat-legend-swatch" style={{ background: "#d9534f" }} />
          Alarm
        </span>
        <span>
          <span className="pdm-fleet-heat-legend-swatch" style={{ background: "#9aa9be" }} />
          Idle
        </span>
      </div>
    </div>
  );
}

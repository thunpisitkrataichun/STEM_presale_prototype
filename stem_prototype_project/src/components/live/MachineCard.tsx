import { type LiveSnapshot, SENSOR_LABEL, SENSOR_UNIT } from "../../../data/liveMonitorData";

interface Props {
  snap: LiveSnapshot;
  onClick: () => void;
  highlighted: boolean;
}

const STATUS_COLOR = {
  running: "#2fab6f",
  idle:    "#9aa9be",
  alarm:   "#d9534f",
};

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length === 0) return null;
  const W = 140, H = 30;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = Math.max(0.01, hi - lo);
  const x = (i: number) => (i / (values.length - 1)) * W;
  const y = (v: number) => H - ((v - lo) / span) * (H - 4) - 2;
  const pts = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.4} />
    </svg>
  );
}

export default function MachineCard({ snap, onClick, highlighted }: Props) {
  const isAlarm = snap.status === "alarm";
  const isIdle = snap.status === "idle";
  const focus = snap.primaryConcern ?? "volt";
  const reading = snap.sensors[focus];

  return (
    <div
      className={[
        "pdm-live-card",
        isAlarm ? "alarm" : "",
        isIdle ? "idle" : "",
        highlighted ? "highlighted" : "",
      ].join(" ")}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
    >
      <div className="pdm-live-card-head">
        <span className="pdm-led" style={{ background: STATUS_COLOR[snap.status] }} />
        <span className="pdm-live-card-id">{snap.machineID}</span>
        <span className={"pdm-live-card-badge " + snap.status}>
          {isAlarm ? "ALARM" : isIdle ? "IDLE" : "RUNNING"}
        </span>
      </div>

      {isIdle ? (
        <div className="pdm-live-card-idle">
          Stopped<br />
          <span style={{ fontSize: 11, color: "var(--ink-muted)" }}>Not in operation</span>
        </div>
      ) : (
        <>
          <div className="pdm-live-card-sensor">
            <span style={{ fontSize: 10, color: "var(--ink-faint)", letterSpacing: "0.04em" }}>
              {SENSOR_LABEL[focus].toUpperCase()}
              {reading.isAnomaly && " ⚠"}
            </span>
            <div style={{
              fontSize: 18, fontWeight: 700,
              color: reading.isAnomaly ? "var(--risk-critical)" : "var(--ink)",
            }}>
              {reading.current.toFixed(1)}
              <span style={{ fontSize: 11, color: "var(--ink-muted)", marginLeft: 4 }}>
                {SENSOR_UNIT[focus]}
              </span>
            </div>
          </div>
          <div className="pdm-live-card-spark">
            <Sparkline
              values={reading.history}
              color={reading.isAnomaly ? "#d9534f" : "#2a5896"}
            />
          </div>
          <div className="pdm-live-card-foot">
            Util <strong>{snap.utilization.toFixed(0)}%</strong>
          </div>
        </>
      )}
    </div>
  );
}

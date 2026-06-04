import { type ActiveAlarm, SENSOR_LABEL, SENSOR_UNIT } from "../../../data/liveMonitorData";

interface Props {
  alarms: ActiveAlarm[];
  acknowledged: number;
  onAcknowledge: (id: string) => void;
  onJumpToMachine: (machineID: string) => void;
}

export default function ActiveAlarmsPanel({
  alarms, acknowledged, onAcknowledge, onJumpToMachine,
}: Props) {
  return (
    <div className="pdm-panel" style={{ minHeight: 480 }}>
      <div className="pdm-phead">
        <div>
          <span className="pdm-pt" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            Active Alarms
            <span style={{
              fontSize: 10, fontWeight: 700,
              background: alarms.length > 0 ? "var(--risk-critical)" : "var(--ink-faint)",
              color: "#fff", padding: "1px 7px", borderRadius: 8,
            }}>{alarms.length}</span>
          </span>
          <div className="pdm-phead-sub">การแจ้งเตือนที่ต้องดำเนินการ</div>
        </div>
      </div>

      {alarms.length === 0 && (
        <div className="pdm-empty">
          ✓ All systems normal<br />
          <span style={{ fontSize: 11 }}>ระบบทำงานปกติ</span>
        </div>
      )}

      <div className="pdm-alarm-list">
        {alarms.map((a) => (
          <div key={a.id} className="pdm-alarm-card">
            <div className="pdm-alarm-head">
              <span className="pdm-alarm-led" />
              <button
                type="button"
                className="pdm-alarm-machine"
                onClick={() => onJumpToMachine(a.machineID)}
              >
                {a.machineID}
              </button>
            </div>
            <div className="pdm-alarm-body">
              <strong>{SENSOR_LABEL[a.sensor]} {a.direction === "up" ? "↑" : "↓"}</strong>
              <span style={{ color: "var(--ink-muted)", fontSize: 11 }}>
                {" "}{a.currentValue.toFixed(1)} {SENSOR_UNIT[a.sensor]}
                {" · "}
                {a.direction === "up" ? "max" : "min"} {a.threshold}
              </span>
            </div>
            <div className="pdm-alarm-foot">
              <span>{a.durationMin} min ago</span>
              <button
                type="button"
                className="pdm-alarm-ack"
                onClick={() => onAcknowledge(a.id)}
              >✓ Acknowledge</button>
            </div>
          </div>
        ))}
      </div>

      <div className="pdm-alarm-history">
        <span style={{ color: "var(--ink-muted)" }}>Recent (24h):</span>
        <strong style={{ color: "var(--ink)", marginLeft: 4 }}>{acknowledged}</strong>
        <span style={{ color: "var(--ink-muted)" }}> acknowledged</span>
      </div>
    </div>
  );
}

import { type LiveSnapshot, type ActiveAlarm } from "../../../data/liveMonitorData";
import MachineStatusPie from "./MachineStatusPie";

interface Props {
  snapshot: LiveSnapshot[];
  alarms: ActiveAlarm[];
}

export default function LiveKpiSection({ snapshot, alarms }: Props) {
  const active = snapshot.filter((m) => m.status !== "idle").length;
  const idle = snapshot.filter((m) => m.status === "idle").length;
  const alarmCount = snapshot.filter((m) => m.status === "alarm").length;

  // Average utilization over running machines
  const runningUtils = snapshot.filter((m) => m.status !== "idle").map((m) => m.utilization);
  const avgUtil = runningUtils.length
    ? runningUtils.reduce((s, v) => s + v, 0) / runningUtils.length
    : 0;

  return (
    <div className="pdm-live-kpis">
      {/* Pie spans 2 columns */}
      <MachineStatusPie active={active} idle={idle} needAction={alarmCount} />

      <div className="pdm-kpi" style={{
        borderColor: alarmCount > 0 ? "var(--risk-critical)" : undefined,
        borderWidth: alarmCount > 0 ? 1.5 : undefined,
      }}>
        <p className="pdm-kpi-lbl">Active Alarms</p>
        <div style={{ fontSize: 11, color: "var(--ink-muted)", marginBottom: 6 }}>Notifications</div>
        <div>
          <span className="pdm-kpi-val" style={{ color: alarmCount > 0 ? "var(--risk-critical)" : undefined }}>
            {alarmCount}
          </span>
        </div>
        <div className="pdm-kpi-foot">
          {alarmCount > 0 ? "need action" : "all systems normal"}
        </div>
        {alarmCount > 0 && (
          <div style={{
            position: "absolute", top: 12, right: 12,
            fontSize: 10, color: "#fff", background: "var(--risk-critical)",
            padding: "1px 6px", borderRadius: 4, fontWeight: 700,
          }}>🔴 LIVE</div>
        )}
      </div>

      <div className="pdm-kpi">
        <p className="pdm-kpi-lbl">Fleet Workload</p>
        <div style={{ fontSize: 11, color: "var(--ink-muted)", marginBottom: 6 }}></div>
        <div>
          <span className="pdm-kpi-val">{avgUtil.toFixed(1)}</span>
          <span className="pdm-kpi-unit">%</span>
        </div>
        <div style={{
          marginTop: 8, height: 6, background: "var(--blue-50)",
          borderRadius: 3, overflow: "hidden",
        }}>
          <div style={{
            width: `${avgUtil}%`, height: "100%",
            background: avgUtil > 80 ? "var(--risk-normal)" : avgUtil > 50 ? "var(--blue-500)" : "var(--risk-warning)",
            transition: "width 0.4s",
          }} />
        </div>
        <div className="pdm-kpi-foot" style={{ marginTop: 6 }}>
          across {active} active machines
        </div>
      </div>

      {/* Alarms.length is unused but keep param for future use */}
      <span style={{ display: "none" }}>{alarms.length}</span>
    </div>
  );
}

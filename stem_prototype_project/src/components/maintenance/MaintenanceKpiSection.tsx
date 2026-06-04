import { type MaintenanceJob, todayISO, isOverdue } from "../../../data/maintenanceData";

interface Props { jobs: MaintenanceJob[]; }

// Compute date offset N days from today, ISO format.
function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function MaintenanceKpiSection({ jobs }: Props) {
  const today = todayISO();
  const weekEnd = dateOffset(7);
  const monthAgo = dateOffset(-30);

  const scheduledThisWeek = jobs.filter(
    (j) => j.status === "Scheduled" && j.date >= today && j.date <= weekEnd,
  ).length;

  const todayCount = jobs.filter(
    (j) => j.date === today && j.status !== "Cancelled",
  ).length;

  const overdueCount = jobs.filter(isOverdue).length;

  const inProgress = jobs.filter((j) => j.status === "InProgress");
  const inProgressMachines = inProgress.map((j) => j.machineID).join(" · ") || "-";

  const completedThisMonth = jobs.filter(
    (j) => j.status === "Completed" && j.date >= monthAgo,
  ).length;

  return (
    <div className="pdm-kpis">
      <div className="pdm-kpi">
        <p className="pdm-kpi-lbl">Scheduled This Week</p>
        <div>
          <span className="pdm-kpi-val">{scheduledThisWeek}</span>
        </div>
        <div className="pdm-kpi-foot">{todayCount} Today</div>
      </div>

      <div className="pdm-kpi" style={overdueCount > 0 ? { borderColor: "var(--risk-critical)", borderWidth: 1.5 } : undefined}>
        <p className="pdm-kpi-lbl">Overdue</p>
        <div>
          <span
            className="pdm-kpi-val"
            style={{ color: overdueCount > 0 ? "var(--risk-critical)" : undefined }}
          >
            {overdueCount}
          </span>
        </div>
        <div className="pdm-kpi-foot">
          {overdueCount > 0 ? "Need Reschedule" : "All On Track"}
        </div>
      </div>

      <div className="pdm-kpi">
        <p className="pdm-kpi-lbl">In Progress Today</p>
        <div>
          <span className="pdm-kpi-val" style={{ color: "var(--risk-warning)" }}>
            {inProgress.length}
          </span>
        </div>
        <div className="pdm-kpi-foot" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {inProgressMachines}
        </div>
      </div>

      <div className="pdm-kpi">
        <p className="pdm-kpi-lbl">Completed This Month</p>
        <div>
          <span className="pdm-kpi-val" style={{ color: "var(--risk-normal)" }}>
            {completedThisMonth}
          </span>
        </div>
        <div className="pdm-kpi-foot">Last 30 Days</div>
      </div>
    </div>
  );
}

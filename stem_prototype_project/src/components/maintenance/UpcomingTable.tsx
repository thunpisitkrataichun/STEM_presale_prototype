import { useState } from "react";
import {
  type MaintenanceJob, type MaintenanceType,
  TYPE_COLOR, STATUS_COLOR_MAINT, todayISO, isOverdue, formatTime, formatDateLong,
} from "../../../data/maintenanceData";

type FilterKey = "all" | "week" | "overdue" | MaintenanceType;

interface Props {
  jobs: MaintenanceJob[];
  onSelectJob: (job: MaintenanceJob) => void;
}

export default function UpcomingTable({ jobs, onSelectJob }: Props) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const today = todayISO();
  const weekEnd = (() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  })();

  const filtered = jobs.filter((j) => {
    switch (filter) {
      case "all":     return j.status !== "Cancelled";
      case "week":    return j.status === "Scheduled" && j.date >= today && j.date <= weekEnd;
      case "overdue": return isOverdue(j);
      default:        return j.type === filter && j.status !== "Cancelled";
    }
  });

  // Sort by date ascending, then by time slot
  const sorted = [...filtered].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return formatTime(a.timeSlot).localeCompare(formatTime(b.timeSlot));
  });

  const overdueCount = jobs.filter(isOverdue).length;

  const Chip = ({ k, label }: { k: FilterKey; label: string }) => (
    <button
      className={"pdm-chip" + (filter === k ? " active" : "")}
      onClick={() => setFilter(k)}
      type="button"
    >
      {label}
      {k === "overdue" && overdueCount > 0 && (
        <span className="pdm-chip-badge">{overdueCount}</span>
      )}
    </button>
  );

  return (
    <div className="pdm-table-wrap">
      <div className="pdm-phead">
        <span className="pdm-pt">Upcoming Maintenance</span>
        <div className="pdm-chip-row">
          <Chip k="all" label="All" />
          <Chip k="week" label="This Week" />
          <Chip k="overdue" label="Overdue" />
          <Chip k="Preventive" label="Preventive" />
          <Chip k="Corrective" label="Corrective" />
          <Chip k="Inspection" label="Inspection" />
        </div>
      </div>

      <table className="pdm-table">
        <thead>
          <tr>
            <th>Date &amp; Time</th>
            <th>Machine</th>
            <th>Type</th>
            <th>Technician</th>
            <th>Dur.</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((j) => {
            const overdue = isOverdue(j);
            return (
              <tr
                key={j.id}
                className="clickable"
                onClick={() => onSelectJob(j)}
              >
                <td>
                  {formatDateLong(j.date)} · {formatTime(j.timeSlot)}
                  {overdue && (
                    <span style={{
                      marginLeft: 6, fontSize: 10, fontWeight: 700,
                      color: "var(--risk-critical)",
                    }}>OVERDUE</span>
                  )}
                </td>
                <td style={{ fontWeight: 600 }}>{j.machineID}</td>
                <td>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                  }}>
                    <span className="pdm-cal-dot" style={{ background: TYPE_COLOR[j.type] }} />
                    {j.type}
                  </span>
                </td>
                <td>{j.technician}</td>
                <td>{j.durationHours}h</td>
                <td>
                  <span className="pdm-status" style={{
                    background: STATUS_COLOR_MAINT[j.status] + "22",
                    color: STATUS_COLOR_MAINT[j.status],
                  }}>
                    {j.status === "InProgress" ? "In Progress" : j.status}
                  </span>
                </td>
                <td>
                  <button
                    className="pdm-page-btn"
                    style={{ padding: "3px 10px", fontSize: 11 }}
                    onClick={(e) => { e.stopPropagation(); onSelectJob(j); }}
                  >
                    {j.status === "Completed" || j.status === "Cancelled" ? "View" : "Edit"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {sorted.length === 0 && (
        <div className="pdm-empty">No maintenance jobs match this filter</div>
      )}
    </div>
  );
}

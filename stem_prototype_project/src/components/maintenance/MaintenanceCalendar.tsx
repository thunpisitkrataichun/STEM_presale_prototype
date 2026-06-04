import { useMemo, useState } from "react";
import {
  type MaintenanceJob, MAINTENANCE_TYPES, TYPE_COLOR, todayISO,
} from "../../../data/maintenanceData";

interface Props {
  jobs: MaintenanceJob[];
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  onSelectJob: (job: MaintenanceJob) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function isoFromYMD(y: number, m: number, d: number): string {
  const mm = String(m + 1).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

export default function MaintenanceCalendar({
  jobs, selectedDate, onSelectDate, onSelectJob,
}: Props) {
  // Anchor month derives from selectedDate so date picker keeps calendar in sync.
  const anchor = new Date(selectedDate + "T00:00:00");
  const [viewYear, setViewYear] = useState(anchor.getFullYear());
  const [viewMonth, setViewMonth] = useState(anchor.getMonth());

  const today = todayISO();

  // Group jobs by date for fast lookup
  const jobsByDate = useMemo(() => {
    const map = new Map<string, MaintenanceJob[]>();
    for (const j of jobs) {
      if (j.status === "Cancelled") continue;
      const arr = map.get(j.date) ?? [];
      arr.push(j);
      map.set(j.date, arr);
    }
    return map;
  }, [jobs]);

  // Build calendar grid: 6 rows × 7 cols starting from Sunday before the 1st
  const grid = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const startDow = firstOfMonth.getDay();   // 0..6
    // Day cells: 6 weeks * 7 days = 42 cells
    const cells: { iso: string; day: number; inMonth: boolean }[] = [];
    // Days from previous month
    const prevMonthLast = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      const d = prevMonthLast - i;
      const prevDate = new Date(viewYear, viewMonth - 1, d);
      cells.push({
        iso: isoFromYMD(prevDate.getFullYear(), prevDate.getMonth(), d),
        day: d, inMonth: false,
      });
    }
    // Current month days
    const monthLast = new Date(viewYear, viewMonth + 1, 0).getDate();
    for (let d = 1; d <= monthLast; d++) {
      cells.push({ iso: isoFromYMD(viewYear, viewMonth, d), day: d, inMonth: true });
    }
    // Fill trailing days from next month
    while (cells.length < 42) {
      const idx = cells.length - (startDow + monthLast);
      const nextDate = new Date(viewYear, viewMonth + 1, idx + 1);
      cells.push({
        iso: isoFromYMD(nextDate.getFullYear(), nextDate.getMonth(), idx + 1),
        day: nextDate.getDate(), inMonth: false,
      });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const goPrev = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
  };
  const goNext = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
  };
  const goToday = () => {
    const t = new Date();
    setViewYear(t.getFullYear());
    setViewMonth(t.getMonth());
    onSelectDate(todayISO());
  };

  return (
    <div className="pdm-panel">
      <div className="pdm-phead">
        <span className="pdm-pt">Maintenance Calendar</span>
        <div className="pdm-cal-nav">
          <button className="pdm-page-btn" onClick={goPrev} aria-label="Previous month">‹</button>
          <span className="pdm-cal-title">{MONTHS[viewMonth]} {viewYear}</span>
          <button className="pdm-page-btn" onClick={goNext} aria-label="Next month">›</button>
          <button className="pdm-page-btn" onClick={goToday}>Today</button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="pdm-cal-grid pdm-cal-header">
        {WEEKDAYS.map((w) => (
          <div key={w} className="pdm-cal-dow">{w}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="pdm-cal-grid">
        {grid.map((cell) => {
          const jobsOn = jobsByDate.get(cell.iso) ?? [];
          const isToday = cell.iso === today;
          const isSelected = cell.iso === selectedDate;
          return (
            <div
              key={cell.iso + (cell.inMonth ? "" : "-out")}
              className={
                "pdm-cal-cell" +
                (cell.inMonth ? "" : " out") +
                (isToday ? " today" : "") +
                (isSelected ? " selected" : "")
              }
              onClick={() => onSelectDate(cell.iso)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectDate(cell.iso);
                }
              }}
            >
              <div className="pdm-cal-daynum">
                {cell.day}
                {isToday && <span className="pdm-cal-today-tag">TODAY</span>}
              </div>
              <div className="pdm-cal-dots">
                {jobsOn.slice(0, 3).map((j) => (
                  <span
                    key={j.id}
                    className="pdm-cal-dot"
                    style={{ background: TYPE_COLOR[j.type] }}
                    title={`${j.machineID} · ${j.type}`}
                    onClick={(e) => { e.stopPropagation(); onSelectJob(j); }}
                  />
                ))}
                {jobsOn.length > 3 && (
                  <span className="pdm-cal-more">+{jobsOn.length - 3}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="pdm-cal-legend">
        {MAINTENANCE_TYPES.map((t) => (
          <span key={t} className="pdm-cal-legend-item">
            <span className="pdm-cal-dot" style={{ background: TYPE_COLOR[t] }} />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

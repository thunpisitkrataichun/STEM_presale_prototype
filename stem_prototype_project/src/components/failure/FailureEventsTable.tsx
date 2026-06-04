import { useState, useMemo } from "react";
import {
  FAILURE_EVENTS, COMPONENT_COLOR,
  type FailureEvent, type FailureComponent,
} from "../../../data/failureData";
import Pagination from "../overview/Pagination";

const PAGE_SIZE = 15;
const COMPS: FailureComponent[] = ["Comp1", "Comp2", "Comp3", "Comp4"];

interface Props {
  rangeDays: number;
  componentFilter: FailureComponent | null;
  machineFilter: string | null;
  onSelectEvent: (e: FailureEvent) => void;
  onClearFilters: () => void;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

export default function FailureEventsTable({
  rangeDays, componentFilter, machineFilter, onSelectEvent, onClearFilters,
}: Props) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [localCompFilter, setLocalCompFilter] = useState<FailureComponent | "all">("all");

  // Combine local component chip filter with external filter from bar chart
  const effectiveComp = componentFilter ?? (localCompFilter === "all" ? null : localCompFilter);

  // Use the dataset's latest datetime as the reference "now"
  const cutoffISO = useMemo(() => {
    const max = FAILURE_EVENTS.reduce(
      (m, e) => e.datetime > m ? e.datetime : m, FAILURE_EVENTS[0]?.datetime ?? "",
    );
    const d = new Date(max);
    d.setDate(d.getDate() - rangeDays);
    return d.toISOString();
  }, [rangeDays]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return FAILURE_EVENTS.filter((e) => {
      if (e.datetime < cutoffISO) return false;
      if (effectiveComp && e.component !== effectiveComp) return false;
      if (machineFilter && e.machineID !== machineFilter) return false;
      if (q && !e.machineID.toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => b.datetime.localeCompare(a.datetime));
  }, [cutoffISO, effectiveComp, machineFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const cur = Math.min(page, totalPages);
  const start = (cur - 1) * PAGE_SIZE;
  const rows = filtered.slice(start, start + PAGE_SIZE);

  const rangeStart = filtered.length === 0 ? 0 : start + 1;
  const rangeEnd = Math.min(start + PAGE_SIZE, filtered.length);

  const hasExternalFilter = Boolean(componentFilter || machineFilter);

  return (
    <div className="pdm-table-wrap">
      <div className="pdm-phead">
        <span className="pdm-pt">Failure Events History</span>
        <input
          type="text"
          className="pdm-search"
          placeholder="Search machine ID..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="pdm-chip-row" style={{ marginBottom: 10 }}>
        <button
          type="button"
          className={"pdm-chip" + (localCompFilter === "all" ? " active" : "")}
          onClick={() => { setLocalCompFilter("all"); setPage(1); }}
        >All</button>
        {COMPS.map((c) => (
          <button
            key={c}
            type="button"
            className={"pdm-chip" + (localCompFilter === c ? " active" : "")}
            onClick={() => { setLocalCompFilter(c); setPage(1); }}
          >{c}</button>
        ))}
        {hasExternalFilter && (
          <button
            type="button"
            className="pdm-chip"
            style={{ background: "#fcf2e0", color: "#9c6b1e" }}
            onClick={onClearFilters}
          >
            Clear chart filter ×
          </button>
        )}
      </div>

      <table className="pdm-table">
        <thead>
          <tr>
            <th>Date &amp; Time</th>
            <th>Machine</th>
            <th>Component</th>
            <th>Triggered By</th>
            <th>Recovery</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr
              key={e.id}
              className="clickable"
              onClick={() => onSelectEvent(e)}
            >
              <td>{formatDateTime(e.datetime)}</td>
              <td style={{ fontWeight: 600 }}>{e.machineID}</td>
              <td>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span className="pdm-cal-dot" style={{ background: COMPONENT_COLOR[e.component] }} />
                  {e.component}
                </span>
              </td>
              <td>{e.triggeredBy}</td>
              <td>{e.recoveryHours}h</td>
              <td>
                <span className="pdm-status normal" style={{
                  background: "#e6f5ee", color: "#1c7a4e",
                }}>
                  ✓ {e.status}
                </span>
              </td>
              <td>
                <button
                  type="button"
                  className="pdm-page-btn"
                  style={{ padding: "3px 10px", fontSize: 11 }}
                  onClick={(ev) => { ev.stopPropagation(); onSelectEvent(e); }}
                >Detail</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filtered.length === 0 && (
        <div className="pdm-empty">No failure events match these filters</div>
      )}

      <div className="pdm-pagination">
        <span className="pdm-pagination-info">
          Showing {rangeStart}–{rangeEnd} of {filtered.length}
        </span>
        <Pagination page={cur} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}

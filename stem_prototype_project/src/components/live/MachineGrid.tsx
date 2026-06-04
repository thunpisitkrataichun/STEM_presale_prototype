import { useState, useMemo, useEffect } from "react";
import { type LiveSnapshot } from "../../../data/liveMonitorData";
import MachineCard from "./MachineCard";
import Pagination from "../overview/Pagination";

const PAGE_SIZE = 16;

type SortKey = "anomaly" | "id" | "util";
type Filter = "all" | "alarm" | "running" | "idle";

interface Props {
  snapshot: LiveSnapshot[];
  highlightedMachine: string | null;
  onSelect: (snap: LiveSnapshot) => void;
}

export default function MachineGrid({ snapshot, highlightedMachine, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("anomaly");
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);

  const counts = useMemo(() => ({
    alarm: snapshot.filter((m) => m.status === "alarm").length,
    running: snapshot.filter((m) => m.status === "running").length,
    idle: snapshot.filter((m) => m.status === "idle").length,
  }), [snapshot]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return snapshot.filter((m) => {
      if (filter === "alarm" && m.status !== "alarm") return false;
      if (filter === "running" && m.status !== "running") return false;
      if (filter === "idle" && m.status !== "idle") return false;
      if (q && !m.machineID.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [snapshot, search, filter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sort) {
      case "anomaly":
        arr.sort((a, b) => {
          if (a.status !== b.status) {
            const order = { alarm: 0, running: 1, idle: 2 };
            return order[a.status] - order[b.status];
          }
          const az = a.primaryConcern ? a.sensors[a.primaryConcern].zScore : 0;
          const bz = b.primaryConcern ? b.sensors[b.primaryConcern].zScore : 0;
          return bz - az;
        });
        break;
      case "id":
        arr.sort((a, b) => a.machineID.localeCompare(b.machineID));
        break;
      case "util":
        arr.sort((a, b) => b.utilization - a.utilization);
        break;
    }
    return arr;
  }, [filtered, sort]);

  // If user jumps to a machine, navigate to the page containing it
  useEffect(() => {
    if (!highlightedMachine) return;
    const idx = sorted.findIndex((m) => m.machineID === highlightedMachine);
    if (idx >= 0) {
      setPage(Math.floor(idx / PAGE_SIZE) + 1);
    }
  }, [highlightedMachine, sorted]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const cur = Math.min(page, totalPages);
  const start = (cur - 1) * PAGE_SIZE;
  const rows = sorted.slice(start, start + PAGE_SIZE);

  const Chip = ({ f, label, badge }: { f: Filter; label: string; badge?: number }) => (
    <button
      type="button"
      className={"pdm-chip" + (filter === f ? " active" : "")}
      onClick={() => { setFilter(f); setPage(1); }}
    >
      {label}{badge !== undefined && badge > 0 && <span className="pdm-chip-badge">{badge}</span>}
    </button>
  );

  return (
    <div className="pdm-panel">
      <div className="pdm-phead" style={{ flexWrap: "wrap", gap: 10 }}>
        <span className="pdm-pt">Machines</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="text"
            className="pdm-search"
            placeholder="Search machine ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ minWidth: 160 }}
          />
          <select
            className="pdm-modal-select"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            style={{ width: "auto" }}
          >
            <option value="anomaly">Sort: Anomaly ↓</option>
            <option value="id">Sort: Machine ID</option>
            <option value="util">Sort: Utilization ↓</option>
          </select>
        </div>
      </div>

      <div className="pdm-chip-row" style={{ marginBottom: 12 }}>
        <Chip f="all" label="All" />
        <Chip f="alarm" label="🔴 Alarm" badge={counts.alarm} />
        <Chip f="running" label="🟢 Running" badge={counts.running} />
        <Chip f="idle" label="⚫ Idle" badge={counts.idle} />
      </div>

      <div className="pdm-live-grid">
        {rows.map((m) => (
          <MachineCard
            key={m.machineID}
            snap={m}
            highlighted={m.machineID === highlightedMachine}
            onClick={() => onSelect(m)}
          />
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="pdm-empty">No machines match filter</div>
      )}

      <div className="pdm-pagination">
        <span className="pdm-pagination-info">
          Showing {sorted.length === 0 ? 0 : start + 1}–{Math.min(start + PAGE_SIZE, sorted.length)} of {sorted.length}
        </span>
        <Pagination page={cur} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}

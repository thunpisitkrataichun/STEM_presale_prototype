import { useState, useMemo, useEffect } from "react";
import {
  SENSOR_LABEL,
  type LiveSnapshot, type LiveStatus, type SensorKey,
} from "../../../data/liveMonitorData";
import MachineCard from "./MachineCard";
import Pagination from "../overview/Pagination";

const PAGE_SIZE = 16;

type SortKey = "anomaly" | "id" | "util";
type UtilBand = "high" | "mid" | "low";

const STATUS_OPTIONS: { key: LiveStatus; label: string }[] = [
  { key: "alarm", label: "🔴 Alarm" },
  { key: "running", label: "🟢 Running" },
  { key: "idle", label: "⚫ Idle" },
];

const SENSOR_OPTIONS: SensorKey[] = ["volt", "rotate", "pressure", "vibration"];

const UTIL_OPTIONS: { key: UtilBand; label: string }[] = [
  { key: "high", label: "≥ 80%" },
  { key: "mid", label: "50–79%" },
  { key: "low", label: "< 50%" },
];

function utilBand(util: number): UtilBand {
  if (util >= 80) return "high";
  if (util >= 50) return "mid";
  return "low";
}

// Toggle a value in a multi-select set, immutably
function toggled<T>(set: Set<T>, v: T): Set<T> {
  const next = new Set(set);
  if (next.has(v)) next.delete(v); else next.add(v);
  return next;
}

interface Props {
  snapshot: LiveSnapshot[];
  highlightedMachine: string | null;
  onSelect: (snap: LiveSnapshot) => void;
}

export default function MachineGrid({ snapshot, highlightedMachine, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("anomaly");
  const [statusSel, setStatusSel] = useState<Set<LiveStatus>>(new Set());
  const [modelSel, setModelSel] = useState<Set<string>>(new Set());
  const [sensorSel, setSensorSel] = useState<Set<SensorKey>>(new Set());
  const [utilSel, setUtilSel] = useState<Set<UtilBand>>(new Set());
  const [page, setPage] = useState(1);

  const counts = useMemo(() => ({
    alarm: snapshot.filter((m) => m.status === "alarm").length,
    running: snapshot.filter((m) => m.status === "running").length,
    idle: snapshot.filter((m) => m.status === "idle").length,
  }), [snapshot]);

  const models = useMemo(
    () => [...new Set(snapshot.map((m) => m.model))].sort(),
    [snapshot],
  );

  const activeFilters =
    statusSel.size + modelSel.size + sensorSel.size + utilSel.size;

  const clearFilters = () => {
    setStatusSel(new Set());
    setModelSel(new Set());
    setSensorSel(new Set());
    setUtilSel(new Set());
    setPage(1);
  };

  // Within a group = OR, across groups = AND, empty group = no constraint
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return snapshot.filter((m) => {
      if (statusSel.size > 0 && !statusSel.has(m.status)) return false;
      if (modelSel.size > 0 && !modelSel.has(m.model)) return false;
      if (sensorSel.size > 0 &&
          ![...sensorSel].some((s) => m.sensors[s].isAnomaly)) return false;
      if (utilSel.size > 0 && !utilSel.has(utilBand(m.utilization))) return false;
      if (q && !m.machineID.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [snapshot, search, statusSel, modelSel, sensorSel, utilSel]);

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

  const Chip = ({ active, label, badge, onToggle }: {
    active: boolean; label: string; badge?: number; onToggle: () => void;
  }) => (
    <button
      type="button"
      className={"pdm-chip" + (active ? " active" : "")}
      aria-pressed={active}
      onClick={() => { onToggle(); setPage(1); }}
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

      <div className="pdm-filter-groups">
        <div className="pdm-filter-group">
          <span className="pdm-filter-glabel">Status</span>
          {STATUS_OPTIONS.map(({ key, label }) => (
            <Chip
              key={key}
              active={statusSel.has(key)}
              label={label}
              badge={counts[key]}
              onToggle={() => setStatusSel((prev) => toggled(prev, key))}
            />
          ))}
        </div>
        <div className="pdm-filter-group">
          <span className="pdm-filter-glabel">Model</span>
          {models.map((mo) => (
            <Chip
              key={mo}
              active={modelSel.has(mo)}
              label={mo}
              onToggle={() => setModelSel((prev) => toggled(prev, mo))}
            />
          ))}
        </div>
        <div className="pdm-filter-group">
          <span className="pdm-filter-glabel">Sensor alert</span>
          {SENSOR_OPTIONS.map((s) => (
            <Chip
              key={s}
              active={sensorSel.has(s)}
              label={SENSOR_LABEL[s]}
              onToggle={() => setSensorSel((prev) => toggled(prev, s))}
            />
          ))}
        </div>
        <div className="pdm-filter-group">
          <span className="pdm-filter-glabel">Utilization</span>
          {UTIL_OPTIONS.map(({ key, label }) => (
            <Chip
              key={key}
              active={utilSel.has(key)}
              label={label}
              onToggle={() => setUtilSel((prev) => toggled(prev, key))}
            />
          ))}
          {activeFilters > 0 && (
            <button
              type="button"
              className="pdm-chip pdm-chip-clear"
              onClick={clearFilters}
            >
              Clear filters ({activeFilters}) ×
            </button>
          )}
        </div>
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

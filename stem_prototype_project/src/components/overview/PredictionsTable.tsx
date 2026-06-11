import { useState } from "react";
import {
  statusFromDays, STATUS_COLOR, TEST_MACHINE_ID,
  type MachinePrediction, type RiskStatus,
} from "../../../data/modelData";
import ModelBadge from "./ModelBadge";
import Pagination from "./Pagination";
import { exportPredictionsXlsx } from "../../utils/exportPredictions";

type SortKey = "machineID" | "model" | "age" | "daysToFailure" | "status" | "maint";
type SortDir = "asc" | "desc";

const STATUS_RANK: Record<RiskStatus, number> = {
  Critical: 0,
  Warning: 1,
  Watch: 2,
  Normal: 3,
};

const PAGE_SIZE = 20;

interface Props {
  machines: MachinePrediction[];
  onSelect: (m: MachinePrediction) => void;
}

export default function PredictionsTable({ machines, onSelect }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("daysToFailure");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  const query = search.trim().toLowerCase();
  const filtered = query
    ? machines.filter((m) => m.machineID.toLowerCase().includes(query))
    : machines;

  const rows = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "machineID":
        cmp = a.machineID.localeCompare(b.machineID);
        break;
      case "model":
        cmp = a.model.localeCompare(b.model);
        break;
      case "age":
        cmp = a.age - b.age;
        break;
      case "daysToFailure":
        cmp = a.daysToFailure - b.daysToFailure;
        break;
      case "status":
        cmp =
          STATUS_RANK[statusFromDays(a.daysToFailure)] -
          STATUS_RANK[statusFromDays(b.daysToFailure)];
        break;
      case "maint":
        // false (-) before true (Yes), then by machineID for stability
        cmp = (a.underMaintenance ? 1 : 0) - (b.underMaintenance ? 1 : 0);
        if (cmp === 0) cmp = a.machineID.localeCompare(b.machineID);
        break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = rows.slice(start, start + PAGE_SIZE);

  const arrow = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  const headerCell = (key: SortKey, label: string) => (
    <th
      onClick={() => handleSort(key)}
      style={{ cursor: "pointer", userSelect: "none" }}
      aria-sort={
        sortKey === key ? (sortDir === "asc" ? "ascending" : "descending") : "none"
      }
    >
      {label}
      <span style={{ opacity: sortKey === key ? 1 : 0.3 }}>{arrow(key) || " ↕"}</span>
    </th>
  );

  const rangeStart = rows.length === 0 ? 0 : start + 1;
  const rangeEnd = Math.min(start + PAGE_SIZE, rows.length);

  return (
    <>
      <div className="pdm-phead">
        <span className="pdm-pt">
          Machine RUL Predictions <ModelBadge inline />
        </span>
        <div className="pdm-phead-actions">
          <input
            type="text"
            className="pdm-search"
            placeholder="Search machine ID..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            aria-label="Search by machine ID"
          />
          <button
            type="button"
            className="pdm-export-btn"
            onClick={() => exportPredictionsXlsx(machines)}
            title="Export all machine predictions as a styled Excel report"
          >
            ⬇ Export Excel
          </button>
        </div>
      </div>

      <table className="pdm-table">
        <thead>
          <tr>
            {headerCell("machineID", "Machine")}
            {headerCell("model", "Model")}
            {headerCell("age", "Age")}
            {headerCell("daysToFailure", "Days To Failure")}
            {headerCell("maint", "Maintenance")}
            {headerCell("status", "Status")}
          </tr>
        </thead>
        <tbody>
          {pageRows.map((m) => {
            const st = statusFromDays(m.daysToFailure);
            return (
              <tr
                key={m.machineID}
                className={"clickable" + (m.machineID === TEST_MACHINE_ID ? " test" : "")}
                onClick={() => onSelect(m)}
              >
                <td style={{ fontWeight: 600 }}>{m.machineID}</td>
                <td>{m.model}</td>
                <td>{m.age}</td>
                <td className="pdm-days-cell" style={{ color: STATUS_COLOR[st] }}>
                  {m.daysToFailure.toFixed(1)}
                </td>
                <td className={"pdm-maint-cell" + (m.underMaintenance ? " yes" : "")}>
                  {m.underMaintenance ? "Yes" : "-"}
                </td>
                <td>
                  <span className={"pdm-status " + st.toLowerCase()}>{st}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {rows.length === 0 && (
        <div className="pdm-empty">No machines match "{search}"</div>
      )}

      <div className="pdm-pagination">
        <span className="pdm-pagination-info">
          Showing {rangeStart}–{rangeEnd} of {rows.length}
        </span>
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          onChange={setPage}
        />
      </div>
    </>
  );
}

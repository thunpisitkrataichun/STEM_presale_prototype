import { type DataSettings } from "../../../../data/settingsData";
import { LAST_SYNC } from "../../../../data/modelData";
import XlsxUploader from "../../XlsxUploader";

interface Props {
  value: DataSettings;
  onChange: (next: DataSettings) => void;
}

const SOURCES = [
  { name: "Telemetry",   status: "Connected", last: "5 min ago",  ok: true },
  { name: "Failures",    status: "Connected", last: "1 hr ago",   ok: true },
  { name: "Maintenance", status: "Connected", last: "12 hr ago",  ok: true },
  { name: "ERP System",  status: "Manual",    last: "7 days ago", ok: false },
];

const INTERVALS: { value: DataSettings["refreshIntervalMin"]; label: string }[] = [
  { value: 1,  label: "1 min" },
  { value: 5,  label: "5 min" },
  { value: 15, label: "15 min" },
  { value: 0,  label: "Manual" },
];

export default function DataSourcesTab({ value, onChange }: Props) {
  return (
    <div className="pdm-settings-panel">
      <h2 className="pdm-settings-h">Data Sources</h2>
      <p className="pdm-settings-sub">Connection status and data export</p>

      <h3 className="pdm-settings-h3">Connection Status</h3>
      <div className="pdm-source-list">
        {SOURCES.map((s) => (
          <div key={s.name} className="pdm-source-row">
            <span
              className="pdm-led"
              style={{ background: s.ok ? "var(--risk-normal)" : "var(--risk-warning)" }}
            />
            <span style={{ fontWeight: 600, color: "var(--ink)", flex: "0 0 130px" }}>
              {s.name}
            </span>
            <span style={{
              fontSize: 12, fontWeight: 600,
              color: s.ok ? "var(--risk-normal)" : "var(--risk-warning)",
              flex: "0 0 90px",
            }}>{s.status}</span>
            <span style={{ fontSize: 11, color: "var(--ink-muted)" }}>
              Last {s.last}
            </span>
          </div>
        ))}
      </div>

      <h3 className="pdm-settings-h3">Refresh Interval</h3>
      <div className="pdm-radio-row">
        {INTERVALS.map((i) => (
          <label key={i.value} className="pdm-radio">
            <input
              type="radio" name="refresh"
              checked={value.refreshIntervalMin === i.value}
              onChange={() => onChange({ ...value, refreshIntervalMin: i.value })}
            />
            {i.label}
          </label>
        ))}
      </div>

      <div style={{
        padding: 10, marginTop: 12,
        background: "var(--blue-25)", borderRadius: 6,
        fontSize: 12, color: "var(--ink-muted)",
      }}>
        Last Sync: <strong style={{ color: "var(--ink)" }}>{LAST_SYNC}</strong>
        {" · "}
        Total Records: <strong style={{ color: "var(--ink)" }}>876,432</strong>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button type="button" className="pdm-modal-btn pdm-modal-confirm">
          ↻ Refresh Now
        </button>
      </div>

      <XlsxUploader />
    </div>
  );
}

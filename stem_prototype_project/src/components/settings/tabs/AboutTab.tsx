export default function AboutTab() {
  const rows = [
    ["Version",     "0.0.1-prototype"],
    ["Build Date",  "2026-06-04"],
    ["ML Model",    "XGBoost v2.0.3"],
    ["Model MAE",   "17 Days"],
    ["React",       "18.x"],
    ["Bundle",      "Vite · offline-safe"],
  ];

  return (
    <div className="pdm-settings-panel">
      <h2 className="pdm-settings-h">About</h2>
      <p className="pdm-settings-sub">System information</p>

      <div style={{
        display: "flex", alignItems: "center", gap: 16,
        padding: 14, background: "var(--blue-25)", borderRadius: 8,
        marginBottom: 16,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 12,
          background: "linear-gradient(135deg, #1f9e54 0%, #2a5896 100%)",
          color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26, fontWeight: 700, fontStyle: "italic",
          fontFamily: "Georgia, serif",
        }}>S</div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)" }}>
            Predictive Maintenance System
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>
            Sango Thai Engineering &amp; Manufacturing Co., Ltd.
          </div>
        </div>
      </div>

      <table className="pdm-table" style={{ marginBottom: 18 }}>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td style={{ fontWeight: 600, width: 160, color: "var(--ink-muted)" }}>{k}</td>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{
        padding: 12, background: "var(--blue-25)", borderRadius: 8,
        fontSize: 12, color: "var(--ink-muted)", marginBottom: 18,
      }}>
        Developed for <strong style={{ color: "var(--ink)" }}>Fujitsu Presale Demo</strong>{" "}
        · Fully offline · Predictions run in-browser via bundled XGBoost trees.
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="pdm-page-btn">📖 Documentation</button>
        <button type="button" className="pdm-page-btn">💬 Contact Support</button>
        <button type="button" className="pdm-page-btn">📋 Changelog</button>
        <button type="button" className="pdm-page-btn">⚖ License (MIT)</button>
      </div>

      <div style={{
        marginTop: 20, fontSize: 11, color: "var(--ink-faint)", textAlign: "center",
      }}>
        © 2026 STEM. All rights reserved.
      </div>
    </div>
  );
}

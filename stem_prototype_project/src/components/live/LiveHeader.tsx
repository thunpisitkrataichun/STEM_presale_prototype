interface Props {
  lastUpdate: Date;
  paused: boolean;
  onTogglePause: () => void;
  onRefresh: () => void;
}

function fmt(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

export default function LiveHeader({ lastUpdate, paused, onTogglePause, onRefresh }: Props) {
  return (
    <div className="pdm-top">
      <div>
        <h1 className="pdm-title">Live Monitor</h1>
        <p className="pdm-sub">Real-time machine telemetry &amp; alarms</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="pdm-pill" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: paused ? "#fcf2e0" : "#e6f5ee",
          borderColor: paused ? "#e8a33d" : "#2fab6f",
          color: paused ? "#9c6b1e" : "#1c7a4e",
        }}>
          <span className={"pdm-live-dot" + (paused ? " paused" : "")} />
          {paused ? "PAUSED" : "LIVE"} · {fmt(lastUpdate)}
        </span>
        <button
          type="button"
          className="pdm-page-btn"
          onClick={onTogglePause}
        >
          {paused ? "▶ Resume" : "⏸ Pause"}
        </button>
        <button type="button" className="pdm-page-btn" onClick={onRefresh}>↻ Refresh</button>
      </div>
    </div>
  );
}

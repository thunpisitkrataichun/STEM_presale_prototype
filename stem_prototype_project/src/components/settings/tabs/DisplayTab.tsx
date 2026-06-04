import {
  type DisplaySettings, type Theme, type AccentColor,
  type DateFormat, type TimeFormat, type Density,
} from "../../../../data/settingsData";

interface Props {
  value: DisplaySettings;
  onChange: (next: DisplaySettings) => void;
}

const ACCENT_COLORS: { key: AccentColor; color: string }[] = [
  { key: "blue",   color: "#2a5896" },
  { key: "green",  color: "#1f9e54" },
  { key: "purple", color: "#9c6bd9" },
  { key: "orange", color: "#e8a33d" },
];

export default function DisplayTab({ value, onChange }: Props) {
  const update = <K extends keyof DisplaySettings>(k: K, v: DisplaySettings[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="pdm-settings-panel">
      <h2 className="pdm-settings-h">Display</h2>
      <p className="pdm-settings-sub">Theme, formats and visual density</p>

      <h3 className="pdm-settings-h3">Theme</h3>
      <div className="pdm-theme-row">
        {(["light", "dark", "auto"] as Theme[]).map((t) => (
          <button
            key={t}
            type="button"
            className={"pdm-theme-tile" + (value.theme === t ? " active" : "")}
            onClick={() => update("theme", t)}
          >
            <div className={"pdm-theme-preview " + t} />
            <span>{t === "light" ? "Light" : t === "dark" ? "Dark" : "Auto"}</span>
          </button>
        ))}
      </div>

      <h3 className="pdm-settings-h3">Accent Color</h3>
      <div className="pdm-radio-row">
        {ACCENT_COLORS.map((c) => (
          <button
            key={c.key}
            type="button"
            className={"pdm-accent-swatch" + (value.accent === c.key ? " active" : "")}
            style={{ background: c.color }}
            onClick={() => update("accent", c.key)}
            aria-label={c.key}
            title={c.key}
          />
        ))}
      </div>

      <h3 className="pdm-settings-h3">Date Format</h3>
      <div className="pdm-radio-row">
        {(["iso", "long", "short"] as DateFormat[]).map((d) => (
          <label key={d} className="pdm-radio">
            <input
              type="radio" name="datefmt"
              checked={value.dateFormat === d}
              onChange={() => update("dateFormat", d)}
            />
            {d === "iso" ? "2026-06-04" : d === "long" ? "Jun 4, 2026" : "04/06/26"}
          </label>
        ))}
      </div>

      <h3 className="pdm-settings-h3">Time Format</h3>
      <div className="pdm-radio-row">
        {(["24h", "12h"] as TimeFormat[]).map((t) => (
          <label key={t} className="pdm-radio">
            <input
              type="radio" name="timefmt"
              checked={value.timeFormat === t}
              onChange={() => update("timeFormat", t)}
            />
            {t === "24h" ? "24-hour (14:30)" : "12-hour (2:30 PM)"}
          </label>
        ))}
      </div>

      <h3 className="pdm-settings-h3">Density</h3>
      <div className="pdm-radio-row">
        {(["compact", "comfortable", "spacious"] as Density[]).map((d) => (
          <label key={d} className="pdm-radio">
            <input
              type="radio" name="density"
              checked={value.density === d}
              onChange={() => update("density", d)}
            />
            {d.charAt(0).toUpperCase() + d.slice(1)}
          </label>
        ))}
      </div>

      <h3 className="pdm-settings-h3">Misc</h3>
      <div className="pdm-toggle-list">
        <label className="pdm-toggle-row">
          <input
            type="checkbox"
            checked={value.showThaiLabels}
            onChange={(e) => update("showThaiLabels", e.target.checked)}
          />
          <span>Show Thai labels alongside English</span>
        </label>
        <label className="pdm-toggle-row">
          <input
            type="checkbox"
            checked={value.enableBeta}
            onChange={(e) => update("enableBeta", e.target.checked)}
          />
          <span>Enable beta features</span>
        </label>
      </div>
    </div>
  );
}

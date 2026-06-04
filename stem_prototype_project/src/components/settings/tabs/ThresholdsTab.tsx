import { type ThresholdSettings, DEFAULT_SETTINGS } from "../../../../data/settingsData";

interface Props {
  value: ThresholdSettings;
  onChange: (next: ThresholdSettings) => void;
}

const SENSORS: { key: keyof ThresholdSettings["sensor"]; label: string; unit: string }[] = [
  { key: "volt",      label: "Volt",      unit: "V" },
  { key: "rotate",    label: "Rotate",    unit: "RPM" },
  { key: "pressure",  label: "Pressure",  unit: "kPa" },
  { key: "vibration", label: "Vibration", unit: "mm/s" },
];

export default function ThresholdsTab({ value, onChange }: Props) {
  const validOrder = value.critical < value.watch;

  const updateSensor = (
    key: keyof ThresholdSettings["sensor"],
    field: "min" | "max",
    v: number,
  ) => {
    onChange({
      ...value,
      sensor: { ...value.sensor, [key]: { ...value.sensor[key], [field]: v } },
    });
  };

  const reset = () => onChange(DEFAULT_SETTINGS.thresholds);

  return (
    <div className="pdm-settings-panel">
      <h2 className="pdm-settings-h">Model Thresholds</h2>
      <p className="pdm-settings-sub">
        Tune classification cutoffs · affects Overview pie chart, table status &amp; at-risk filter
      </p>

      <h3 className="pdm-settings-h3">Risk Classification</h3>

      <div className="pdm-form-field">
        <label>Critical · less than (days)</label>
        <div className="pdm-slider-row">
          <input
            type="range"
            min={1} max={29}
            value={value.critical}
            onChange={(e) => onChange({ ...value, critical: Number(e.target.value) })}
            style={{ flex: 1, accentColor: "var(--risk-critical)" }}
          />
          <span className="pdm-slider-val" style={{ color: "var(--risk-critical)" }}>
            {value.critical} days
          </span>
        </div>
      </div>

      <div className="pdm-form-field">
        <label>Watch · less than (days)</label>
        <div className="pdm-slider-row">
          <input
            type="range"
            min={value.critical + 1} max={90}
            value={value.watch}
            onChange={(e) => onChange({ ...value, watch: Number(e.target.value) })}
            style={{ flex: 1, accentColor: "var(--risk-warning)" }}
          />
          <span className="pdm-slider-val" style={{ color: "var(--risk-warning)" }}>
            {value.watch} days
          </span>
        </div>
      </div>

      <div className="pdm-form-field">
        <label>Normal</label>
        <span style={{ fontSize: 13, color: "var(--risk-normal)", fontWeight: 600 }}>
          ≥ {value.watch} days <span style={{ color: "var(--ink-muted)", fontWeight: 500 }}>(auto)</span>
        </span>
      </div>

      {!validOrder && (
        <div className="pdm-modal-error" style={{ marginBottom: 10 }}>
          ⚠ Critical must be less than Watch
        </div>
      )}

      <h3 className="pdm-settings-h3">Sensor Anomaly Thresholds</h3>
      <div className="pdm-sensor-grid">
        <div className="pdm-sensor-header">
          <span></span><span>Min</span><span>Max</span><span>Unit</span>
        </div>
        {SENSORS.map((s) => (
          <div key={s.key} className="pdm-sensor-row">
            <span className="pdm-sensor-label">{s.label}</span>
            <input
              type="number"
              className="pdm-modal-input"
              value={value.sensor[s.key].min}
              onChange={(e) => updateSensor(s.key, "min", Number(e.target.value))}
            />
            <input
              type="number"
              className="pdm-modal-input"
              value={value.sensor[s.key].max}
              onChange={(e) => updateSensor(s.key, "max", Number(e.target.value))}
            />
            <span className="pdm-sensor-unit">{s.unit}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="pdm-modal-btn pdm-modal-reset"
        style={{ marginTop: 14 }}
        onClick={reset}
      >
        ↻ Reset to Defaults
      </button>
    </div>
  );
}

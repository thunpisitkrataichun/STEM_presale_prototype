import { useEffect, useState } from "react";
import {
  statusFromDays, STATUS_COLOR,
  type MachinePrediction,
} from "../../../data/modelData";
import { predictDaysToFailure } from "../../lib/predict";

interface Props {
  machine: MachinePrediction;
  // Provided only when the machine is editable (M006). Reset reverts to this.
  baseline?: MachinePrediction;
  // Called when the user confirms new sensor values (editable mode only).
  onSave?: (updated: MachinePrediction) => void;
  onClose: () => void;
}

const MODELS = ["model1", "model2", "model3", "model4"];

export default function MachineDetailModal({
  machine, baseline, onSave, onClose,
}: Props) {
  const isEditable = Boolean(baseline && onSave);

  // form holds the values being edited; predicted holds the latest model output
  const [form, setForm] = useState<MachinePrediction>(machine);
  const [flashPred, setFlashPred] = useState(false);

  // Reset form whenever a different machine is opened in the modal
  useEffect(() => { setForm(machine); }, [machine.machineID]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const st = statusFromDays(form.daysToFailure);

  const update = <K extends keyof MachinePrediction>(key: K, val: MachinePrediction[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
  };

  const handleConfirm = () => {
    if (!isEditable) return;
    const dtf = predictDaysToFailure({
      age: form.age,
      model: form.model,
      volt: form.volt,
      rotate: form.rotate,
      pressure: form.pressure,
      vibration: form.vibration,
      underMaintenance: form.underMaintenance,
    });
    const updated = { ...form, daysToFailure: dtf };
    setForm(updated);
    onSave?.(updated);
    setFlashPred(true);
    setTimeout(() => setFlashPred(false), 700);
  };

  const handleReset = () => {
    if (!baseline) return;
    setForm(baseline);
    onSave?.(baseline);
    setFlashPred(true);
    setTimeout(() => setFlashPred(false), 700);
  };

  return (
    <div className="pdm-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="pdm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdm-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pdm-modal-head">
          <div>
            <div id="pdm-modal-title" className="pdm-modal-title">
              <span className="pdm-led" style={{ background: STATUS_COLOR[st] }} />
              {form.machineID}
              {isEditable && <span className="pdm-test-badge">TEST</span>}
            </div>
            <div className="pdm-modal-sub">
              {isEditable
                ? "Editable test machine · tweak inputs and confirm to re-run the model"
                : "Machine Details · Live Sensor Snapshot"}
            </div>
          </div>
        </div>

        <div className="pdm-modal-grid">
          <div className="pdm-modal-field">
            <label>Machine ID</label>
            <span>{form.machineID}</span>
          </div>
          <div className="pdm-modal-field">
            <label>Model</label>
            {isEditable ? (
              <select
                className="pdm-modal-select"
                value={form.model}
                onChange={(e) => update("model", e.target.value)}
              >
                {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            ) : <span>{form.model}</span>}
          </div>
          <div className="pdm-modal-field">
            <label>Age</label>
            {isEditable ? (
              <input
                className="pdm-modal-input"
                type="number" min={0} max={50} step={1}
                value={form.age}
                onChange={(e) => update("age", Number(e.target.value))}
              />
            ) : <span>{form.age} years</span>}
          </div>
          <div className="pdm-modal-field">
            <label>Volt (V)</label>
            {isEditable ? (
              <input
                className="pdm-modal-input"
                type="number" step={0.1}
                value={form.volt}
                onChange={(e) => update("volt", Number(e.target.value))}
              />
            ) : <span>{form.volt.toFixed(1)} V</span>}
          </div>
          <div className="pdm-modal-field">
            <label>Rotate (RPM)</label>
            {isEditable ? (
              <input
                className="pdm-modal-input"
                type="number" step={0.1}
                value={form.rotate}
                onChange={(e) => update("rotate", Number(e.target.value))}
              />
            ) : <span>{form.rotate.toFixed(1)} RPM</span>}
          </div>
          <div className="pdm-modal-field">
            <label>Pressure (kPa)</label>
            {isEditable ? (
              <input
                className="pdm-modal-input"
                type="number" step={0.1}
                value={form.pressure}
                onChange={(e) => update("pressure", Number(e.target.value))}
              />
            ) : <span>{form.pressure.toFixed(1)} kPa</span>}
          </div>
          <div className="pdm-modal-field">
            <label>Vibration (mm/s)</label>
            {isEditable ? (
              <input
                className="pdm-modal-input"
                type="number" step={0.1}
                value={form.vibration}
                onChange={(e) => update("vibration", Number(e.target.value))}
              />
            ) : <span>{form.vibration.toFixed(1)} mm/s</span>}
          </div>
          <div className="pdm-modal-field">
            <label>Under Maintenance</label>
            {isEditable ? (
              <label className="pdm-modal-toggle">
                <input
                  type="checkbox"
                  checked={form.underMaintenance}
                  onChange={(e) => update("underMaintenance", e.target.checked)}
                />
                {form.underMaintenance ? "Yes" : "No"}
              </label>
            ) : (
              <span>
                <span className={"pdm-modal-maint " + (form.underMaintenance ? "yes" : "no")}>
                  {form.underMaintenance ? "Yes" : "No"}
                </span>
              </span>
            )}
          </div>
        </div>

        {isEditable && (
          <div className={"pdm-modal-prediction" + (flashPred ? " updated" : "")}>
            <span className="pdm-modal-prediction-label">Predicted Days To Failure</span>
            <span className="pdm-modal-prediction-val" style={{ color: STATUS_COLOR[st] }}>
              {form.daysToFailure.toFixed(1)}<span className="unit">days</span>
            </span>
          </div>
        )}

        <div className="pdm-modal-footer" style={{ marginTop: 18 }}>
          {isEditable && (
            <>
              <button
                className="pdm-modal-btn pdm-modal-reset"
                onClick={handleReset}
                aria-label="Reset values"
              >
                Reset
              </button>
              <button
                className="pdm-modal-btn pdm-modal-confirm"
                onClick={handleConfirm}
                aria-label="Confirm and re-run model"
              >
                ยืนยัน
              </button>
            </>
          )}
          <button
            className="pdm-modal-btn pdm-modal-close"
            onClick={onClose}
            aria-label="Close machine details"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

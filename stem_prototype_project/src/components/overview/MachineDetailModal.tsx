import { useEffect } from "react";
import {
  statusFromDays, STATUS_COLOR,
  type MachinePrediction,
} from "../../../data/modelData";

interface Props {
  machine: MachinePrediction;
  onClose: () => void;
}

export default function MachineDetailModal({ machine, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const st = statusFromDays(machine.daysToFailure);

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
              {machine.machineID}
            </div>
            <div className="pdm-modal-sub">Machine Details · Live Sensor Snapshot</div>
          </div>
        </div>

        <div className="pdm-modal-grid">
          <div className="pdm-modal-field">
            <label>Machine ID</label>
            <span>{machine.machineID}</span>
          </div>
          <div className="pdm-modal-field">
            <label>Model</label>
            <span>{machine.model}</span>
          </div>
          <div className="pdm-modal-field">
            <label>Age</label>
            <span>{machine.age} years</span>
          </div>
          <div className="pdm-modal-field">
            <label>Volt</label>
            <span>{machine.volt.toFixed(1)} V</span>
          </div>
          <div className="pdm-modal-field">
            <label>Rotate</label>
            <span>{machine.rotate.toFixed(1)} RPM</span>
          </div>
          <div className="pdm-modal-field">
            <label>Pressure</label>
            <span>{machine.pressure.toFixed(1)} kPa</span>
          </div>
          <div className="pdm-modal-field">
            <label>Vibration</label>
            <span>{machine.vibration.toFixed(1)} mm/s</span>
          </div>
          <div className="pdm-modal-field">
            <label>Under Maintenance</label>
            <span>
              <span className={"pdm-modal-maint " + (machine.underMaintenance ? "yes" : "no")}>
                {machine.underMaintenance ? "Yes" : "No"}
              </span>
            </span>
          </div>
        </div>

        <div className="pdm-modal-footer">
          <button
            className="pdm-modal-close"
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

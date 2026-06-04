import { useEffect, useState } from "react";
import {
  type MaintenanceJob, type MaintenanceType, type MaintenanceStatus,
  TECHNICIANS, MAINTENANCE_TYPES, TYPE_COLOR, STATUS_COLOR_MAINT, formatTime,
} from "../../../data/maintenanceData";

interface Props {
  job: MaintenanceJob;
  onSave: (updated: MaintenanceJob) => void;
  onCancel: (job: MaintenanceJob) => void;
  onClose: () => void;
}

const STATUSES: MaintenanceStatus[] = ["Scheduled", "InProgress", "Completed", "Cancelled"];

export default function MaintenanceJobModal({ job, onSave, onCancel, onClose }: Props) {
  const [form, setForm] = useState<MaintenanceJob>(job);

  useEffect(() => { setForm(job); }, [job.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const update = <K extends keyof MaintenanceJob>(k: K, v: MaintenanceJob[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const readonly = form.status === "Completed" || form.status === "Cancelled";

  return (
    <div className="pdm-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="pdm-modal"
        style={{ maxWidth: 500 }}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pdm-modal-head">
          <div>
            <div className="pdm-modal-title">
              <span className="pdm-led" style={{ background: TYPE_COLOR[form.type] }} />
              {form.id} · {form.machineID}
            </div>
            <div className="pdm-modal-sub">
              Maintenance Job · {form.type} ·{" "}
              <span style={{ color: STATUS_COLOR_MAINT[form.status], fontWeight: 600 }}>
                {form.status}
              </span>
            </div>
          </div>
        </div>

        <div className="pdm-modal-grid">
          <div className="pdm-modal-field">
            <label>Machine</label>
            <span>{form.machineID}</span>
          </div>
          <div className="pdm-modal-field">
            <label>Date</label>
            <input
              type="date"
              className="pdm-modal-input"
              value={form.date}
              disabled={readonly}
              onChange={(e) => update("date", e.target.value)}
            />
          </div>
          <div className="pdm-modal-field">
            <label>Time Slot</label>
            <select
              className="pdm-modal-select"
              value={form.timeSlot}
              disabled={readonly}
              onChange={(e) => update("timeSlot", e.target.value as MaintenanceJob["timeSlot"])}
            >
              <option value="morning">Morning · 09:00</option>
              <option value="afternoon">Afternoon · 13:00</option>
              <option value="full">Full Day · 08:00</option>
            </select>
          </div>
          <div className="pdm-modal-field">
            <label>Type</label>
            <select
              className="pdm-modal-select"
              value={form.type}
              disabled={readonly}
              onChange={(e) => update("type", e.target.value as MaintenanceType)}
            >
              {MAINTENANCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="pdm-modal-field">
            <label>Technician</label>
            <select
              className="pdm-modal-select"
              value={form.technician}
              disabled={readonly}
              onChange={(e) => update("technician", e.target.value)}
            >
              {TECHNICIANS.map((t) => (
                <option key={t.id} value={t.name}>{t.name} · {t.specialty}</option>
              ))}
            </select>
          </div>
          <div className="pdm-modal-field">
            <label>Duration (hrs)</label>
            <input
              type="number"
              className="pdm-modal-input"
              min={0.5} max={24} step={0.5}
              value={form.durationHours}
              disabled={readonly}
              onChange={(e) => update("durationHours", Number(e.target.value))}
            />
          </div>
          <div className="pdm-modal-field">
            <label>Status</label>
            <select
              className="pdm-modal-select"
              value={form.status}
              onChange={(e) => update("status", e.target.value as MaintenanceStatus)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s === "InProgress" ? "In Progress" : s}</option>
              ))}
            </select>
          </div>
          <div className="pdm-modal-field">
            <label>Scheduled Time</label>
            <span>{formatTime(form.timeSlot)}</span>
          </div>
          <div className="pdm-modal-field" style={{ gridColumn: "span 2" }}>
            <label>Notes</label>
            <textarea
              className="pdm-modal-input"
              style={{ height: 60, padding: 8, resize: "vertical" }}
              value={form.notes}
              disabled={readonly}
              onChange={(e) => update("notes", e.target.value)}
            />
          </div>
        </div>

        <div className="pdm-modal-footer" style={{ marginTop: 14 }}>
          {!readonly && form.status !== "Cancelled" && (
            <button
              className="pdm-modal-btn pdm-modal-reset"
              onClick={() => { onCancel(form); onClose(); }}
            >
              Cancel Job
            </button>
          )}
          {!readonly && (
            <button
              className="pdm-modal-btn pdm-modal-confirm"
              onClick={() => { onSave(form); onClose(); }}
            >
              Save Changes
            </button>
          )}
          <button
            className="pdm-modal-btn pdm-modal-close"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

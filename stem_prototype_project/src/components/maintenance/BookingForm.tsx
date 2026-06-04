import { useState, useEffect } from "react";
import { MACHINES } from "../../../data/modelData";
import {
  type MaintenanceJob, type MaintenanceType, type TimeSlot,
  TECHNICIANS, MAINTENANCE_TYPES, todayISO,
} from "../../../data/maintenanceData";

interface Props {
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  onSubmit: (job: Omit<MaintenanceJob, "id" | "status">) => void;
}

export default function BookingForm({
  selectedDate, onSelectDate, onSubmit,
}: Props) {
  const [machineID, setMachineID] = useState("M001");
  const [machineSearch, setMachineSearch] = useState("");
  const [timeSlot, setTimeSlot] = useState<TimeSlot>("morning");
  const [type, setType] = useState<MaintenanceType>("Preventive");
  const [technician, setTechnician] = useState(TECHNICIANS[0].name);
  const [duration, setDuration] = useState(2);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset success message when user starts editing again
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(false), 2500);
    return () => clearTimeout(t);
  }, [success]);

  const machineOptions = MACHINES
    .filter((m) => !machineSearch || m.machineID.toLowerCase().includes(machineSearch.toLowerCase()))
    .slice(0, 30);

  const today = todayISO();
  const isPastDate = selectedDate < today;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isPastDate) {
      setError("Cannot schedule maintenance in the past.");
      return;
    }
    if (!MACHINES.find((m) => m.machineID === machineID)) {
      setError("Please select a valid machine.");
      return;
    }
    onSubmit({
      machineID,
      date: selectedDate,
      timeSlot,
      type,
      technician,
      durationHours: duration,
      notes: notes.trim(),
    });
    setSuccess(true);
    setNotes("");
  };

  const handleCancel = () => {
    setMachineID("M001");
    setMachineSearch("");
    setTimeSlot("morning");
    setType("Preventive");
    setTechnician(TECHNICIANS[0].name);
    setDuration(2);
    setNotes("");
    setError(null);
  };

  return (
    <form className="pdm-panel" onSubmit={handleSubmit}>
      <div className="pdm-phead">
        <span className="pdm-pt">Schedule Maintenance</span>
      </div>

      <div className="pdm-form-grid">
        {/* Machine */}
        <div className="pdm-form-field">
          <label>Machine ID</label>
          <input
            type="text"
            className="pdm-search"
            style={{ width: "100%" }}
            placeholder="Search machine ID..."
            value={machineSearch}
            onChange={(e) => setMachineSearch(e.target.value)}
          />
          <select
            className="pdm-modal-select"
            value={machineID}
            onChange={(e) => setMachineID(e.target.value)}
          >
            {machineOptions.map((m) => (
              <option key={m.machineID} value={m.machineID}>
                {m.machineID} · {m.model} · {m.daysToFailure.toFixed(0)}d
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div className="pdm-form-field">
          <label>Date {isPastDate && <span style={{ color: "var(--risk-critical)" }}>· past</span>}</label>
          <input
            type="date"
            className="pdm-modal-input"
            value={selectedDate}
            min={today}
            onChange={(e) => onSelectDate(e.target.value)}
          />
        </div>

        {/* Time slot — radio */}
        <div className="pdm-form-field">
          <label>Time Slot</label>
          <div className="pdm-radio-row">
            {(["morning", "afternoon", "full"] as TimeSlot[]).map((s) => (
              <label key={s} className="pdm-radio">
                <input
                  type="radio"
                  name="timeslot"
                  checked={timeSlot === s}
                  onChange={() => setTimeSlot(s)}
                />
                {s === "morning" ? "Morning" : s === "afternoon" ? "Afternoon" : "Full Day"}
              </label>
            ))}
          </div>
        </div>

        {/* Type */}
        <div className="pdm-form-field">
          <label>Maintenance Type</label>
          <select
            className="pdm-modal-select"
            value={type}
            onChange={(e) => setType(e.target.value as MaintenanceType)}
          >
            {MAINTENANCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Technician */}
        <div className="pdm-form-field">
          <label>Technician</label>
          <select
            className="pdm-modal-select"
            value={technician}
            onChange={(e) => setTechnician(e.target.value)}
          >
            {TECHNICIANS.map((t) => (
              <option key={t.id} value={t.name}>{t.name} · {t.specialty}</option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div className="pdm-form-field">
          <label>Est. Duration (hours)</label>
          <input
            type="number"
            className="pdm-modal-input"
            min={0.5} max={24} step={0.5}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </div>

        {/* Notes */}
        <div className="pdm-form-field pdm-form-field-full">
          <label>Notes</label>
          <textarea
            className="pdm-modal-input"
            style={{ height: 64, padding: 8, resize: "vertical" }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional details..."
          />
        </div>
      </div>

      {error && <div className="pdm-modal-error">{error}</div>}
      {success && (
        <div style={{
          marginTop: 8, fontSize: 12, color: "var(--risk-normal)", fontWeight: 600,
        }}>
          ✓ Maintenance scheduled
        </div>
      )}

      <div className="pdm-modal-footer" style={{ marginTop: 14 }}>
        <button
          type="button"
          className="pdm-modal-btn pdm-modal-close"
          onClick={handleCancel}
        >
          Clear
        </button>
        <button
          type="submit"
          className="pdm-modal-btn pdm-modal-confirm"
          disabled={isPastDate}
        >
          Schedule
        </button>
      </div>
    </form>
  );
}

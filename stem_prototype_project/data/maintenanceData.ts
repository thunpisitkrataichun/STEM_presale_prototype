// ─────────────────────────────────────────────────────────────────────────
// Maintenance scheduling — types, technicians, and seed jobs.
// State lives in-memory at runtime (Maintenance page useState).
// ─────────────────────────────────────────────────────────────────────────

export type MaintenanceType =
  | "Preventive"
  | "Corrective"
  | "Inspection"
  | "Replacement";

export type MaintenanceStatus =
  | "Scheduled"
  | "InProgress"
  | "Completed"
  | "Cancelled";

export type TimeSlot = "morning" | "afternoon" | "full";

export interface MaintenanceJob {
  id: string;
  machineID: string;          // e.g. "M042"
  date: string;               // ISO "YYYY-MM-DD"
  timeSlot: TimeSlot;
  type: MaintenanceType;
  technician: string;
  durationHours: number;
  notes: string;
  status: MaintenanceStatus;
}

export interface Technician {
  id: string;
  name: string;
  specialty: string;
}

export const TECHNICIANS: Technician[] = [
  { id: "T01", name: "Somchai T.",  specialty: "Mechanical" },
  { id: "T02", name: "Anan W.",     specialty: "Electrical" },
  { id: "T03", name: "Wira K.",     specialty: "Inspection" },
  { id: "T04", name: "Pong S.",     specialty: "Hydraulics" },
  { id: "T05", name: "Niran B.",    specialty: "General" },
];

export const MAINTENANCE_TYPES: MaintenanceType[] = [
  "Preventive",
  "Corrective",
  "Inspection",
  "Replacement",
];

export const TYPE_COLOR: Record<MaintenanceType, string> = {
  Preventive:  "#5fa8e8",   // blue
  Corrective:  "#d9534f",   // red
  Inspection:  "#e8a33d",   // orange
  Replacement: "#9c6bd9",   // purple
};

export const STATUS_COLOR_MAINT: Record<MaintenanceStatus, string> = {
  Scheduled:  "#5fa8e8",
  InProgress: "#e8a33d",
  Completed:  "#2fab6f",
  Cancelled:  "#9aa9be",
};

// Build a fresh YYYY-MM-DD string offset N days from "today" in user TZ.
function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Seed jobs spread across the next few weeks for demo.
export const SEED_JOBS: MaintenanceJob[] = [
  {
    id: "MJ-0001", machineID: "M042", date: dateOffset(1),
    timeSlot: "morning", type: "Preventive", technician: "Somchai T.",
    durationHours: 2, notes: "Regular oil change", status: "Scheduled",
  },
  {
    id: "MJ-0002", machineID: "M070", date: dateOffset(1),
    timeSlot: "afternoon", type: "Corrective", technician: "Anan W.",
    durationHours: 4, notes: "Replace worn belt", status: "Scheduled",
  },
  {
    id: "MJ-0003", machineID: "M081", date: dateOffset(0),
    timeSlot: "morning", type: "Inspection", technician: "Wira K.",
    durationHours: 1, notes: "Vibration check", status: "InProgress",
  },
  {
    id: "MJ-0004", machineID: "M057", date: dateOffset(3),
    timeSlot: "morning", type: "Preventive", technician: "Somchai T.",
    durationHours: 2, notes: "", status: "Scheduled",
  },
  {
    id: "MJ-0005", machineID: "M020", date: dateOffset(10),
    timeSlot: "full", type: "Replacement", technician: "Anan W.",
    durationHours: 6, notes: "Replace bearing assembly", status: "Scheduled",
  },
  {
    id: "MJ-0006", machineID: "M099", date: dateOffset(-2),
    timeSlot: "morning", type: "Preventive", technician: "Pong S.",
    durationHours: 2, notes: "Quarterly service", status: "Completed",
  },
  {
    id: "MJ-0007", machineID: "M018", date: dateOffset(-5),
    timeSlot: "afternoon", type: "Inspection", technician: "Wira K.",
    durationHours: 1, notes: "Annual review", status: "Completed",
  },
  {
    id: "MJ-0008", machineID: "M033", date: dateOffset(-1),
    timeSlot: "morning", type: "Corrective", technician: "Niran B.",
    durationHours: 3, notes: "", status: "Scheduled",  // overdue
  },
  {
    id: "MJ-0009", machineID: "M044", date: dateOffset(6),
    timeSlot: "afternoon", type: "Preventive", technician: "Pong S.",
    durationHours: 2, notes: "", status: "Scheduled",
  },
  {
    id: "MJ-0010", machineID: "M062", date: dateOffset(14),
    timeSlot: "morning", type: "Inspection", technician: "Wira K.",
    durationHours: 1, notes: "", status: "Scheduled",
  },
];

// ── Date helpers ──────────────────────────────────────────────────────────
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isOverdue(job: MaintenanceJob): boolean {
  return job.status === "Scheduled" && job.date < todayISO();
}

export function formatTime(slot: TimeSlot): string {
  switch (slot) {
    case "morning":   return "09:00";
    case "afternoon": return "13:00";
    case "full":      return "08:00";
  }
}

export function formatDateLong(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

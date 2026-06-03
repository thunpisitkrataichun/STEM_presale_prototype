// ──────────────────────────────────────────────────────────────
// Mock data for the Overview page.
//
// โครงสร้างนี้ตรงกับ output ของ XGBoost model (days_to_failure)
// ตอนต่อ model จริง: แทนที่ MACHINES ด้านล่างด้วยผลจาก model.predict()
// แล้ว map ให้ได้ field เดียวกัน — ส่วน UI ไม่ต้องแก้
// ──────────────────────────────────────────────────────────────

export type RiskStatus = "Critical" | "Warning" | "Watch" | "Normal";

export interface MachinePrediction {
  machineID: string;
  model: string;            // model1 - model4
  age: number;              // years in service
  daysToFailure: number;    // 🤖 จาก XGBoost
  volt: number;
  rotate: number;
  pressure: number;
  vibration: number;
  underMaintenance: boolean;
}

// จัด status จาก daysToFailure (เกณฑ์เดียวกับ KPI)
export function statusFromDays(days: number): RiskStatus {
  if (days < 7) return "Critical";
  if (days < 14) return "Warning";
  if (days < 30) return "Watch";
  return "Normal";
}

export const STATUS_COLOR: Record<RiskStatus, string> = {
  Critical: "#d9534f",
  Warning: "#e8a33d",
  Watch: "#5fa8e8",
  Normal: "#2fab6f",
};

// ตัวอย่าง 12 เครื่อง (ของจริงมี 100)
export const MACHINES: MachinePrediction[] = [
  { machineID: "M007", model: "model3", age: 18, daysToFailure: 3.2,  volt: 198.3, rotate: 421, pressure: 109.8, vibration: 52.4, underMaintenance: false },
  { machineID: "M042", model: "model1", age: 14, daysToFailure: 5.6,  volt: 176.1, rotate: 398, pressure: 101.2, vibration: 48.9, underMaintenance: false },
  { machineID: "M015", model: "model4", age: 20, daysToFailure: 9.1,  volt: 184.0, rotate: 446, pressure: 95.3,  vibration: 41.2, underMaintenance: false },
  { machineID: "M088", model: "model2", age: 11, daysToFailure: 12.8, volt: 169.5, rotate: 452, pressure: 98.7,  vibration: 39.0, underMaintenance: false },
  { machineID: "M033", model: "model3", age: 16, daysToFailure: 18.4, volt: 172.8, rotate: 463, pressure: 92.1,  vibration: 36.6, underMaintenance: false },
  { machineID: "M061", model: "model1", age: 9,  daysToFailure: 24.0, volt: 165.2, rotate: 471, pressure: 89.4,  vibration: 34.1, underMaintenance: true  },
  { machineID: "M104", model: "model4", age: 7,  daysToFailure: 31.5, volt: 161.0, rotate: 488, pressure: 86.2,  vibration: 31.8, underMaintenance: false },
  { machineID: "M019", model: "model2", age: 13, daysToFailure: 38.2, volt: 170.4, rotate: 459, pressure: 90.0,  vibration: 33.5, underMaintenance: false },
  { machineID: "M050", model: "model3", age: 5,  daysToFailure: 45.7, volt: 158.9, rotate: 495, pressure: 84.1,  vibration: 29.7, underMaintenance: false },
  { machineID: "M002", model: "model1", age: 4,  daysToFailure: 52.3, volt: 156.2, rotate: 502, pressure: 82.6,  vibration: 28.2, underMaintenance: true  },
  { machineID: "M073", model: "model4", age: 8,  daysToFailure: 61.0, volt: 160.1, rotate: 498, pressure: 85.0,  vibration: 30.1, underMaintenance: false },
  { machineID: "M096", model: "model2", age: 6,  daysToFailure: 70.4, volt: 157.7, rotate: 507, pressure: 81.3,  vibration: 27.0, underMaintenance: false },
];

// RUL trend — ค่าเฉลี่ย days_to_failure ของ fleet ตามเวลา (🤖 จาก model)
export interface TrendPoint { label: string; value: number; }
export const RUL_TREND: TrendPoint[] = [
  { label: "Week 1", value: 41 },
  { label: "Week 2", value: 38 },
  { label: "Week 3", value: 40 },
  { label: "Week 4", value: 34 },
  { label: "Week 5", value: 31 },
  { label: "Week 6", value: 33 },
  { label: "Week 7", value: 28 },
  { label: "Week 8", value: 26 },
];

export const LAST_SYNC = "1H Ago";
export const TOTAL_MACHINES = 100;

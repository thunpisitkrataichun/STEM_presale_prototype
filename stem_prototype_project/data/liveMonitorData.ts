// ─────────────────────────────────────────────────────────────────────────
// Live Monitor — in-browser simulation of real-time telemetry.
// Seed from existing MACHINES, then random-walk on every tick.
// ─────────────────────────────────────────────────────────────────────────

import { MACHINES, type MachinePrediction } from "./modelData";

export type LiveStatus = "running" | "idle" | "alarm";
export type SensorKey = "volt" | "rotate" | "pressure" | "vibration";

export interface SensorReading {
  current: number;
  history: number[];
  threshold: { min: number; max: number };
  isAnomaly: boolean;
  zScore: number;
}

export interface LiveSnapshot {
  machineID: string;
  model: string;
  status: LiveStatus;
  utilization: number;        // 0-100
  idleSince?: string;
  sensors: Record<SensorKey, SensorReading>;
  primaryConcern?: SensorKey;
}

export interface ActiveAlarm {
  id: string;
  machineID: string;
  sensor: SensorKey;
  direction: "up" | "down";
  currentValue: number;
  threshold: number;
  triggeredAt: string;
  durationMin: number;
}

export interface SensorEvent {
  timestamp: string;
  type: "alarm" | "cycle_start" | "normal" | "anomaly_spike";
  message: string;
}

export const DEFAULT_THRESHOLDS: Record<SensorKey, { min: number; max: number }> = {
  volt:      { min: 150, max: 200 },
  rotate:    { min: 400, max: 500 },
  pressure:  { min: 85,  max: 115 },
  vibration: { min: 30,  max: 50  },
};

export const SENSOR_LABEL: Record<SensorKey, string> = {
  volt: "Volt", rotate: "Rotate", pressure: "Pressure", vibration: "Vibration",
};
export const SENSOR_UNIT: Record<SensorKey, string> = {
  volt: "V", rotate: "RPM", pressure: "kPa", vibration: "mm/s",
};

const SIGMA: Record<SensorKey, number> = {
  volt: 2.5,
  rotate: 6.0,
  pressure: 1.8,
  vibration: 1.4,
};

const HISTORY_LEN = 30;

// Box-Muller for normal random
function gauss(mean: number, sigma: number): number {
  const u1 = Math.random() || 0.0001;
  const u2 = Math.random();
  return mean + sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function buildSensor(base: number, sigma: number, thr: { min: number; max: number }): SensorReading {
  const history = Array.from({ length: HISTORY_LEN }, () => gauss(base, sigma));
  const current = history[history.length - 1];
  const mean = history.reduce((s, v) => s + v, 0) / HISTORY_LEN;
  return {
    current,
    history,
    threshold: thr,
    isAnomaly: current < thr.min || current > thr.max,
    zScore: Math.abs((current - mean) / sigma),
  };
}

export function buildInitialSnapshot(
  machines: MachinePrediction[] = MACHINES,
  thresholds = DEFAULT_THRESHOLDS,
): LiveSnapshot[] {
  return machines.map((m, idx) => {
    // ~78% running, ~18% idle, ~4% alarm initially
    const r = (idx * 7 + 13) % 100;
    let status: LiveStatus = "running";
    if (r < 4) status = "alarm";
    else if (r < 22) status = "idle";

    const sensors: Record<SensorKey, SensorReading> = {
      volt:      buildSensor(m.volt,      SIGMA.volt,      thresholds.volt),
      rotate:    buildSensor(m.rotate,    SIGMA.rotate,    thresholds.rotate),
      pressure:  buildSensor(m.pressure,  SIGMA.pressure,  thresholds.pressure),
      vibration: buildSensor(m.vibration, SIGMA.vibration, thresholds.vibration),
    };

    // For initial "alarm" machines, force one sensor outside threshold
    if (status === "alarm") {
      const s: SensorKey = (["vibration","pressure","volt","rotate"] as SensorKey[])[r % 4];
      const dir = idx % 2 === 0 ? 1 : -1;
      const target = dir > 0
        ? thresholds[s].max + Math.abs(gauss(2, 1.5))
        : thresholds[s].min - Math.abs(gauss(2, 1.5));
      sensors[s] = { ...sensors[s], current: target, isAnomaly: true };
      sensors[s].history[HISTORY_LEN - 1] = target;
    }

    // Determine primary concern
    let topZ = 0;
    let top: SensorKey | undefined;
    (Object.keys(sensors) as SensorKey[]).forEach((s) => {
      if (sensors[s].zScore > topZ || sensors[s].isAnomaly) {
        topZ = sensors[s].zScore;
        top = s;
      }
    });

    return {
      machineID: m.machineID,
      model: m.model,
      status,
      utilization: status === "idle" ? 0 : 65 + ((idx * 3) % 30),
      sensors,
      primaryConcern: top,
    };
  });
}

// Advance every machine by one tick (a few seconds of telemetry).
export function tickSnapshot(
  snap: LiveSnapshot[],
  thresholds = DEFAULT_THRESHOLDS,
): LiveSnapshot[] {
  return snap.map((m) => {
    if (m.status === "idle") {
      // Occasionally an idle machine resumes
      if (Math.random() < 0.01) {
        const base = MACHINES.find((x) => x.machineID === m.machineID);
        if (base) {
          const sensors: Record<SensorKey, SensorReading> = {
            volt:      buildSensor(base.volt,      SIGMA.volt,      thresholds.volt),
            rotate:    buildSensor(base.rotate,    SIGMA.rotate,    thresholds.rotate),
            pressure:  buildSensor(base.pressure,  SIGMA.pressure,  thresholds.pressure),
            vibration: buildSensor(base.vibration, SIGMA.vibration, thresholds.vibration),
          };
          return { ...m, status: "running", sensors, utilization: 70 };
        }
      }
      return m;
    }

    const newSensors: Record<SensorKey, SensorReading> = {} as Record<SensorKey, SensorReading>;
    let topZ = 0;
    let topSensor: SensorKey | undefined;
    let anyAnomaly = false;

    (["volt","rotate","pressure","vibration"] as SensorKey[]).forEach((s) => {
      const r = m.sensors[s];
      // Random walk with slight pull-back toward mean (mean reversion)
      const mean = r.history.reduce((sum, v) => sum + v, 0) / r.history.length;
      const drift = (mean - r.current) * 0.06;
      let next = r.current + drift + gauss(0, SIGMA[s] * 0.6);

      // Tiny chance of sensor spike
      if (Math.random() < 0.003) {
        next += (Math.random() < 0.5 ? -1 : 1) * SIGMA[s] * 6;
      }

      const thr = thresholds[s] ?? DEFAULT_THRESHOLDS[s];
      const isAnomaly = next < thr.min || next > thr.max;
      const newHistory = [...r.history.slice(1), next];
      const newMean = newHistory.reduce((sum, v) => sum + v, 0) / newHistory.length;
      const z = Math.abs((next - newMean) / SIGMA[s]);

      newSensors[s] = {
        current: next,
        history: newHistory,
        threshold: thr,
        isAnomaly,
        zScore: z,
      };
      if (isAnomaly) anyAnomaly = true;
      if (z > topZ) { topZ = z; topSensor = s; }
    });

    // ~0.5% chance a running machine goes idle
    let status: LiveStatus = anyAnomaly ? "alarm" : "running";
    let util = m.utilization;
    if (m.status !== "alarm" && Math.random() < 0.003) {
      status = "idle";
      util = 0;
    } else if (status === "running") {
      util = Math.max(60, Math.min(99, util + (Math.random() - 0.5) * 4));
    }

    return {
      ...m,
      sensors: newSensors,
      status,
      utilization: Math.round(util * 10) / 10,
      primaryConcern: topSensor,
    };
  });
}

// Derive currently-active alarms from a snapshot. Triggered time is approximated
// from when the sensor first went out-of-band — we keep a stable id by sensor.
export function deriveAlarms(snap: LiveSnapshot[], existing: ActiveAlarm[]): ActiveAlarm[] {
  const now = new Date();
  const existingById = new Map(existing.map((a) => [`${a.machineID}:${a.sensor}`, a]));
  const result: ActiveAlarm[] = [];

  for (const m of snap) {
    if (m.status !== "alarm") continue;
    (["volt","rotate","pressure","vibration"] as SensorKey[]).forEach((s) => {
      const r = m.sensors[s];
      if (!r.isAnomaly) return;
      const key = `${m.machineID}:${s}`;
      const prev = existingById.get(key);
      const dir = r.current > r.threshold.max ? "up" : "down";
      const thr = dir === "up" ? r.threshold.max : r.threshold.min;
      if (prev) {
        result.push({
          ...prev,
          currentValue: r.current,
          durationMin: Math.max(1, Math.round((now.getTime() - new Date(prev.triggeredAt).getTime()) / 60000)),
        });
      } else {
        result.push({
          id: `AL-${key}-${now.getTime()}`,
          machineID: m.machineID,
          sensor: s,
          direction: dir,
          currentValue: r.current,
          threshold: thr,
          triggeredAt: now.toISOString(),
          durationMin: 1,
        });
      }
    });
  }
  return result.sort((a, b) => b.durationMin - a.durationMin);
}

export function getMachineFromBase(machineID: string): MachinePrediction | undefined {
  return MACHINES.find((m) => m.machineID === machineID);
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

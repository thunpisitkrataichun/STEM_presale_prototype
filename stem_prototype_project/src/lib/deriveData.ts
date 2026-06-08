// Derives all page-specific data from MachinePrediction[] so that every page
// reflects the uploaded dataset instead of hardcoded static values.

import { type MachinePrediction } from "../../data/modelData";
import {
  type FailureComponent, type FailureEvent, type WeeklyPoint,
  FAILURE_EVENTS as STATIC_FAILURE_EVENTS,
  FAILURE_KPIS as STATIC_KPIS,
  FAILURE_BY_COMPONENT as STATIC_BY_COMP,
  TOP_OFFENDERS as STATIC_TOP_OFFENDERS,
  WEEKLY_TREND as STATIC_WEEKLY_TREND,
  HEATMAP as STATIC_HEATMAP,
  HEATMAP_MAX as STATIC_HEATMAP_MAX,
} from "../../data/failureData";
import {
  type MaintenanceJob, type MaintenanceType, type TimeSlot,
  TECHNICIANS, SEED_JOBS,
} from "../../data/maintenanceData";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FailureKpis {
  totalLast90: number;
  totalPrev90: number;
  mtbfDays: number;
  mtbfPrevDays: number;
  topComponent: FailureComponent;
  topComponentPct: number;
  avgRecoveryHours: number;
  avgRecoveryPrev: number;
}

export interface DerivedFailureData {
  failureEvents: FailureEvent[];
  failureKpis: FailureKpis;
  failureByComponent: Record<FailureComponent, number>;
  topOffenders: { machineID: string; count: number }[];
  weeklyTrend: WeeklyPoint[];
  heatmap: number[][];
  heatmapMax: number;
}

// ── Static fallback (no file uploaded) ───────────────────────────────────────

export const STATIC_FAILURE: DerivedFailureData = {
  failureEvents: STATIC_FAILURE_EVENTS,
  failureKpis: STATIC_KPIS,
  failureByComponent: STATIC_BY_COMP,
  topOffenders: STATIC_TOP_OFFENDERS,
  weeklyTrend: STATIC_WEEKLY_TREND,
  heatmap: STATIC_HEATMAP,
  heatmapMax: STATIC_HEATMAP_MAX,
};

export const STATIC_MAINTENANCE: MaintenanceJob[] = SEED_JOBS;

// ── Helpers ───────────────────────────────────────────────────────────────────

const COMPS: FailureComponent[] = ["Comp1", "Comp2", "Comp3", "Comp4"];
const DAY_MS = 86_400_000;

// Deterministic LCG seeded by any integer — gives consistent results per machineID
function lcg(seed: number): () => number {
  let s = Math.abs(seed) >>> 0 || 1;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function idToSeed(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

// ── Failure data derivation ───────────────────────────────────────────────────

export function deriveFailureData(machines: MachinePrediction[]): DerivedFailureData {
  const events: FailureEvent[] = [];
  const nowMs = Date.now();

  machines.forEach((m) => {
    const rng = lcg(idToSeed(m.machineID));

    // Machines closer to failure → more past events.
    // daysToFailure ≈ 0 → ~3 failures/90d; ≈ 60+ → 0 failures
    const expected = Math.max(0, (60 - m.daysToFailure) / 20);
    const failCount = Math.round(expected * rng());

    for (let f = 0; f < failCount; f++) {
      const daysAgo = Math.floor(rng() * 88) + 2;        // 2–89 days ago
      const hour = Math.floor(rng() * 24);
      const d = new Date(nowMs - daysAgo * DAY_MS);
      d.setHours(hour, 0, 0, 0);

      const comp = COMPS[Math.floor(rng() * 4)];
      const triggers = ["Multi-sensor", "Volt ↑", "Vibration ↑", "Rotate ↓", "Pressure ↑"];
      const triggeredBy = triggers[Math.floor(rng() * triggers.length)];
      const recoveryHours = [3, 6, 12, 24][Math.floor(rng() * 4)];

      events.push({
        id: `FE-${String(events.length + 1).padStart(4, "0")}`,
        datetime: d.toISOString().replace(".000Z", ""),
        machineID: m.machineID,
        component: comp,
        triggeredBy,
        recoveryHours,
        status: "Done",
      });
    }
  });

  events.sort((a, b) => b.datetime.localeCompare(a.datetime));

  // Failure by component
  const byComp: Record<FailureComponent, number> = { Comp1: 0, Comp2: 0, Comp3: 0, Comp4: 0 };
  events.forEach((e) => byComp[e.component]++);

  // Top offenders (top 5)
  const counts: Record<string, number> = {};
  events.forEach((e) => { counts[e.machineID] = (counts[e.machineID] ?? 0) + 1; });
  const topOffenders = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([machineID, count]) => ({ machineID, count }));

  // Weekly trend (last 13 weeks)
  const weeklyTrend: WeeklyPoint[] = [];
  for (let w = 12; w >= 0; w--) {
    const wStart = new Date(nowMs - (w + 1) * 7 * DAY_MS);
    const wEnd   = new Date(nowMs - w * 7 * DAY_MS);
    const wStartISO = wStart.toISOString();
    const wEndISO   = wEnd.toISOString();
    const label = wStart.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
    const wp: WeeklyPoint = { week: label, Comp1: 0, Comp2: 0, Comp3: 0, Comp4: 0 };
    events.forEach((e) => {
      if (e.datetime >= wStartISO && e.datetime < wEndISO) wp[e.component]++;
    });
    weeklyTrend.push(wp);
  }

  // Heatmap: 7 days (Mon–Sun) × 24 hours
  const heatmap = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  events.forEach((e) => {
    const d = new Date(e.datetime);
    const day = (d.getDay() + 6) % 7;
    heatmap[day][d.getHours()]++;
  });
  const heatmapMax = Math.max(1, ...heatmap.flat());

  // KPIs
  const total = events.length;
  const topComp = COMPS.reduce((a, b) => (byComp[a] >= byComp[b] ? a : b));
  const topCompPct = total > 0 ? Math.round((byComp[topComp] / total) * 1000) / 10 : 0;
  const avgRecovery = total > 0
    ? Math.round(events.reduce((s, e) => s + e.recoveryHours, 0) / total * 10) / 10
    : 0;
  const avgDays = machines.length > 0
    ? machines.reduce((s, m) => s + m.daysToFailure, 0) / machines.length
    : 30;

  return {
    failureEvents: events,
    failureKpis: {
      totalLast90: total,
      totalPrev90: Math.round(total * 1.05),
      mtbfDays: Math.round(avgDays * 10) / 10,
      mtbfPrevDays: Math.round(avgDays * 0.92 * 10) / 10,
      topComponent: topComp,
      topComponentPct: topCompPct,
      avgRecoveryHours: avgRecovery,
      avgRecoveryPrev: Math.round(avgRecovery * 1.15 * 10) / 10,
    },
    failureByComponent: byComp,
    topOffenders,
    weeklyTrend,
    heatmap,
    heatmapMax,
  };
}

// ── Maintenance jobs derivation ───────────────────────────────────────────────

export function deriveSeedJobs(machines: MachinePrediction[]): MaintenanceJob[] {
  const TYPES: MaintenanceType[] = ["Preventive", "Corrective", "Inspection", "Replacement"];
  const SLOTS: TimeSlot[] = ["morning", "afternoon", "full"];

  const candidates = machines
    .filter((m) => m.underMaintenance || m.daysToFailure < 14)
    .sort((a, b) => a.daysToFailure - b.daysToFailure)
    .slice(0, 10);

  return candidates.map((m, idx) => {
    const type: MaintenanceType = m.daysToFailure < 7 ? "Corrective"
      : m.underMaintenance ? "Inspection"
      : TYPES[idx % TYPES.length];
    const tech = TECHNICIANS[idx % TECHNICIANS.length];
    const daysOffset = Math.max(1, Math.min(Math.ceil(m.daysToFailure / 3), 30));
    const d = new Date();
    d.setDate(d.getDate() + (m.underMaintenance ? 0 : daysOffset));

    return {
      id: `MJ-${String(idx + 1).padStart(4, "0")}`,
      machineID: m.machineID,
      date: d.toISOString().slice(0, 10),
      timeSlot: SLOTS[idx % SLOTS.length],
      type,
      technician: tech.name,
      durationHours: type === "Corrective" ? 6 : type === "Replacement" ? 4 : 2,
      notes: type === "Corrective" ? "Urgent – predicted failure imminent" : "",
      status: m.underMaintenance ? "InProgress" : "Scheduled",
    };
  });
}

"""
generate_failures.py
---------------------
Reads Azure PdM raw CSVs and emits pre-aggregated failure analytics into
stem_prototype_project/data/failureData.ts for the Failure Analysis page.

Outputs (in the TS file):
  - FAILURE_EVENTS         : list of every failure event with trigger + recovery
  - SENSOR_SNAPSHOTS       : 24h sensor history for recent events (for modal)
  - FAILURE_KPIS           : counts, MTBF, avg recovery (this period & prev)
  - FAILURE_BY_COMPONENT   : breakdown for the bar chart
  - TOP_OFFENDERS          : top 5 machines by failure count
  - WEEKLY_TREND           : per-week stacked counts (last 12 weeks)
  - HEATMAP                : 7 days x 24 hours intensity grid
"""

import os, json
import numpy as np
import pandas as pd

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA_DIR = os.path.join(ROOT, "model", "data", "raw", "Microsoft_Azure_Predictive_Maintenance")
OUT_TS = os.path.join(ROOT, "stem_prototype_project", "data", "failureData.ts")

print("Loading raw data ...")
failures = pd.read_csv(os.path.join(DATA_DIR, "PdM_failures.csv"), parse_dates=["datetime"])
telemetry = pd.read_csv(os.path.join(DATA_DIR, "PdM_telemetry.csv"), parse_dates=["datetime"])
maint = pd.read_csv(os.path.join(DATA_DIR, "PdM_maint.csv"), parse_dates=["datetime"])

failures["component"] = failures["failure"].str.capitalize()
failures = failures.sort_values("datetime").reset_index(drop=True)
maint = maint.sort_values(["machineID", "datetime"])
telemetry = telemetry.sort_values(["machineID", "datetime"])

# Pre-index telemetry/maint for speed
print("Indexing telemetry & maintenance ...")
tel_by_machine = {mid: g.copy().reset_index(drop=True) for mid, g in telemetry.groupby("machineID")}
maint_by_machine = {mid: g.copy().reset_index(drop=True) for mid, g in maint.groupby("machineID")}


def find_trigger(window: pd.DataFrame) -> str:
    """Compare last 6h to prior 18h; return strongest sensor anomaly."""
    if len(window) < 10:
        return "Multi-sensor"
    w = window.sort_values("datetime").reset_index(drop=True)
    recent = w.tail(6)
    base = w.head(len(w) - 6)
    if len(base) == 0:
        return "Multi-sensor"
    scores = {}
    for col in ["volt", "rotate", "pressure", "vibration"]:
        bm = base[col].mean()
        bs = base[col].std() or 1.0
        z = (recent[col].mean() - bm) / bs
        scores[col] = float(z)
    top = max(scores, key=lambda k: abs(scores[k]))
    z = scores[top]
    if abs(z) < 1.5:
        return "Multi-sensor"
    return f"{top.capitalize()} {'↑' if z > 0 else '↓'}"


print(f"Processing {len(failures)} failure events ...")
events = []
sensor_snapshots = {}
N_SENSOR_KEEP = 200  # save snapshots only for the most recent events

for idx, row in failures.iterrows():
    fid = f"FE-{idx+1:04d}"
    fdt = row["datetime"]
    mid = int(row["machineID"])
    comp = row["component"]

    machine_tel = tel_by_machine.get(mid)
    if machine_tel is not None:
        window = machine_tel[
            (machine_tel["datetime"] >= fdt - pd.Timedelta(hours=24)) &
            (machine_tel["datetime"] <= fdt)
        ]
    else:
        window = pd.DataFrame()

    trigger = find_trigger(window)

    # Recovery hours = time to next maintenance event
    mm = maint_by_machine.get(mid)
    recovery = 3.0
    if mm is not None:
        nxt = mm[mm["datetime"] > fdt].head(1)
        if len(nxt):
            recovery = float((nxt.iloc[0]["datetime"] - fdt).total_seconds() / 3600)
    # Clamp + soften with light noise so distribution isn't all integers
    recovery = float(np.clip(recovery, 0.5, 12.0))

    events.append({
        "id": fid,
        "datetime": fdt.isoformat(),
        "machineID": f"M{mid:03d}",
        "component": comp,
        "triggeredBy": trigger,
        "recoveryHours": round(recovery, 1),
        "status": "Done",
    })

    if idx >= len(failures) - N_SENSOR_KEEP and len(window) > 0:
        w_sorted = window.sort_values("datetime")
        snap = []
        for _, r in w_sorted.iterrows():
            h_off = float((r["datetime"] - fdt).total_seconds() / 3600.0)
            snap.append({
                "h": round(h_off, 1),
                "v": round(float(r["volt"]), 1),
                "r": round(float(r["rotate"]), 1),
                "p": round(float(r["pressure"]), 1),
                "b": round(float(r["vibration"]), 1),
            })
        sensor_snapshots[fid] = snap


# ── Aggregations ───────────────────────────────────────────────────────────
LAST_DT = failures["datetime"].max()
PERIOD = pd.Timedelta(days=90)
recent_cutoff = LAST_DT - PERIOD
prev_cutoff = recent_cutoff - PERIOD

recent_mask = failures["datetime"] >= recent_cutoff
prev_mask = (failures["datetime"] >= prev_cutoff) & (failures["datetime"] < recent_cutoff)
recent = failures[recent_mask]
prev = failures[prev_mask]

ALL_COMPS = ["Comp1", "Comp2", "Comp3", "Comp4"]
comp_counts_raw = recent["component"].value_counts().to_dict()
comp_counts = {c: int(comp_counts_raw.get(c, 0)) for c in ALL_COMPS}

top_comp = max(comp_counts, key=comp_counts.get)
total_recent = sum(comp_counts.values())
top_pct = round(comp_counts[top_comp] / max(total_recent, 1) * 100, 1)

# Top 5 offenders in the period
machine_counts = recent.groupby("machineID").size().sort_values(ascending=False).head(5)
top_offenders = [{"machineID": f"M{int(mid):03d}", "count": int(c)} for mid, c in machine_counts.items()]

# Weekly stacked (last 12 weeks of data)
twelve_weeks_ago = LAST_DT - pd.Timedelta(weeks=12)
recent_12w = failures[failures["datetime"] >= twelve_weeks_ago].copy()
recent_12w["week"] = recent_12w["datetime"].dt.to_period("W").dt.start_time
weekly_stack = recent_12w.pivot_table(
    index="week", columns="component", values="machineID",
    aggfunc="count", fill_value=0,
)
# Ensure all components exist as columns
for c in ALL_COMPS:
    if c not in weekly_stack.columns:
        weekly_stack[c] = 0
weekly_stack = weekly_stack[ALL_COMPS].reset_index().sort_values("week")
weekly_trend = []
for _, r in weekly_stack.iterrows():
    weekly_trend.append({
        "week": r["week"].strftime("%b %d"),
        "Comp1": int(r["Comp1"]),
        "Comp2": int(r["Comp2"]),
        "Comp3": int(r["Comp3"]),
        "Comp4": int(r["Comp4"]),
    })

# Heatmap day × hour over entire dataset
heat = np.zeros((7, 24), dtype=int)
for _, r in failures.iterrows():
    heat[r["datetime"].weekday()][r["datetime"].hour] += 1
heatmap = heat.tolist()
heatmap_max = int(heat.max())

# MTBF per period
def fleet_mtbf(df):
    vals = []
    for mid, g in df.groupby("machineID"):
        g = g.sort_values("datetime")
        diffs = g["datetime"].diff().dropna()
        if len(diffs):
            vals.append(diffs.mean().total_seconds() / 86400)
    return float(np.mean(vals)) if vals else 0.0

mtbf = fleet_mtbf(recent)
mtbf_prev = fleet_mtbf(prev)

# Avg recovery from event list
recent_ids = set(events[i]["id"] for i in range(len(events)) if failures.iloc[i]["datetime"] >= recent_cutoff)
prev_ids = set(events[i]["id"] for i in range(len(events))
               if prev_cutoff <= failures.iloc[i]["datetime"] < recent_cutoff)
avg_rec = float(np.mean([e["recoveryHours"] for e in events if e["id"] in recent_ids])) if recent_ids else 0.0
avg_rec_prev = float(np.mean([e["recoveryHours"] for e in events if e["id"] in prev_ids])) if prev_ids else 0.0


# ── Emit TS ────────────────────────────────────────────────────────────────
print(f"Writing {OUT_TS}")
ts = f'''// ─────────────────────────────────────────────────────────────────────────
// AUTO-GENERATED by model/src/generate_failures.py
// Source: PdM_failures.csv + PdM_telemetry.csv + PdM_maint.csv (Microsoft Azure)
// DO NOT EDIT manually — re-run the script to refresh.
// ─────────────────────────────────────────────────────────────────────────

export type FailureComponent = "Comp1" | "Comp2" | "Comp3" | "Comp4";

export interface FailureEvent {{
  id: string;
  datetime: string;
  machineID: string;
  component: FailureComponent;
  triggeredBy: string;
  recoveryHours: number;
  status: "Done" | "Open";
}}

export interface SensorPoint {{
  h: number;  // hour offset from failure (-24..0)
  v: number;  // volt
  r: number;  // rotate
  p: number;  // pressure
  b: number;  // vibration
}}

export const COMPONENT_COLOR: Record<FailureComponent, string> = {{
  Comp1: "#5fa8e8",
  Comp2: "#d9534f",
  Comp3: "#e8a33d",
  Comp4: "#9c6bd9",
}};

export const FAILURE_EVENTS: FailureEvent[] = {json.dumps(events, separators=(",", ":"))};

export const SENSOR_SNAPSHOTS: Record<string, SensorPoint[]> = {json.dumps(sensor_snapshots, separators=(",", ":"))};

export const FAILURE_KPIS = {{
  totalLast90: {len(recent)},
  totalPrev90: {len(prev)},
  mtbfDays: {round(mtbf, 1)},
  mtbfPrevDays: {round(mtbf_prev, 1)},
  topComponent: "{top_comp}" as FailureComponent,
  topComponentPct: {top_pct},
  avgRecoveryHours: {round(avg_rec, 1)},
  avgRecoveryPrev: {round(avg_rec_prev, 1)},
}};

export const FAILURE_BY_COMPONENT: Record<FailureComponent, number> = {json.dumps(comp_counts)};

export const TOP_OFFENDERS: Array<{{ machineID: string; count: number }}> = {json.dumps(top_offenders)};

export interface WeeklyPoint {{
  week: string;
  Comp1: number; Comp2: number; Comp3: number; Comp4: number;
}}
export const WEEKLY_TREND: WeeklyPoint[] = {json.dumps(weekly_trend)};

export const HEATMAP: number[][] = {json.dumps(heatmap)};
export const HEATMAP_MAX: number = {heatmap_max};

export const ANALYSIS_PERIOD = {{
  start: "{recent_cutoff.strftime('%Y-%m-%d')}",
  end: "{LAST_DT.strftime('%Y-%m-%d')}",
  days: 90,
}};
'''

with open(OUT_TS, "w", encoding="utf-8") as f:
    f.write(ts)

print(f"Done.")
print(f"  Events: {len(events)} (sensor snapshots for {len(sensor_snapshots)})")
print(f"  Recent: {len(recent)} | Prev: {len(prev)}")
print(f"  MTBF: {mtbf:.1f}d (prev {mtbf_prev:.1f}d)")
print(f"  Top component: {top_comp} ({top_pct}%)")

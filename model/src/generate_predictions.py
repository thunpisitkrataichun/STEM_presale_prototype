"""
generate_predictions.py
-----------------------
Loads the trained XGBoost model, runs predictions on the latest sensor
snapshot for every machine (machineID 1-100), and writes the result as a
TypeScript data file consumed by the React dashboard.

Usage (from repo root):
    python model/src/generate_predictions.py
"""

import os
import json
from datetime import datetime

import pandas as pd
import numpy as np
from xgboost import XGBRegressor

# ── Paths ──────────────────────────────────────────────────────────────────
ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
RAW_CSV   = os.path.join(ROOT, "model", "data", "raw",
                          "Microsoft_Azure_Predictive_Maintenance",
                          "microsoft_azure_mix_col.csv")
MODEL_PATH = os.path.join(ROOT, "model", "models",
                           "Microsoft Azure", "xgb_days_to_failure.json")
META_PATH  = os.path.join(ROOT, "model", "models",
                           "Microsoft Azure", "model_meta.json")
OUT_TS     = os.path.join(ROOT, "stem_prototype_project", "data", "modelData.ts")

SENSORS = ["volt", "rotate", "pressure", "vibration"]
ROLL_W  = 24   # 24-hour rolling window (matches training)
TREND_WEEKS = 8

# ── Feature engineering (mirrors cleaning_dataset.ipynb) ──────────────────
def feature_engineering(df: pd.DataFrame) -> pd.DataFrame:
    df = df.sort_values(["machineID", "datetime"]).reset_index(drop=True)
    df["hour"]      = df["datetime"].dt.hour
    df["dayofweek"] = df["datetime"].dt.dayofweek

    g = df.groupby("machineID")
    for s in SENSORS:
        df[f"{s}_roll_mean_24h"] = g[s].transform(
            lambda x: x.rolling(ROLL_W, min_periods=1).mean())
        df[f"{s}_roll_std_24h"]  = g[s].transform(
            lambda x: x.rolling(ROLL_W, min_periods=1).std().fillna(0))

    df["cum_errors"] = g["has_error"].cumsum()
    df["cum_maint"]  = g["has_maint"].cumsum()
    return df


def encode_model(df: pd.DataFrame) -> pd.DataFrame:
    return pd.get_dummies(df, columns=["model"], prefix="model", dtype=int)


def build_X(df: pd.DataFrame, feature_cols: list[str]) -> pd.DataFrame:
    for col in feature_cols:
        if col not in df.columns:
            df[col] = 0
    return df[feature_cols]


# ── Load & prepare ─────────────────────────────────────────────────────────
print("Loading raw data …")
raw = pd.read_csv(RAW_CSV, parse_dates=["datetime", "next_failure_date"])
raw = raw.dropna(subset=["days_to_failure"]).reset_index(drop=True)

print("Feature engineering …")
df = feature_engineering(raw.copy())
df = encode_model(df)

with open(META_PATH) as f:
    meta = json.load(f)
feature_cols = meta["features"]

# ── Snapshot per machine: pick row from ~60 days before end per machine ─────
# Using the very last row means many machines are AT failure (dtf≈0).
# Instead pick a row ~60 days (1440 hours) before each machine's last row so
# we get a natural distribution of health states across the fleet.
df_sorted = df.sort_values(["machineID", "datetime"])

# Each machine gets a different lag so the fleet snapshot shows machines at
# different points in their failure cycle — giving a realistic spread of health states.
# lag varies from 1 to 56 days (7-day steps) based on machineID mod 8.
def pick_snapshot(grp: pd.DataFrame) -> pd.Series:
    mid = int(grp["machineID"].iloc[0])
    lag_days = ((mid - 1) % 8) * 7 + 1   # 1, 8, 15, 22, 29, 36, 43, 50 days
    lag_hours = lag_days * 24
    idx = max(0, len(grp) - lag_hours)
    return grp.iloc[idx]

latest = (
    df_sorted.groupby("machineID", group_keys=False)
             .apply(pick_snapshot)
             .reset_index(drop=True)
)

under_maint_base = {}  # filled below after predictions

print(f"Machines in snapshot: {len(latest)}")

# ── Load model & predict ───────────────────────────────────────────────────
print("Loading XGBoost model …")
xgb = XGBRegressor()
xgb.load_model(MODEL_PATH)

X_latest = build_X(latest.copy(), feature_cols)
preds = xgb.predict(X_latest)
preds = np.clip(preds, 0, None)   # days can't be negative

latest = latest.copy()
latest["predicted_dtf"] = preds

# "under maintenance" = machine ID divisible by 7 (deterministic ~14%)
#   AND predicted dtf > 14 (proactive servicing, not emergency response)
# This gives a realistic demo distribution without depending on sparse has_maint events.
for _, row in latest.iterrows():
    mid = int(row["machineID"])
    dtf = float(row["predicted_dtf"])
    under_maint_base[mid] = (mid % 7 == 0) and (dtf > 14)

# ── RUL trend: weekly fleet-average predictions (last TREND_WEEKS weeks) ──
print("Computing RUL trend …")
df["week"] = df["datetime"].dt.to_period("W")
all_weeks = sorted(df["week"].unique())[-TREND_WEEKS:]

trend_points: list[dict] = []
for i, wk in enumerate(all_weeks, 1):
    wk_df = df[df["week"] == wk].copy()
    # one row per machine (last row of that week)
    wk_snap = wk_df.sort_values("datetime").groupby("machineID").last().reset_index()
    X_wk = build_X(wk_snap.copy(), feature_cols)
    wk_preds = xgb.predict(X_wk)
    avg = float(np.mean(np.clip(wk_preds, 0, None)))
    trend_points.append({"label": f"Week {i}", "value": round(avg, 1)})

# ── Format machines for TypeScript ────────────────────────────────────────
def machine_model(row) -> str:
    for m in ["model1", "model2", "model3", "model4"]:
        col = f"model_{m}"
        if col in row and row[col] == 1:
            return m
    return "model1"

machines = []
for _, row in latest.iterrows():
    mid = int(row["machineID"])
    machines.append({
        "machineID": f"M{mid:03d}",
        "model": machine_model(row),
        "age": int(row["age"]),
        "daysToFailure": round(float(row["predicted_dtf"]), 1),
        "volt":      round(float(row["volt"]), 1),
        "rotate":    round(float(row["rotate"]), 1),
        "pressure":  round(float(row["pressure"]), 1),
        "vibration": round(float(row["vibration"]), 1),
        "underMaintenance": bool(under_maint_base.get(mid, False)),
    })

# sort by machineID for readability
machines.sort(key=lambda m: m["machineID"])

last_sync_dt = latest["datetime"].max()
last_sync_str = last_sync_dt.strftime("%Y-%m-%d %H:%M")

# ── Emit TypeScript ────────────────────────────────────────────────────────
def ts_obj(d: dict) -> str:
    model_val   = json.dumps(d["model"])
    machine_id  = json.dumps(d["machineID"])
    under_maint = "true" if d["underMaintenance"] else "false"
    return (
        f"  {{ machineID: {machine_id}, model: {model_val}, age: {d['age']}, "
        f"daysToFailure: {d['daysToFailure']}, "
        f"volt: {d['volt']}, rotate: {d['rotate']}, "
        f"pressure: {d['pressure']}, vibration: {d['vibration']}, "
        f"underMaintenance: {under_maint} }}"
    )

def ts_trend(pts: list[dict]) -> str:
    lines = [f'  {{ label: "{p["label"]}", value: {p["value"]} }}' for p in pts]
    return ",\n".join(lines)

ts_content = f"""\
// ─────────────────────────────────────────────────────────────────────────
// AUTO-GENERATED by model/src/generate_predictions.py
// Source model : XGBoost (xgb_days_to_failure.json)
// Generated at : {datetime.now().strftime("%Y-%m-%d %H:%M")}
// DO NOT EDIT manually — re-run the script to refresh.
// ─────────────────────────────────────────────────────────────────────────

export type RiskStatus = "Critical" | "Warning" | "Watch" | "Normal";

export interface MachinePrediction {{
  machineID: string;
  model: string;
  age: number;
  daysToFailure: number;
  volt: number;
  rotate: number;
  pressure: number;
  vibration: number;
  underMaintenance: boolean;
}}

export function statusFromDays(days: number): RiskStatus {{
  if (days < 7)  return "Critical";
  if (days < 14) return "Warning";
  if (days < 30) return "Watch";
  return "Normal";
}}

export const STATUS_COLOR: Record<RiskStatus, string> = {{
  Critical: "#d9534f",
  Warning:  "#e8a33d",
  Watch:    "#5fa8e8",
  Normal:   "#2fab6f",
}};

export const MACHINES: MachinePrediction[] = [
{chr(10).join(ts_obj(m) + "," for m in machines).rstrip(",")}
];

export interface TrendPoint {{ label: string; value: number; }}
export const RUL_TREND: TrendPoint[] = [
{ts_trend(trend_points)}
];

export const LAST_SYNC = "{last_sync_str}";
export const TOTAL_MACHINES = {len(machines)};
"""

os.makedirs(os.path.dirname(OUT_TS), exist_ok=True)
with open(OUT_TS, "w", encoding="utf-8") as f:
    f.write(ts_content)

print(f"\n✅ Written: {OUT_TS}")
print(f"   Machines : {len(machines)}")
print(f"   Trend pts: {len(trend_points)}")
print(f"   Last sync: {last_sync_str}")
critical = sum(1 for m in machines if m["daysToFailure"] < 7)
warning  = sum(1 for m in machines if 7 <= m["daysToFailure"] < 14)
print(f"   Critical : {critical}  |  Warning: {warning}")

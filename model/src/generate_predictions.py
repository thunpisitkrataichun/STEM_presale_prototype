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
OUT_TREES  = os.path.join(ROOT, "stem_prototype_project", "data", "modelTrees.json")

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

# ── Inject M006 as the editable "test machine" ─────────────────────────────
# M006 is reserved for users to play with — they can edit its sensor values
# in the UI and re-run the model live.
M006_BASELINE_INPUTS = {
    "machineID": "M006",
    "model": "model3",
    "age": 5,
    "volt": 170.0,
    "rotate": 450.0,
    "pressure": 100.0,
    "vibration": 40.0,
    "underMaintenance": False,
}

def predict_single(model_name: str, age: int, volt: float, rotate: float,
                   pressure: float, vibration: float, under_maint: bool) -> float:
    """Run the trained XGBoost on a single synthetic snapshot."""
    row = {
        "age": age, "volt": volt, "rotate": rotate, "pressure": pressure, "vibration": vibration,
        "has_error": 0, "has_maint": 1 if under_maint else 0,
        "hour": 12, "dayofweek": 3,
        "volt_roll_mean_24h": volt, "volt_roll_std_24h": 0.0,
        "rotate_roll_mean_24h": rotate, "rotate_roll_std_24h": 0.0,
        "pressure_roll_mean_24h": pressure, "pressure_roll_std_24h": 0.0,
        "vibration_roll_mean_24h": vibration, "vibration_roll_std_24h": 0.0,
        "cum_errors": 0, "cum_maint": 0,
        "model_model1": 1 if model_name == "model1" else 0,
        "model_model2": 1 if model_name == "model2" else 0,
        "model_model3": 1 if model_name == "model3" else 0,
        "model_model4": 1 if model_name == "model4" else 0,
    }
    X = np.array([[row[c] for c in feature_cols]], dtype=float)
    return max(0.0, float(xgb.predict(X)[0]))

m006_dtf = predict_single(
    M006_BASELINE_INPUTS["model"], M006_BASELINE_INPUTS["age"],
    M006_BASELINE_INPUTS["volt"], M006_BASELINE_INPUTS["rotate"],
    M006_BASELINE_INPUTS["pressure"], M006_BASELINE_INPUTS["vibration"],
    M006_BASELINE_INPUTS["underMaintenance"],
)

machines = [m for m in machines if m["machineID"] != "M006"]
machines.append({
    **M006_BASELINE_INPUTS,
    "daysToFailure": round(m006_dtf, 1),
})

# ── Ensure exactly 100 machines (1..100) ─────────────────────────────────
# A few IDs may be missing from the raw snapshot — synthesize realistic
# replacements using the trained model so the dashboard always shows 100.
existing_ids = {int(m["machineID"][1:]) for m in machines}
missing_ids = [i for i in range(1, 101) if i not in existing_ids]
print(f"Filling missing IDs: {missing_ids}")

MODELS_RR = ["model1", "model2", "model3", "model4"]
for mid in missing_ids:
    age   = 3 + (mid % 17)                          # 3..19
    mdl   = MODELS_RR[mid % 4]
    volt  = 155.0 + ((mid * 17) % 35)               # ~155..190
    rotate    = 420.0 + ((mid * 13) % 70)           # ~420..490
    pressure  = 85.0  + ((mid * 7)  % 30)           # ~85..115
    vibration = 35.0  + ((mid * 11) % 12)           # ~35..47
    dtf = predict_single(mdl, age, volt, rotate, pressure, vibration, False)
    machines.append({
        "machineID": f"M{mid:03d}",
        "model": mdl,
        "age": age,
        "daysToFailure": round(dtf, 1),
        "volt": round(volt, 1),
        "rotate": round(rotate, 1),
        "pressure": round(pressure, 1),
        "vibration": round(vibration, 1),
        "underMaintenance": (mid % 7 == 0) and (dtf > 14),
    })

# sort by machineID for readability
machines.sort(key=lambda m: m["machineID"])
assert len(machines) == 100, f"expected 100 machines, got {len(machines)}"

last_sync_dt = latest["datetime"].max()
last_sync_str = last_sync_dt.strftime("%Y-%m-%d %H:%M")

# ── Dump tree structure for in-browser JS inference ────────────────────────
# Frontend bundles modelTrees.json and runs predictions locally so the demo
# works fully offline (file:// or zipped dist/).
print("Dumping trees for JS evaluator ...")
booster = xgb.get_booster()
tdf = booster.trees_to_dataframe()

js_trees: list[list[dict]] = []
for tree_id in sorted(tdf["Tree"].unique()):
    tree_rows = tdf[tdf["Tree"] == tree_id].sort_values("Node")
    nodes = []
    for _, r in tree_rows.iterrows():
        node_id = int(r["Node"])
        if r["Feature"] == "Leaf":
            # for leaves the leaf value is in the 'Gain' column
            nodes.append({"id": node_id, "leaf": float(r["Gain"])})
        else:
            # internal nodes: 'Yes', 'No', 'Missing' are like "0-3" — keep the part after '-'
            yes_id = int(str(r["Yes"]).split("-")[-1])
            no_id  = int(str(r["No"]).split("-")[-1])
            miss   = int(str(r["Missing"]).split("-")[-1])
            nodes.append({
                "id": node_id,
                "f": r["Feature"],
                "s": float(r["Split"]),
                "y": yes_id,
                "n": no_id,
                "m": miss,
            })
    js_trees.append(nodes)

booster_cfg = json.loads(booster.save_config())
base_score = float(booster_cfg["learner"]["learner_model_param"]["base_score"])

trees_payload = {
    "baseScore": base_score,
    "features": feature_cols,
    "trees": js_trees,
}
with open(OUT_TREES, "w", encoding="utf-8") as f:
    json.dump(trees_payload, f, separators=(",", ":"))
print(f"   Trees    : {len(js_trees)} trees -> {OUT_TREES}")

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

// Editable test machine — UI lets users tweak inputs and re-run the model.
export const TEST_MACHINE_ID = "M006";
export const M006_BASELINE: MachinePrediction = {{
  machineID: "M006",
  model: "{M006_BASELINE_INPUTS["model"]}",
  age: {M006_BASELINE_INPUTS["age"]},
  daysToFailure: {round(m006_dtf, 1)},
  volt: {M006_BASELINE_INPUTS["volt"]},
  rotate: {M006_BASELINE_INPUTS["rotate"]},
  pressure: {M006_BASELINE_INPUTS["pressure"]},
  vibration: {M006_BASELINE_INPUTS["vibration"]},
  underMaintenance: {"true" if M006_BASELINE_INPUTS["underMaintenance"] else "false"},
}};
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

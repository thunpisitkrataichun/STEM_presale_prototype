import * as XLSX from "xlsx";
import { type MachinePrediction } from "../../data/modelData";
import { predictDaysToFailure } from "./predict";

export interface ParseResult {
  machines: MachinePrediction[];
  filename: string;
  rowCount: number;
}

export interface ParseError {
  message: string;
  detail?: string;
}

// Normalise header: lowercase, strip spaces/underscores/dashes
function norm(s: string) {
  return s.toLowerCase().replace(/[\s_\-]+/g, "");
}

const FIELD_MAP: Record<string, string> = {
  machineid:        "machineID",
  machine:          "machineID",
  id:               "machineID",
  model:            "model",
  machinetype:      "model",
  age:              "age",
  yearsinservice:   "age",
  volt:             "volt",
  voltage:          "volt",
  rotate:           "rotate",
  rotation:         "rotate",
  rpm:              "rotate",
  pressure:         "pressure",
  vibration:        "vibration",
  vibrate:          "vibration",
  // maintenance flags
  undermaintenance: "underMaintenance",
  maintenance:      "underMaintenance",
  inmaintenance:    "underMaintenance",
  hasmaint:         "underMaintenance",
  // pre-computed RUL from Azure/Kaggle dataset
  daystofailure:    "daysToFailure",
  rul:              "daysToFailure",
  remainingusefullife: "daysToFailure",
  // datetime for time-series grouping
  datetime:         "datetime",
  timestamp:        "datetime",
  date:             "datetime",
  time:             "datetime",
};

function toBoolean(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  const s = String(v).toLowerCase().trim();
  return s === "true" || s === "1" || s === "yes";
}

function toFloat(v: unknown, field: string): number {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  if (Number.isNaN(n)) throw new Error(`Invalid number in column "${field}": ${v}`);
  return Math.round(n * 10) / 10;
}

const VALID_MODELS = new Set(["model1", "model2", "model3", "model4"]);

function coerceModel(v: unknown): string {
  const raw = String(v ?? "").trim().toLowerCase().replace(/\s+/g, "");
  if (VALID_MODELS.has(raw)) return raw;
  if (/^\d$/.test(raw)) {
    const candidate = `model${raw}`;
    if (VALID_MODELS.has(candidate)) return candidate;
  }
  return raw;
}

// Format numeric machineID → "M001", "M002" …
function formatMachineId(raw: unknown): string {
  const s = String(raw ?? "").trim();
  const n = parseInt(s, 10);
  if (!Number.isNaN(n) && String(n) === s) {
    return `M${String(n).padStart(3, "0")}`;
  }
  return s || "UNKNOWN";
}

// ─── CSV fast-path ────────────────────────────────────────────────────────────
// For time-series CSVs (multiple rows per machine) we stream line-by-line,
// keeping only the latest row per machineID. This handles 800 K-row files
// without blowing the heap.

function parseCsvText(text: string): ParseResult["machines"] | null {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return null;

  const headers = lines[0].split(",").map((h) => h.trim());
  const colIdx: Record<string, number> = {};
  for (let i = 0; i < headers.length; i++) {
    const canonical = FIELD_MAP[norm(headers[i])];
    if (canonical) colIdx[canonical] = i;
  }

  // Need at least machineID + basic sensors
  if (!("machineID" in colIdx)) return null;

  const hasDatetime = "datetime" in colIdx;
  const hasRul = "daysToFailure" in colIdx;

  // latest[machineID] = { row: string[], datetime: string }
  type RowEntry = { cols: string[]; dt: string };
  const latest = new Map<string, RowEntry>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(",");
    const mid = cols[colIdx["machineID"]]?.trim();
    if (!mid) continue;

    if (hasDatetime) {
      const dt = cols[colIdx["datetime"]]?.trim() ?? "";
      const prev = latest.get(mid);
      if (!prev || dt > prev.dt) latest.set(mid, { cols, dt });
    } else {
      // No datetime — just keep last seen (last row wins)
      latest.set(mid, { cols, dt: "" });
    }
  }

  if (latest.size === 0) return null;

  const get = (cols: string[], field: string) =>
    colIdx[field] !== undefined ? cols[colIdx[field]]?.trim() : undefined;

  const machines: MachinePrediction[] = [];
  for (const [rawId, { cols }] of latest) {
    try {
      const model = coerceModel(get(cols, "model") ?? "model1");
      const age = toFloat(get(cols, "age") ?? 0, "age");
      const volt = toFloat(get(cols, "volt") ?? 0, "volt");
      const rotate = toFloat(get(cols, "rotate") ?? 0, "rotate");
      const pressure = toFloat(get(cols, "pressure") ?? 0, "pressure");
      const vibration = toFloat(get(cols, "vibration") ?? 0, "vibration");
      const underMaintenance = "underMaintenance" in colIdx
        ? toBoolean(get(cols, "underMaintenance"))
        : false;

      let daysToFailure: number;
      if (hasRul) {
        const raw = get(cols, "daysToFailure");
        const parsed = raw !== undefined ? parseFloat(raw) : NaN;
        daysToFailure = Number.isNaN(parsed)
          ? predictDaysToFailure({ age, model, volt, rotate, pressure, vibration, underMaintenance })
          : Math.max(0, Math.round(parsed * 10) / 10);
      } else {
        daysToFailure = predictDaysToFailure({ age, model, volt, rotate, pressure, vibration, underMaintenance });
      }

      machines.push({
        machineID: formatMachineId(rawId),
        model,
        age,
        volt,
        rotate,
        pressure,
        vibration,
        underMaintenance,
        daysToFailure,
      });
    } catch {
      // Skip malformed rows silently
    }
  }

  return machines.length > 0 ? machines : null;
}

// ─── XLSX / small-CSV fallback via SheetJS ────────────────────────────────────

function parseViaSheetJs(
  wb: XLSX.WorkBook,
  colIdx: Record<string, number>,
): MachinePrediction[] {
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: "" });

  const headers = (rows[0] as string[]).map((h) => String(h).trim());
  const ci: Record<string, number> = {};
  for (let i = 0; i < headers.length; i++) {
    const canonical = FIELD_MAP[norm(headers[i])];
    if (canonical) ci[canonical] = i;
  }
  Object.assign(colIdx, ci);

  const required = ["machineID", "model", "age", "volt", "rotate", "pressure", "vibration"];
  const missing = required.filter((f) => !(f in ci));
  if (missing.length > 0) {
    throw {
      message: `Missing required columns: ${missing.join(", ")}`,
      detail: `Headers found: ${headers.filter(Boolean).join(", ")}`,
    } as ParseError;
  }

  const hasRul = "daysToFailure" in ci;
  const hasDatetime = "datetime" in ci;

  // Aggregate by machineID if time-series
  type RowEntry = { row: unknown[]; dt: string };
  const latest = new Map<string, RowEntry>();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    const mid = String(row[ci["machineID"]] ?? "").trim();
    if (!mid) continue;

    if (hasDatetime) {
      const dt = String(row[ci["datetime"]] ?? "").trim();
      const prev = latest.get(mid);
      if (!prev || dt > prev.dt) latest.set(mid, { row, dt });
    } else {
      latest.set(mid, { row, dt: "" });
    }
  }

  const machines: MachinePrediction[] = [];
  for (const [rawId, { row }] of latest) {
    const get = (field: string) => row[ci[field]];
    const model = coerceModel(get("model"));
    const age = toFloat(get("age"), "age");
    const volt = toFloat(get("volt"), "volt");
    const rotate = toFloat(get("rotate"), "rotate");
    const pressure = toFloat(get("pressure"), "pressure");
    const vibration = toFloat(get("vibration"), "vibration");
    const underMaintenance = "underMaintenance" in ci
      ? toBoolean(get("underMaintenance"))
      : false;

    let daysToFailure: number;
    if (hasRul) {
      const raw = get("daysToFailure");
      const parsed = typeof raw === "number" ? raw : parseFloat(String(raw));
      daysToFailure = Number.isNaN(parsed)
        ? predictDaysToFailure({ age, model, volt, rotate, pressure, vibration, underMaintenance })
        : Math.max(0, Math.round(parsed * 10) / 10);
    } else {
      daysToFailure = predictDaysToFailure({ age, model, volt, rotate, pressure, vibration, underMaintenance });
    }

    machines.push({
      machineID: formatMachineId(rawId),
      model, age, volt, rotate, pressure, vibration, underMaintenance, daysToFailure,
    });
  }

  return machines;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function parseXlsx(file: File): Promise<ParseResult> {
  const isCsv = file.name.toLowerCase().endsWith(".csv");

  if (isCsv) {
    // Stream CSV text — efficient for large files
    const text = await file.text();
    const machines = parseCsvText(text);
    if (!machines || machines.length === 0) {
      throw {
        message: "Could not parse the CSV file — please check the header and data",
        detail: "At minimum these columns are required: machineID, volt, rotate, pressure, vibration",
      } as ParseError;
    }
    return { machines, filename: file.name, rowCount: machines.length };
  }

  // xlsx / xls — use SheetJS
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  if (!wb.SheetNames[0]) {
    throw { message: "The Excel file is empty (no sheets)" } as ParseError;
  }

  const colIdx: Record<string, number> = {};
  const machines = parseViaSheetJs(wb, colIdx);

  if (machines.length === 0) {
    throw { message: "No data found (all rows are empty)" } as ParseError;
  }

  return { machines, filename: file.name, rowCount: machines.length };
}

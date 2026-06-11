import ExcelJS from "exceljs";
import {
  statusFromDays,
  type MachinePrediction,
  type RiskStatus,
} from "../../data/modelData";

// Matches STATUS_COLOR in modelData.ts (ARGB, no leading #)
const STATUS_ARGB: Record<RiskStatus, string> = {
  Critical: "FFD9534F",
  Warning: "FFE8A33D",
  Watch: "FF5FA8E8",
  Normal: "FF2FAB6F",
};

const HEADER_ARGB = "FF1E4D8C"; // --blue-800
const TITLE_ARGB = "FF14365F"; // --blue-900
const BAND_ARGB = "FFF4F9FE"; // --blue-25
const WHITE_ARGB = "FFFFFFFF";

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFD6E4F5" } },
  left: { style: "thin", color: { argb: "FFD6E4F5" } },
  bottom: { style: "thin", color: { argb: "FFD6E4F5" } },
  right: { style: "thin", color: { argb: "FFD6E4F5" } },
};

function solidFill(argb: string): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

export async function exportPredictionsXlsx(machines: MachinePrediction[]) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "STEM Predictive Maintenance";
  wb.created = new Date();

  const ws = wb.addWorksheet("RUL Predictions", {
    views: [{ state: "frozen", ySplit: 6 }],
  });

  ws.columns = [
    { key: "machineID", width: 13 },
    { key: "model", width: 11 },
    { key: "age", width: 9 },
    { key: "daysToFailure", width: 16 },
    { key: "volt", width: 11 },
    { key: "rotate", width: 11 },
    { key: "pressure", width: 11 },
    { key: "vibration", width: 11 },
    { key: "maint", width: 15 },
    { key: "status", width: 12 },
  ];

  // ── Title ──────────────────────────────────────────────
  ws.mergeCells("A1:J1");
  const title = ws.getCell("A1");
  title.value = "Machine RUL Prediction Report";
  title.font = { name: "Calibri", size: 16, bold: true, color: { argb: WHITE_ARGB } };
  title.fill = solidFill(TITLE_ARGB);
  title.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(1).height = 32;

  ws.mergeCells("A2:J2");
  const subtitle = ws.getCell("A2");
  const now = new Date();
  subtitle.value = `Generated ${now.toLocaleString()}  ·  ${machines.length} machines  ·  Model: XGBoost (days-to-failure)`;
  subtitle.font = { name: "Calibri", size: 10, italic: true, color: { argb: "FF6F8BAB" } };
  subtitle.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(2).height = 18;

  // ── Status summary band (row 4) ────────────────────────
  const counts: Record<RiskStatus, number> = { Critical: 0, Warning: 0, Watch: 0, Normal: 0 };
  for (const m of machines) counts[statusFromDays(m.daysToFailure)]++;

  ws.mergeCells("A4:B4");
  const totalCell = ws.getCell("A4");
  totalCell.value = `Total: ${machines.length}`;
  totalCell.font = { bold: true, color: { argb: WHITE_ARGB }, size: 11 };
  totalCell.fill = solidFill(HEADER_ARGB);
  totalCell.alignment = { vertical: "middle", horizontal: "center" };

  const summarySpans: Array<[RiskStatus, string, string]> = [
    ["Critical", "C4", "D4"],
    ["Warning", "E4", "F4"],
    ["Watch", "G4", "H4"],
    ["Normal", "I4", "J4"],
  ];
  for (const [st, from, to] of summarySpans) {
    ws.mergeCells(`${from}:${to}`);
    const c = ws.getCell(from);
    c.value = `${st}: ${counts[st]}`;
    c.font = { bold: true, color: { argb: WHITE_ARGB }, size: 11 };
    c.fill = solidFill(STATUS_ARGB[st]);
    c.alignment = { vertical: "middle", horizontal: "center" };
  }
  ws.getRow(4).height = 22;

  // ── Header row (row 6) ─────────────────────────────────
  const HEADERS = [
    "Machine ID", "Model", "Age", "Days To Failure",
    "Volt", "Rotate", "Pressure", "Vibration",
    "Maintenance", "Status",
  ];
  const headerRow = ws.getRow(6);
  HEADERS.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: WHITE_ARGB }, size: 11 };
    cell.fill = solidFill(HEADER_ARGB);
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = THIN_BORDER;
  });
  headerRow.height = 24;
  ws.autoFilter = { from: "A6", to: "J6" };

  // ── Data rows (most critical first) ────────────────────
  const sorted = [...machines].sort((a, b) => a.daysToFailure - b.daysToFailure);

  sorted.forEach((m, idx) => {
    const st = statusFromDays(m.daysToFailure);
    const row = ws.getRow(7 + idx);
    row.values = [
      m.machineID, m.model, m.age, m.daysToFailure,
      m.volt, m.rotate, m.pressure, m.vibration,
      m.underMaintenance ? "Yes" : "-", st,
    ];
    row.height = 18;

    const banded = idx % 2 === 1;
    row.eachCell((cell, col) => {
      cell.border = THIN_BORDER;
      if (banded) cell.fill = solidFill(BAND_ARGB);
      cell.alignment = { vertical: "middle", horizontal: col === 1 || col === 2 ? "left" : "center" };
    });

    row.getCell(1).font = { bold: true, color: { argb: "FF1E4D8C" } };

    const daysCell = row.getCell(4);
    daysCell.numFmt = "0.0";
    daysCell.font = { bold: true, color: { argb: STATUS_ARGB[st] } };

    for (const col of [5, 6, 7, 8]) row.getCell(col).numFmt = "0.0";

    const maintCell = row.getCell(9);
    if (m.underMaintenance) maintCell.font = { bold: true, color: { argb: "FF2A5896" } };

    const statusCell = row.getCell(10);
    statusCell.fill = solidFill(STATUS_ARGB[st]);
    statusCell.font = { bold: true, color: { argb: WHITE_ARGB } };
  });

  // ── Download ───────────────────────────────────────────
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = now.toISOString().slice(0, 10);
  a.href = url;
  a.download = `RUL_Prediction_Report_${stamp}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

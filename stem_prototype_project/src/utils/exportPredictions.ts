import ExcelJS from "exceljs";
import {
  statusFromDays,
  type MachinePrediction,
  type RiskStatus,
} from "../../data/modelData";
import {
  WHITE_ARGB, HEADER_ARGB, BAND_ARGB, THIN_BORDER,
  solidFill, addReportTitle, addSummaryBand, addHeaderRow, downloadWorkbook,
} from "./excelReportStyles";

// Matches STATUS_COLOR in modelData.ts (ARGB, no leading #)
const STATUS_ARGB: Record<RiskStatus, string> = {
  Critical: "FFD9534F",
  Warning: "FFE8A33D",
  Watch: "FF5FA8E8",
  Normal: "FF2FAB6F",
};

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

  const now = new Date();
  addReportTitle(
    ws, "J",
    "Machine RUL Prediction Report",
    `Generated ${now.toLocaleString()}  ·  ${machines.length} machines  ·  Model: XGBoost (days-to-failure)`,
  );

  // ── Status summary band (row 4) ────────────────────────
  const counts: Record<RiskStatus, number> = { Critical: 0, Warning: 0, Watch: 0, Normal: 0 };
  for (const m of machines) counts[statusFromDays(m.daysToFailure)]++;

  addSummaryBand(ws, 4, [
    { range: "A4:B4", label: `Total: ${machines.length}`, argb: HEADER_ARGB },
    { range: "C4:D4", label: `Critical: ${counts.Critical}`, argb: STATUS_ARGB.Critical },
    { range: "E4:F4", label: `Warning: ${counts.Warning}`, argb: STATUS_ARGB.Warning },
    { range: "G4:H4", label: `Watch: ${counts.Watch}`, argb: STATUS_ARGB.Watch },
    { range: "I4:J4", label: `Normal: ${counts.Normal}`, argb: STATUS_ARGB.Normal },
  ]);

  // ── Header row (row 6) ─────────────────────────────────
  addHeaderRow(ws, 6, [
    "Machine ID", "Model", "Age", "Days To Failure",
    "Volt", "Rotate", "Pressure", "Vibration",
    "Maintenance", "Status",
  ]);
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

  const stamp = now.toISOString().slice(0, 10);
  await downloadWorkbook(wb, `RUL_Prediction_Report_${stamp}.xlsx`);
}

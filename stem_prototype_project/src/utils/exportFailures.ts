import ExcelJS from "exceljs";
import type { FailureEvent, FailureComponent } from "../../data/failureData";
import { COMPONENT_LABEL } from "../lib/componentLabels";
import {
  WHITE_ARGB, HEADER_ARGB, BAND_ARGB, THIN_BORDER,
  solidFill, addReportTitle, addSummaryBand, addHeaderRow, downloadWorkbook,
} from "./excelReportStyles";

// Matches COMPONENT_COLOR in failureData.ts (ARGB, no leading #)
const COMPONENT_ARGB: Record<FailureComponent, string> = {
  Comp1: "FF5FA8E8",
  Comp2: "FFD9534F",
  Comp3: "FFE8A33D",
  Comp4: "FF9C6BD9",
};

const STATUS_ARGB: Record<FailureEvent["status"], string> = {
  Done: "FF2FAB6F",
  Open: "FFE8A33D",
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export async function exportFailuresXlsx(events: FailureEvent[]) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "STEM Predictive Maintenance";
  wb.created = new Date();

  const ws = wb.addWorksheet("Failure Events", {
    views: [{ state: "frozen", ySplit: 6 }],
  });

  ws.columns = [
    { key: "id", width: 13 },
    { key: "datetime", width: 19 },
    { key: "machineID", width: 13 },
    { key: "component", width: 15 },
    { key: "triggeredBy", width: 18 },
    { key: "recovery", width: 13 },
    { key: "status", width: 11 },
  ];

  const now = new Date();
  const counts: Record<FailureComponent, number> = { Comp1: 0, Comp2: 0, Comp3: 0, Comp4: 0 };
  for (const e of events) counts[e.component]++;
  const openCount = events.filter((e) => e.status === "Open").length;

  addReportTitle(
    ws, "G",
    "Failure Events Report",
    `Generated ${now.toLocaleString()}  ·  ${events.length} events  ·  ${openCount} open`,
  );

  // ── Component summary band (row 4) ─────────────────────
  addSummaryBand(ws, 4, [
    { range: "A4", label: `Total: ${events.length}`, argb: HEADER_ARGB },
    { range: "B4", label: `${COMPONENT_LABEL.Comp1}: ${counts.Comp1}`, argb: COMPONENT_ARGB.Comp1 },
    { range: "C4:D4", label: `${COMPONENT_LABEL.Comp2}: ${counts.Comp2}`, argb: COMPONENT_ARGB.Comp2 },
    { range: "E4", label: `${COMPONENT_LABEL.Comp3}: ${counts.Comp3}`, argb: COMPONENT_ARGB.Comp3 },
    { range: "F4:G4", label: `${COMPONENT_LABEL.Comp4}: ${counts.Comp4}`, argb: COMPONENT_ARGB.Comp4 },
  ]);

  // ── Header row (row 6) ─────────────────────────────────
  addHeaderRow(ws, 6, [
    "Event ID", "Date & Time", "Machine", "Component",
    "Triggered By", "Recovery (h)", "Status",
  ]);
  ws.autoFilter = { from: "A6", to: "G6" };

  // ── Data rows (most recent first) ──────────────────────
  const sorted = [...events].sort((a, b) => b.datetime.localeCompare(a.datetime));

  sorted.forEach((e, idx) => {
    const row = ws.getRow(7 + idx);
    row.values = [
      e.id,
      formatDateTime(e.datetime),
      e.machineID,
      COMPONENT_LABEL[e.component],
      e.triggeredBy,
      e.recoveryHours,
      e.status,
    ];
    row.height = 18;

    const banded = idx % 2 === 1;
    row.eachCell((cell, col) => {
      cell.border = THIN_BORDER;
      if (banded) cell.fill = solidFill(BAND_ARGB);
      cell.alignment = { vertical: "middle", horizontal: col === 5 ? "left" : "center" };
    });

    row.getCell(1).font = { bold: true, color: { argb: "FF1E4D8C" } };
    row.getCell(3).font = { bold: true, color: { argb: "FF1E4D8C" } };

    const compCell = row.getCell(4);
    compCell.font = { bold: true, color: { argb: COMPONENT_ARGB[e.component] } };

    row.getCell(6).numFmt = "0";

    const statusCell = row.getCell(7);
    statusCell.fill = solidFill(STATUS_ARGB[e.status]);
    statusCell.font = { bold: true, color: { argb: WHITE_ARGB } };
  });

  const stamp = now.toISOString().slice(0, 10);
  await downloadWorkbook(wb, `Failure_Events_Report_${stamp}.xlsx`);
}

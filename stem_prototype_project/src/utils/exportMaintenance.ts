import ExcelJS from "exceljs";
import {
  isOverdue, formatTime,
  type MaintenanceJob, type MaintenanceStatus, type MaintenanceType,
} from "../../data/maintenanceData";
import {
  WHITE_ARGB, HEADER_ARGB, BAND_ARGB, THIN_BORDER,
  solidFill, addReportTitle, addSummaryBand, addHeaderRow, downloadWorkbook,
} from "./excelReportStyles";

// Matches STATUS_COLOR_MAINT / TYPE_COLOR in maintenanceData.ts (ARGB, no leading #)
const STATUS_ARGB: Record<MaintenanceStatus, string> = {
  Scheduled: "FF5FA8E8",
  InProgress: "FFE8A33D",
  Completed: "FF2FAB6F",
  Cancelled: "FF9AA9BE",
};

const TYPE_ARGB: Record<MaintenanceType, string> = {
  Preventive: "FF5FA8E8",
  Corrective: "FFD9534F",
  Inspection: "FFE8A33D",
  Replacement: "FF9C6BD9",
};

const OVERDUE_ARGB = "FFD9534F";

const SLOT_LABEL: Record<MaintenanceJob["timeSlot"], string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  full: "Full Day",
};

export async function exportMaintenanceXlsx(jobs: MaintenanceJob[]) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "STEM Predictive Maintenance";
  wb.created = new Date();

  const ws = wb.addWorksheet("Maintenance Schedule", {
    views: [{ state: "frozen", ySplit: 6 }],
  });

  ws.columns = [
    { key: "id", width: 11 },
    { key: "date", width: 13 },
    { key: "time", width: 16 },
    { key: "machineID", width: 11 },
    { key: "type", width: 14 },
    { key: "technician", width: 24 },
    { key: "duration", width: 13 },
    { key: "status", width: 13 },
    { key: "notes", width: 32 },
  ];

  const now = new Date();
  const overdueCount = jobs.filter(isOverdue).length;
  addReportTitle(
    ws, "I",
    "Maintenance Schedule Report",
    `Generated ${now.toLocaleString()}  ·  ${jobs.length} jobs  ·  ${overdueCount} overdue`,
  );

  // ── Status summary band (row 4) ────────────────────────
  const counts: Record<MaintenanceStatus, number> = {
    Scheduled: 0, InProgress: 0, Completed: 0, Cancelled: 0,
  };
  for (const j of jobs) counts[j.status]++;

  addSummaryBand(ws, 4, [
    { range: "A4", label: `Total: ${jobs.length}`, argb: HEADER_ARGB },
    { range: "B4:C4", label: `Scheduled: ${counts.Scheduled}`, argb: STATUS_ARGB.Scheduled },
    { range: "D4:E4", label: `In Progress: ${counts.InProgress}`, argb: STATUS_ARGB.InProgress },
    { range: "F4:G4", label: `Completed: ${counts.Completed}`, argb: STATUS_ARGB.Completed },
    { range: "H4:I4", label: `Cancelled: ${counts.Cancelled}`, argb: STATUS_ARGB.Cancelled },
  ]);

  // ── Header row (row 6) ─────────────────────────────────
  addHeaderRow(ws, 6, [
    "Job ID", "Date", "Time Slot", "Machine",
    "Type", "Technician", "Duration (h)", "Status", "Notes",
  ]);
  ws.autoFilter = { from: "A6", to: "I6" };

  // ── Data rows (soonest first) ──────────────────────────
  const sorted = [...jobs].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return formatTime(a.timeSlot).localeCompare(formatTime(b.timeSlot));
  });

  sorted.forEach((j, idx) => {
    const overdue = isOverdue(j);
    const row = ws.getRow(7 + idx);
    row.values = [
      j.id,
      overdue ? `${j.date} (OVERDUE)` : j.date,
      `${SLOT_LABEL[j.timeSlot]} ${formatTime(j.timeSlot)}`,
      j.machineID,
      j.type,
      j.technician,
      j.durationHours,
      j.status === "InProgress" ? "In Progress" : j.status,
      j.notes || "-",
    ];
    row.height = 18;

    const banded = idx % 2 === 1;
    row.eachCell((cell, col) => {
      cell.border = THIN_BORDER;
      if (banded) cell.fill = solidFill(BAND_ARGB);
      cell.alignment = {
        vertical: "middle",
        horizontal: col === 6 || col === 9 ? "left" : "center",
      };
    });

    row.getCell(1).font = { bold: true, color: { argb: "FF1E4D8C" } };

    const dateCell = row.getCell(2);
    if (overdue) dateCell.font = { bold: true, color: { argb: OVERDUE_ARGB } };

    row.getCell(4).font = { bold: true, color: { argb: "FF1E4D8C" } };

    const typeCell = row.getCell(5);
    typeCell.font = { bold: true, color: { argb: TYPE_ARGB[j.type] } };

    row.getCell(7).numFmt = "0";

    const statusCell = row.getCell(8);
    statusCell.fill = solidFill(STATUS_ARGB[j.status]);
    statusCell.font = { bold: true, color: { argb: WHITE_ARGB } };
  });

  const stamp = now.toISOString().slice(0, 10);
  await downloadWorkbook(wb, `Maintenance_Schedule_Report_${stamp}.xlsx`);
}

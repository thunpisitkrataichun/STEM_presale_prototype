import ExcelJS from "exceljs";

// Shared palette for exported reports (matches pdm-theme.css, ARGB no leading #)
export const WHITE_ARGB = "FFFFFFFF";
export const HEADER_ARGB = "FF1E4D8C"; // --blue-800
export const TITLE_ARGB = "FF14365F"; // --blue-900
export const BAND_ARGB = "FFF4F9FE"; // --blue-25
export const MUTED_ARGB = "FF6F8BAB"; // --ink-muted

export const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFD6E4F5" } },
  left: { style: "thin", color: { argb: "FFD6E4F5" } },
  bottom: { style: "thin", color: { argb: "FFD6E4F5" } },
  right: { style: "thin", color: { argb: "FFD6E4F5" } },
};

export function solidFill(argb: string): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

/** Merged title bar on row 1 + italic subtitle on row 2. */
export function addReportTitle(
  ws: ExcelJS.Worksheet,
  lastCol: string,
  titleText: string,
  subtitleText: string,
) {
  ws.mergeCells(`A1:${lastCol}1`);
  const title = ws.getCell("A1");
  title.value = titleText;
  title.font = { name: "Calibri", size: 16, bold: true, color: { argb: WHITE_ARGB } };
  title.fill = solidFill(TITLE_ARGB);
  title.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(1).height = 32;

  ws.mergeCells(`A2:${lastCol}2`);
  const subtitle = ws.getCell("A2");
  subtitle.value = subtitleText;
  subtitle.font = { name: "Calibri", size: 10, italic: true, color: { argb: MUTED_ARGB } };
  subtitle.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(2).height = 18;
}

export interface SummaryChip {
  range: string; // e.g. "C4:D4" or single cell "A4"
  label: string;
  argb: string;
}

/** Row of colored count chips (row 4 by convention). */
export function addSummaryBand(ws: ExcelJS.Worksheet, rowNum: number, chips: SummaryChip[]) {
  for (const chip of chips) {
    if (chip.range.includes(":")) ws.mergeCells(chip.range);
    const c = ws.getCell(chip.range.split(":")[0]);
    c.value = chip.label;
    c.font = { bold: true, color: { argb: WHITE_ARGB }, size: 11 };
    c.fill = solidFill(chip.argb);
    c.alignment = { vertical: "middle", horizontal: "center" };
  }
  ws.getRow(rowNum).height = 22;
}

/** Bold white-on-blue header row with borders. */
export function addHeaderRow(ws: ExcelJS.Worksheet, rowNum: number, headers: string[]) {
  const headerRow = ws.getRow(rowNum);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: WHITE_ARGB }, size: 11 };
    cell.fill = solidFill(HEADER_ARGB);
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = THIN_BORDER;
  });
  headerRow.height = 24;
}

/** Serialize workbook and trigger a browser download. */
export async function downloadWorkbook(wb: ExcelJS.Workbook, filename: string) {
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import type {
  ExportCellValue,
  ExportColumn,
  ExportResult,
  PdfExportOptions,
  SpreadsheetExportOptions,
} from "./types"

function sanitizeFileName(value: string): string {
  return value.trim().replace(/[<>:"/\\|?*\u0000-\u001F]+/g, "_").replace(/\s+/g, "_") || "export"
}

function normalizeSheetName(value: string): string {
  return value.trim().slice(0, 31) || "Sheet1"
}

function getCellValue<T>(row: T, column: ExportColumn<T>): ExportCellValue {
  if (typeof column.accessor === "function") {
    return column.accessor(row)
  }

  return row[column.accessor] as ExportCellValue
}

function getDisplayValue(value: ExportCellValue): string | number | boolean | Date {
  if (value instanceof Date) return value
  if (typeof value === "number" || typeof value === "boolean") return value
  return value == null ? "" : String(value)
}

function getTextValue(value: ExportCellValue): string {
  if (value instanceof Date) {
    return value.toLocaleDateString("en-GB")
  }

  if (value == null) return ""
  return String(value)
}

function buildSheetMatrix<T>(rows: T[], columns: ExportColumn<T>[]) {
  const headers = columns.map((column) => column.header)
  const body = rows.map((row) => columns.map((column) => getDisplayValue(getCellValue(row, column))))
  return [headers, ...body]
}

export function exportSpreadsheetData<T>(options: SpreadsheetExportOptions<T>): ExportResult {
  const validSheets = options.sheets.filter((sheet) => sheet.columns.length > 0)

  if (validSheets.length === 0) {
    return { ok: false, reason: "invalid-columns" }
  }

  const hasAnyRows = validSheets.some((sheet) => sheet.rows.length > 0)
  if (!hasAnyRows) {
    return { ok: false, reason: "empty" }
  }

  const safeFileName = sanitizeFileName(options.fileName)

  if (options.format === "csv") {
    const [firstSheet] = validSheets
    const sheet = XLSX.utils.aoa_to_sheet(buildSheetMatrix(firstSheet.rows, firstSheet.columns), {
      cellDates: true,
    })
    const csv = XLSX.utils.sheet_to_csv(sheet)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${safeFileName}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return { ok: true, fileName: `${safeFileName}.csv`, format: "csv" }
  }

  const workbook = XLSX.utils.book_new()

  validSheets.forEach((sheetConfig) => {
    const worksheet = XLSX.utils.aoa_to_sheet(buildSheetMatrix(sheetConfig.rows, sheetConfig.columns), {
      cellDates: true,
    })

    worksheet["!cols"] = sheetConfig.columns.map((column) => ({
      wch: column.width ?? Math.max(column.header.length + 2, 14),
    }))

    XLSX.utils.book_append_sheet(workbook, worksheet, normalizeSheetName(sheetConfig.name))
  })

  XLSX.writeFile(workbook, `${safeFileName}.xlsx`, {
    compression: true,
  })

  return { ok: true, fileName: `${safeFileName}.xlsx`, format: "xlsx" }
}

function renderPdfTableHeader<T>(
  doc: jsPDF,
  columns: ExportColumn<T>[],
  columnWidths: number[],
  startX: number,
  startY: number,
  lineHeight: number,
  cellPadding: number
) {
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)

  let cursorX = startX
  columns.forEach((column, index) => {
    const width = columnWidths[index]
    const textLines = doc.splitTextToSize(column.header, Math.max(width - cellPadding * 2, 8))
    const headerHeight = Math.max(textLines.length * lineHeight + cellPadding * 2, 8)
    doc.rect(cursorX, startY, width, headerHeight)
    doc.text(textLines, cursorX + cellPadding, startY + cellPadding + lineHeight - 1)
    cursorX += width
  })

  doc.setFont("helvetica", "normal")

  const tallestHeader = Math.max(
    ...columns.map((column, index) => {
      const width = columnWidths[index]
      const textLines = doc.splitTextToSize(column.header, Math.max(width - cellPadding * 2, 8))
      return Math.max(textLines.length * lineHeight + cellPadding * 2, 8)
    })
  )

  return startY + tallestHeader
}

function renderPdfDocumentHeader<T>(
  doc: jsPDF,
  options: PdfExportOptions<T>,
  pageWidth: number,
  marginX: number,
  startY: number
) {
  const contentWidth = pageWidth - marginX * 2
  let cursorY = startY

  if (options.companyName) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    const companyNameLines = doc.splitTextToSize(options.companyName, contentWidth * 0.66)
    doc.text(companyNameLines, marginX, cursorY)
    cursorY += companyNameLines.length * 5
  }

  if (options.companyAddress) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.5)
    const addressLines = doc.splitTextToSize(options.companyAddress, contentWidth * 0.8)
    doc.text(addressLines, marginX, cursorY)
    cursorY += addressLines.length * 3.8 + 2
  }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.text(options.title, pageWidth / 2, cursorY, { align: "center" })
  cursorY += 7

  if (options.subtitle) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.5)
    const subtitleLines = doc.splitTextToSize(options.subtitle, contentWidth)
    doc.text(subtitleLines, pageWidth / 2, cursorY, { align: "center" })
    cursorY += subtitleLines.length * 3.8 + 2
  }

  doc.setDrawColor(180)
  doc.line(marginX, cursorY, pageWidth - marginX, cursorY)

  return cursorY + 4
}

export function exportTablePdf<T>(options: PdfExportOptions<T>): ExportResult {
  if (options.columns.length === 0) {
    return { ok: false, reason: "invalid-columns" }
  }

  if (options.rows.length === 0) {
    return { ok: false, reason: "empty" }
  }

  const safeFileName = sanitizeFileName(options.fileName)
  const doc = new jsPDF({
    orientation: options.orientation ?? "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 10
  const marginTop = 10
  const marginBottom = 12
  const contentWidth = pageWidth - marginX * 2
  const cellPadding = 1.2
  const lineHeight = 3.6
  const weights = options.columns.map((column) => column.pdfWidth ?? column.width ?? 1)
  const totalWeight = weights.reduce((sum, value) => sum + value, 0)
  const columnWidths = weights.map((weight) => (contentWidth * weight) / totalWeight)
  let cursorY = renderPdfDocumentHeader(doc, options, pageWidth, marginX, marginTop)
  cursorY = renderPdfTableHeader(doc, options.columns, columnWidths, marginX, cursorY, lineHeight, cellPadding)

  options.rows.forEach((row) => {
    const cellLines = options.columns.map((column, index) =>
      doc.splitTextToSize(
        getTextValue(getCellValue(row, column)),
        Math.max(columnWidths[index] - cellPadding * 2, 8)
      )
    )

    const rowHeight = Math.max(
      ...cellLines.map((lines) => Math.max(lines.length * lineHeight + cellPadding * 2, 8))
    )

    if (cursorY + rowHeight > pageHeight - marginBottom) {
      doc.addPage()
      cursorY = renderPdfDocumentHeader(doc, options, pageWidth, marginX, marginTop)
      cursorY = renderPdfTableHeader(doc, options.columns, columnWidths, marginX, cursorY, lineHeight, cellPadding)
    }

    let cursorX = marginX
    options.columns.forEach((_, index) => {
      const width = columnWidths[index]
      doc.rect(cursorX, cursorY, width, rowHeight)
      doc.text(cellLines[index], cursorX + cellPadding, cursorY + cellPadding + lineHeight - 1)
      cursorX += width
    })

    cursorY += rowHeight
  })

  doc.save(`${safeFileName}.pdf`)

  return { ok: true, fileName: `${safeFileName}.pdf`, format: "pdf" }
}

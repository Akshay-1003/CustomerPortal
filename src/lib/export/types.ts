export type ExportCellValue = string | number | boolean | Date | null | undefined

export type SpreadsheetExportFormat = "csv" | "xlsx"
export type DownloadFormat = "pdf" | SpreadsheetExportFormat

export interface ExportColumn<T> {
  key: string
  header: string
  accessor: keyof T | ((row: T) => ExportCellValue)
  width?: number
  pdfWidth?: number
}

export interface ExportSheet<T> {
  name: string
  rows: T[]
  columns: ExportColumn<T>[]
}

export interface SpreadsheetExportOptions<T> {
  fileName: string
  format: SpreadsheetExportFormat
  sheets: ExportSheet<T>[]
}

export interface PdfExportOptions<T> {
  fileName: string
  title: string
  companyName?: string
  companyAddress?: string
  subtitle?: string
  rows: T[]
  columns: ExportColumn<T>[]
  orientation?: "portrait" | "landscape"
}

export type ExportResult =
  | {
      ok: true
      fileName: string
      format: DownloadFormat
    }
  | {
      ok: false
      reason: "empty" | "invalid-columns"
    }

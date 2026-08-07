import { useCallback, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { PrintPreviewActions } from "@/components/export/PrintPreviewActions"
import { exportSpreadsheetData, exportTablePdf } from "@/lib/export/export.service"
import type { DownloadFormat, ExportColumn } from "@/lib/export/types"
import "./CalibrationDueReportPrintPreview.css"

export type CalibrationDueReportPrintRow = {
  serialNo: number
  gaugeName: string
  identificationNo: string
  calibrationFrequency: string
  lastCalibrationDate: string
  dueDate: string
  daysWindow: string
  currentStatus: string
}

type CalibrationDueReportPrintPreviewProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  rows: CalibrationDueReportPrintRow[]
  companyName: string
  companyAddress?: string
  selectedPeriodLabel: string
}

const CALIBRATION_DUE_EXPORT_COLUMNS: ExportColumn<CalibrationDueReportPrintRow>[] = [
  { key: "serialNo", header: "SN", accessor: "serialNo", width: 8, pdfWidth: 8 },
  { key: "gaugeName", header: "Gauge Name", accessor: "gaugeName", width: 26, pdfWidth: 26 },
  { key: "identificationNo", header: "Identification No.", accessor: "identificationNo", width: 18, pdfWidth: 18 },
  { key: "calibrationFrequency", header: "Calibration Frequency", accessor: "calibrationFrequency", width: 18, pdfWidth: 18 },
  { key: "lastCalibrationDate", header: "Last Calibration Date", accessor: "lastCalibrationDate", width: 18, pdfWidth: 18 },
  { key: "dueDate", header: "Due Date", accessor: "dueDate", width: 16, pdfWidth: 16 },
  { key: "currentStatus", header: "Status", accessor: "currentStatus", width: 16, pdfWidth: 16 },
]

function formatPlanningTitle(selectedPeriodLabel: string): string {
  const [month = selectedPeriodLabel, year = ""] = selectedPeriodLabel.trim().split(/\s+/)
  return year ? `Calibration Planning - ${month} - ${year}` : `Calibration Planning - ${selectedPeriodLabel}`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function buildPrintHtml(
  rows: CalibrationDueReportPrintRow[],
  companyName: string,
  companyAddress: string,
  selectedPeriodLabel: string
) {
  const planningTitle = formatPlanningTitle(selectedPeriodLabel)
  const rowsHtml = rows
    .map(
      (row) => `
        <tr>
          <td class="cdr-col-sn">${row.serialNo}</td>
          <td>${escapeHtml(row.gaugeName)}</td>
          <td>${escapeHtml(row.identificationNo)}</td>
          <td>${escapeHtml(row.calibrationFrequency)}</td>
          <td>${escapeHtml(row.lastCalibrationDate)}</td>
          <td>${escapeHtml(row.dueDate)}</td>
          <td>${escapeHtml(row.currentStatus)}</td>
        </tr>
      `
    )
    .join("")

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Calibration Planning</title>
        <style>
          @page { size: A4 portrait; margin: 8mm; }
          * { box-sizing: border-box; }
          body { margin: 0; color: #111; font-family: Arial, sans-serif; }
          .print-header { margin-bottom: 8px; }
          .company-name { font-size: 20px; font-weight: 700; line-height: 1.15; }
          .company-address { margin-top: 2px; font-size: 10px; line-height: 1.35; color: #374151; }
          .doc-title { margin: 12px 0 8px; text-align: center; font-size: 18px; font-weight: 700; line-height: 1.2; }
          .print-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          .print-table th, .print-table td {
            border: 1px solid #6b7280;
            padding: 5px 6px;
            font-size: 9.5px;
            line-height: 1.25;
            vertical-align: top;
            text-align: left;
            word-break: break-word;
          }
          .cdr-col-sn { width: 42px; min-width: 42px; max-width: 42px; }
          .print-table th { background: #f3f4f6; font-weight: 700; }
          thead { display: table-header-group; }
        </style>
      </head>
      <body>
        <header class="print-header">
          <div class="company-name">${escapeHtml(companyName)}</div>
          <div class="company-address">${escapeHtml(companyAddress)}</div>
          <div class="doc-title">${escapeHtml(planningTitle)}</div>
        </header>
        <table class="print-table">
          <thead>
            <tr>
              <th class="cdr-col-sn">SN</th>
              <th>Gauge Name</th>
              <th>Identification No.</th>
              <th>Cal. Freq.</th>
              <th>Last Cal. Date</th>
              <th>Next Cal. Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body>
    </html>
  `
}

export function CalibrationDueReportPrintPreview({
  open,
  onOpenChange,
  rows,
  companyName,
  companyAddress = "Address not available",
  selectedPeriodLabel,
}: CalibrationDueReportPrintPreviewProps) {
  const previewRows = useMemo(() => rows, [rows])
  const planningTitle = useMemo(() => formatPlanningTitle(selectedPeriodLabel), [selectedPeriodLabel])
  const fileName = useMemo(
    () => `${companyName}_calibration_due_report_${selectedPeriodLabel}`,
    [companyName, selectedPeriodLabel]
  )

  const onPrint = useCallback(() => {
    const iframe = document.createElement("iframe")
    iframe.style.position = "fixed"
    iframe.style.right = "0"
    iframe.style.bottom = "0"
    iframe.style.width = "0"
    iframe.style.height = "0"
    iframe.style.border = "0"
    document.body.appendChild(iframe)

    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return

    const html = buildPrintHtml(rows, companyName, companyAddress, selectedPeriodLabel)
    doc.open()
    doc.write(html)
    doc.close()

    setTimeout(() => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 500)
    }, 250)
  }, [rows, companyAddress, companyName, selectedPeriodLabel])

  const onDownload = useCallback((format: DownloadFormat) => {
    const result =
      format === "pdf"
        ? exportTablePdf({
            fileName,
            title: "Calibration Planning",
            subtitle: selectedPeriodLabel,
            companyName,
            companyAddress,
            rows,
            columns: CALIBRATION_DUE_EXPORT_COLUMNS,
          })
        : exportSpreadsheetData({
            fileName,
            format,
            sheets: [
              {
                name: "Calibration Planning",
                rows,
                columns: CALIBRATION_DUE_EXPORT_COLUMNS,
              },
            ],
          })

    if (!result.ok) {
      toast.error(
        result.reason === "empty"
          ? "No rows available to export."
          : "Unable to export because the report columns are not configured."
      )
      return
    }

    toast.success(`${result.format.toUpperCase()} export downloaded successfully.`)
  }, [companyAddress, companyName, fileName, rows, selectedPeriodLabel])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[96vw] p-0">
        <div className="cdr-print-preview-root">
          <DialogHeader className="cdr-print-preview-header">
            <div className="cdr-print-preview-heading">
              <DialogTitle className="cdr-print-org-name">{companyName}</DialogTitle>
              <div className="cdr-print-org-address">{companyAddress}</div>
              <div className="cdr-preview-title">{planningTitle}</div>
            </div>
            <div className="cdr-print-preview-header-actions">
              <PrintPreviewActions disabled={rows.length === 0} onPrint={onPrint} onDownload={onDownload} />
            </div>
          </DialogHeader>

          <div className="cdr-print-preview-body">
            <section className="cdr-preview-sheet">
              <table className="cdr-preview-table">
                <thead>
                  <tr>
                    <th className="cdr-col-sn">SN</th>
                    <th>Gauge Name</th>
                    <th>Identification No.</th>
                    <th>Calibration Frequency</th>
                    <th>Last Calibration Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => (
                    <tr key={`row-${row.serialNo}`}>
                      <td>{row.serialNo}</td>
                      <td>{row.gaugeName}</td>
                      <td>{row.identificationNo}</td>
                      <td>{row.calibrationFrequency}</td>
                      <td>{row.lastCalibrationDate}</td>
                      <td>{row.dueDate}</td>
                      <td>{row.currentStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

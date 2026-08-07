import { useCallback, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { PrintPreviewActions } from "@/components/export/PrintPreviewActions"
import { exportSpreadsheetData, exportTablePdf } from "@/lib/export/export.service"
import type { DownloadFormat, ExportColumn } from "@/lib/export/types"
import "./HistoryCardPrintPreview.css"

export type HistoryCardPrintRow = {
  serialNo: number
  gaugeType: string
  specification: string
  identificationNo: string
  lastCalibrationDate: string
  frequency: string
  nextCalibrationDate: string
  remark: string
}

type HistoryCardPrintPreviewProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  rows: HistoryCardPrintRow[]
  companyName: string
  companyAddress?: string
}

const HISTORY_CARD_EXPORT_COLUMNS: ExportColumn<HistoryCardPrintRow>[] = [
  { key: "serialNo", header: "SN", accessor: "serialNo", width: 8, pdfWidth: 8 },
  { key: "gaugeType", header: "Gauge Type", accessor: "gaugeType", width: 28, pdfWidth: 28 },
  { key: "specification", header: "Specification / Size", accessor: "specification", width: 30, pdfWidth: 30 },
  { key: "identificationNo", header: "Identification No.", accessor: "identificationNo", width: 18, pdfWidth: 18 },
  { key: "lastCalibrationDate", header: "Last Calibration Date", accessor: "lastCalibrationDate", width: 18, pdfWidth: 18 },
  { key: "frequency", header: "Freq.", accessor: "frequency", width: 12, pdfWidth: 12 },
  { key: "nextCalibrationDate", header: "Next Calibration Date", accessor: "nextCalibrationDate", width: 18, pdfWidth: 18 },
  { key: "remark", header: "Remark", accessor: "remark", width: 18, pdfWidth: 18 },
]

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function buildPrintHtml(
  rows: HistoryCardPrintRow[],
  companyName: string,
  companyAddress: string
) {
  const rowsHtml = rows
    .map((row) => {
      return `
        <tr>
          <td class="sn-col">${row.serialNo}</td>
          <td>${escapeHtml(row.gaugeType)}</td>
          <td>${escapeHtml(row.specification)}</td>
          <td>${escapeHtml(row.identificationNo)}</td>
          <td>${escapeHtml(row.lastCalibrationDate)}</td>
          <td>${escapeHtml(row.frequency)}</td>
          <td>${escapeHtml(row.nextCalibrationDate)}</td>
          <td>${escapeHtml(row.remark)}</td>
        </tr>
      `
    })
    .join("")

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>History Card Print</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          * { box-sizing: border-box; }
          body { margin: 0; color: #111; font-family: Arial, sans-serif; }
          .print-page { width: 100%; min-height: 100%; }
          .print-header { margin-bottom: 8px; }
          .company-name { font-size: 20px; font-weight: 700; line-height: 1.15; }
          .company-address { font-size: 10px; color: #333; line-height: 1.3; margin-top: 2px; }
          .doc-title { margin: 8px 0 6px; text-align: center; font-size: 16px; font-weight: 700; }
          .print-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          .print-table th, .print-table td {
            border: 1px solid #6b7280;
            padding: 5px 6px;
            font-size: 9.5px;
            line-height: 1.2;
            vertical-align: top;
            text-align: left;
            word-break: break-word;
          }
          .sn-col { width: 42px; min-width: 42px; max-width: 42px; }
          .gauge-col { width: 18%; }
          .spec-col { width: 21%; }
          .identification-col { width: 14%; }
          .last-cal-col { width: 13%; }
          .freq-col { width: 8%; }
          .next-cal-col { width: 13%; }
          .remark-col { width: 13%; }
          .print-table th { background: #f3f4f6; font-weight: 700; }
          thead { display: table-header-group; }
        </style>
      </head>
      <body>
        <section class="print-page">
          <header class="print-header">
            <div class="company-name">${escapeHtml(companyName)}</div>
            <div class="company-address">${escapeHtml(companyAddress)}</div>
            <div class="doc-title">GAUGES AND INSTRUMENTS LIST</div>
          </header>
          <table class="print-table">
            <thead>
              <tr>
                <th class="sn-col">SN</th>
                <th class="gauge-col">Gauge Type</th>
                <th class="spec-col">Specification / Size</th>
                <th class="identification-col">Identification No.</th>
                <th class="last-cal-col">Last Calibration Date</th>
                <th class="freq-col">Freq.</th>
                <th class="next-cal-col">Next Calibration Date</th>
                <th class="remark-col">Remark</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </section>
      </body>
    </html>
  `
}

export function HistoryCardPrintPreview({
  open,
  onOpenChange,
  rows,
  companyName,
  companyAddress = "Address not available",
}: HistoryCardPrintPreviewProps) {
  const previewRows = useMemo(() => rows, [rows])
  const fileName = useMemo(() => `${companyName}_history_card`, [companyName])

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

    const html = buildPrintHtml(rows, companyName, companyAddress)
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
  }, [rows, companyAddress, companyName])

  const onDownload = useCallback((format: DownloadFormat) => {
    const result =
      format === "pdf"
        ? exportTablePdf({
            fileName,
            title: "Gauges and Instruments List",
            companyName,
            companyAddress,
            rows,
            columns: HISTORY_CARD_EXPORT_COLUMNS,
          })
        : exportSpreadsheetData({
            fileName,
            format,
            sheets: [
              {
                name: "History Card",
                rows,
                columns: HISTORY_CARD_EXPORT_COLUMNS,
              },
            ],
          })

    if (!result.ok) {
      toast.error(
        result.reason === "empty"
          ? "No rows available to export."
          : "Unable to export because the document columns are not configured."
      )
      return
    }

    toast.success(`${result.format.toUpperCase()} export downloaded successfully.`)
  }, [companyAddress, companyName, fileName, rows])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[96vw] p-0">
        <div className="hcl-print-preview-root">
          <DialogHeader className="hcl-print-preview-header">
            <div>
              <DialogTitle className="hcl-print-org-name">{companyName}</DialogTitle>
              <div className="hcl-print-org-address">{companyAddress}</div>
              <div className="hcl-preview-title">GAUGES AND INSTRUMENTS LIST</div>
            </div>
            <div className="hcl-print-preview-header-actions">
              <PrintPreviewActions disabled={rows.length === 0} onPrint={onPrint} onDownload={onDownload} />
            </div>
          </DialogHeader>

          <div className="hcl-print-preview-body">
            <section className="hcl-preview-sheet">
                <table className="hcl-preview-table">
                  <thead>
                    <tr>
                      <th className="hcl-col-sn">SN</th>
                      <th className="hcl-col-gauge">Gauge Type</th>
                      <th className="hcl-col-specification">Specification / Size</th>
                      <th className="hcl-col-identification">Identification No.</th>
                      <th className="hcl-col-last-calibration">Last Calibration Date</th>
                      <th className="hcl-col-frequency">Freq.</th>
                      <th className="hcl-col-next-calibration">Next Calibration Date</th>
                      <th className="hcl-col-remark">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row) => (
                      <tr key={`row-${row.serialNo}`}>
                        <td>{row.serialNo}</td>
                        <td>{row.gaugeType}</td>
                        <td>{row.specification}</td>
                        <td>{row.identificationNo}</td>
                        <td>{row.lastCalibrationDate}</td>
                        <td>{row.frequency}</td>
                        <td>{row.nextCalibrationDate}</td>
                        <td>{row.remark}</td>
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

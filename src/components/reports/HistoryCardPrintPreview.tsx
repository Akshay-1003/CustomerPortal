import { useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import "./HistoryCardPrintPreview.css"

export type HistoryCardPrintRow = {
  serialNo: number
  gaugeType: string
  specification: string
  identificationNo: string
  lastCalibrationDate: string
  frequency: string
  dueDate: string
  dayLeft: string
  gaugeLocation: string
  partName: string
  gauge_condition: string
}

type HistoryCardPrintPreviewProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  rows: HistoryCardPrintRow[]
  companyName: string
  companyAddress?: string
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
          <td>${escapeHtml(row.dueDate)}</td>
          <td>${escapeHtml(row.dayLeft)}</td>
          <td>${escapeHtml(row.gaugeLocation)}</td>
          <td>${escapeHtml(row.partName)}</td>
          <td>${escapeHtml(row.gauge_condition)}</td>
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
          @page { size: A4 portrait; margin: 12mm; }
          * { box-sizing: border-box; }
          body { margin: 0; color: #111; font-family: Arial, sans-serif; }
          .print-page { width: 100%; min-height: 100%; }
          .print-header { margin-bottom: 6px; }
          .company-name { font-size: 22px; font-weight: 700; line-height: 1.15; }
          .company-address { font-size: 11px; color: #333; line-height: 1.3; margin-top: 1px; }
          .doc-title { margin: 6px 0 4px; text-align: center; font-size: 18px; font-weight: 700; }
          .print-table { width: 100%; border-collapse: collapse; table-layout: auto; }
          .print-table th, .print-table td {
            border: 1px solid #6b7280;
            padding: 4px 5px;
            font-size: 10px;
            line-height: 1.2;
            vertical-align: top;
            text-align: left;
            word-break: break-word;
          }
          .sn-col { width: 42px; min-width: 42px; max-width: 42px; }
          .print-table th { background: #f3f4f6; font-weight: 700; }
          thead { display: table-header-group; }
        </style>
      </head>
      <body>
        <section class="print-page">
          <header class="print-header">
            <div class="company-name">${escapeHtml(companyName)}</div>
            <div class="company-address">${escapeHtml(companyAddress)}</div>
            <div class="doc-title">COMPANY GAUGE / INSTRUMENT LIST</div>
          </header>
          <table class="print-table">
            <thead>
              <tr>
                <th class="sn-col">SN</th>
                <th>Gauge Type</th>
                <th>Specification / Size</th>
                <th>Identification No.</th>
                <th>Last Calibration Date</th>
                <th>Freq.</th>
                <th>Due Date</th>
                <th>Day Left</th>
                <th>Gauge Location</th>
                <th>Part Name</th>
                <th>Remark / Actual Error</th>
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

  const onPrint = () => {
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
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[96vw] p-0">
        <div className="hcl-print-preview-root">
          <DialogHeader className="hcl-print-preview-header">
            <div>
              <DialogTitle className="hcl-print-org-name">{companyName}</DialogTitle>
              <div className="hcl-print-org-address">{companyAddress}</div>
              <div className="hcl-preview-title">COMPANY GAUGE / INSTRUMENT LIST</div>
            </div>
            <div className="hcl-print-preview-header-actions">
              <Button onClick={onPrint}>Print</Button>
            </div>
          </DialogHeader>

          <div className="hcl-print-preview-body">
            <section className="hcl-preview-sheet">
                <table className="hcl-preview-table">
                  <thead>
                    <tr>
                      <th className="hcl-col-sn">SN</th>
                      <th>Gauge Type</th>
                      <th>Specification / Size</th>
                      <th>Identification No.</th>
                      <th>Last Calibration Date</th>
                      <th>Freq.</th>
                      <th>Due Date</th>
                      <th>Day Left</th>
                      <th>Gauge Location</th>
                      <th>Part Name</th>
                      <th>Remark / Actual Error</th>
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
                        <td>{row.dueDate}</td>
                        <td>{row.dayLeft}</td>
                        <td>{row.gaugeLocation}</td>
                        <td>{row.partName}</td>
                        <td>{row.gauge_condition}</td>
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

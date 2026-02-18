import { useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import "./GaugeListPrintPreview.css"

export type GaugeListPrintRow = {
  serialNo: number
  clientOrganization: string
  name: string
  identification: string
  serial: string
  frequency: string
  remark: string
  make: string
}

type GaugeListPrintPreviewProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  rows: GaugeListPrintRow[]
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

function buildPrintHtml(rows: GaugeListPrintRow[], companyName: string, companyAddress: string) {
  const rowsHtml = rows
    .map(
      (row) => `
        <tr>
          <td class="sn-col">${row.serialNo}</td>
          <td>${escapeHtml(row.clientOrganization)}</td>
          <td>${escapeHtml(row.name)}</td>
          <td>${escapeHtml(row.identification)}</td>
          <td>${escapeHtml(row.serial)}</td>
          <td>${escapeHtml(row.frequency)}</td>
          <td>${escapeHtml(row.remark)}</td>
          <td>${escapeHtml(row.make)}</td>
        </tr>
      `
    )
    .join("")

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Gauge List Print</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          * { box-sizing: border-box; }
          body { margin: 0; color: #111; font-family: Arial, sans-serif; }
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
            text-align: left;
            vertical-align: top;
            word-break: break-word;
          }
          .sn-col { width: 42px; min-width: 42px; max-width: 42px; }
          .print-table th { background: #f3f4f6; font-weight: 700; }
          thead { display: table-header-group; }
        </style>
      </head>
      <body>
        <header class="print-header">
          <div class="company-name">${escapeHtml(companyName)}</div>
          <div class="company-address">${escapeHtml(companyAddress)}</div>
          <div class="doc-title">GAUGE LIST</div>
        </header>
        <table class="print-table">
          <thead>
            <tr>
              <th class="sn-col">SN</th>
              <th>Client Organization</th>
              <th>Gauge Name</th>
              <th>Identification</th>
              <th>Serial</th>
              <th>Calibration Frequency</th>
              <th>Remark</th>
              <th>Make</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body>
    </html>
  `
}

export function GaugeListPrintPreview({
  open,
  onOpenChange,
  rows,
  companyName,
  companyAddress = "Address not available",
}: GaugeListPrintPreviewProps) {
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
        <div className="gl-print-preview-root">
          <DialogHeader className="gl-print-preview-header">
            <div>
              <DialogTitle className="gl-print-org-name">{companyName}</DialogTitle>
              <div className="gl-print-org-address">{companyAddress}</div>
              <div className="gl-preview-title">GAUGE LIST</div>
            </div>
            <div className="gl-print-preview-header-actions">
              <Button onClick={onPrint}>Print</Button>
            </div>
          </DialogHeader>

          <div className="gl-print-preview-body">
            <section className="gl-preview-sheet">
              <table className="gl-preview-table">
                <thead>
                  <tr>
                    <th className="gl-col-sn">SN</th>
                    <th>Client Organization</th>
                    <th>Gauge Name</th>
                    <th>Identification</th>
                    <th>Serial</th>
                    <th>Calibration Frequency</th>
                    <th>Remark</th>
                    <th>Make</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => (
                    <tr key={`row-${row.serialNo}`}>
                      <td>{row.serialNo}</td>
                      <td>{row.clientOrganization}</td>
                      <td>{row.name}</td>
                      <td>{row.identification}</td>
                      <td>{row.serial}</td>
                      <td>{row.frequency}</td>
                      <td>{row.remark}</td>
                      <td>{row.make}</td>
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
